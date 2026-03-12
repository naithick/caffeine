# System Architecture

This document describes the technical internals of the Carbon Credit Trading Platform — how each component works, how they connect, and how a carbon credit flows from raw sensor data to an on-chain NFT listed on the marketplace.

---

## 1. Core Components

### Smart Contract — `contracts/CarbonCreditNFT.sol`

An ERC-721 token contract deployed on a local Hardhat EVM (or any EVM-compatible chain). It uses OpenZeppelin's `ERC721URIStorage` for on-chain metadata URI storage and `Ownable` to restrict minting to the contract owner (the deployer wallet).

**Key functions:**

| Function | Access | Description |
|---|---|---|
| `mintCredit(address to, string uri)` | `onlyOwner` | Mints a new CCNFT to the given address with the IPFS metadata URI. Returns the new `tokenId`. |
| `retireCredit(uint256 tokenId)` | Token owner | Burns the token permanently, emitting a `CreditRetired` event. |
| `revokeCredit(uint256 tokenId)` | `onlyOwner` | Regulator-level burn for fraudulent credits. |
| `addCertifier(address certifier)` | `onlyOwner` | Registers a certifier wallet in the `approvedCertifiers` mapping. |

The contract address after local deployment is `0x5FbDB2315678afecb367f032d93F642f64180aa3`. The ABI is mirrored to `backend/config/CarbonCreditNFT.json` so the Node.js backend can call it via ethers.js v6 without re-compiling.

---

### MRV Oracle — `backend/services/mrvOracle.js`

The **Measurement, Reporting & Verification (MRV) Oracle** is the automated verification engine. It simulates a satellite geospatial API that a real deployment would replace with a live provider (e.g. Sentinel Hub, Planet Labs, Google Earth Engine).

**Verification logic:**

1. Introduces a simulated 200 ms API latency.
2. Generates a random **NDVI (Normalized Difference Vegetation Index)** score in the range `[0.3, 0.9]`.
3. Checks two conditions:
   - `ndvi_score > 0.6` — vegetation health threshold.
   - `credit_quantity ≤ acreage × 15` — maximum 15 tonnes CO₂ per acre capacity check.
4. Returns `{ verified: boolean, ndvi_score: number, reason?: string }`.

If both conditions pass, the proposal is considered satellite-verified and the pipeline continues to IPFS pinning.

---

### IPFS Storage — `backend/services/ipfsService.js`

Handles off-chain metadata persistence using **Pinata**, a managed IPFS pinning service.

**Flow:**

1. Receives a JSON metadata object (project name, coordinates, credit quantity, sensor readings, NDVI score, ZK-Proof hash).
2. POSTs the object to `https://api.pinata.cloud/pinning/pinJSONToIPFS` with `pinata_api_key` and `pinata_secret_api_key` headers.
3. Returns the **IPFS CID** (Content Identifier) — a deterministic content-addressed hash (e.g. `QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`).

The CID is then formatted as `ipfs://<CID>` and passed to `mintCredit()` as the ERC-721 token URI, making the metadata permanently retrievable even if the backend goes down.

---

### Registry Bridge — `backend/services/registryBridge.js`

A **double-counting prevention** layer that checks whether a sensor data hash already exists in external carbon registries before allowing a credit to be minted.

**Flow:**

1. Accepts a `sensorDataHash` string (keccak256 hash of the raw sensor payload).
2. Queries a mock Verra registry endpoint: `https://mock-api.verra.org/check?hash=<hash>`.
3. Returns `true` (unique — proceed) or `false` (duplicate — reject).
4. On network failure, defaults to `true` (fail-open) to prevent the oracle pipeline from stalling due to external registry downtime.

In production, this would query Verra, Gold Standard, and ACR registries via their respective APIs and aggregate results.

---

## 2. The Asset Lifecycle

A carbon credit moves through **6 discrete steps** from raw data to a tradeable, retirable on-chain asset:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1        STEP 2           STEP 3       STEP 4     STEP 5   STEP 6  │
│                                                                           │
│  Producer  ──► MRV Oracle  ──► IPFS Pin ──► On-Chain ──► List ──► Settle │
│  Sensor        NDVI + ZK        Pinata       Mint NFT    Market   / Burn  │
│  Payload       Validation       CID                      Order           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step 1 — Producer Data Submission

A producer (land owner, reforestation project) submits a **sensor payload** containing:
- GPS coordinates of the project area
- `credit_quantity` (tonnes of CO₂ sequestered)
- `acreage` of the project
- Raw sensor readings: `ndvi_raw`, `soil_carbon_ppm`, `biomass_density_kg_m2`
- Satellite device ID and capture timestamp

This is submitted via `POST /api/proposals` and persisted to the `proposals` Supabase table with `status = 'pending'`.

---

### Step 2 — Oracle Verification (NDVI + ZK-Proof)

Triggered by `POST /api/verification/auto` (fully automated) or `POST /api/verification/review` (certifier-driven).

**Automated path:**

1. `mrvOracle.simulateSatelliteValidation()` checks NDVI score and acreage capacity.
2. If verified, a **ZK-Proof hash** is computed:
   ```js
   zkProofHash = ethers.keccak256(ethers.toUtf8Bytes(
     JSON.stringify({ ndvi_score, credit_quantity, coordinates, timestamp })
   ))
   ```
   This hash acts as a cryptographic commitment to the verification inputs — a placeholder for a real ZK-SNARK circuit in production.
3. The `registryBridge` checks the sensor hash against external registries to prevent double-counting.
4. If all checks pass, the proposal's `status` is updated to `'approved'` in Supabase.

---

### Step 3 — IPFS Metadata Pinning

The backend assembles a full NFT metadata object and pins it to IPFS via Pinata:

```json
{
  "name": "Carbon Credit — Amazon Reforestation Zone A",
  "description": "Verified carbon credit issued via automated MRV Oracle pipeline.",
  "producer_id": "...",
  "coordinates": { "lat": -3.4653, "lng": -62.2159 },
  "credit_quantity": 50,
  "sensor_data": { "device_id": "SAT-SENTINEL-2B", ... },
  "verification": {
    "ndvi_score": 0.7412,
    "zk_proof_hash": "0xabc123...",
    "verified_at": "2026-03-10T12:00:00.000Z"
  }
}
```

Pinata returns a **CID** (e.g. `QmXoypiz...`). The metadata is now permanently stored and content-addressed on IPFS.

---

### Step 4 — On-Chain NFT Minting

`blockchainService.mintCarbonCredit(recipientWallet, proposalId)` is called:

1. Constructs `tokenURI = "ipfs://<CID>"`.
2. Calls `contract.mintCredit(recipientWallet, tokenURI)` on the Hardhat EVM via ethers.js v6.
3. Waits for transaction receipt and extracts the `tokenId` from the `Transfer` event log.
4. Stores `txHash` and `tokenId` back into the `carbon_credits` Supabase table.

The NFT is now owned by the producer's wallet address on-chain, with immutable metadata stored on IPFS.

---

### Step 5 — Marketplace Listing

The producer (or backend simulator) calls `POST /api/marketplace/sell`:

- Parameters: `seller_id`, `credit_id`, `asking_price_eth`
- A `sell_orders` record is inserted into Supabase with `status = 'open'`.
- The `carbon_credits` record status is updated to `'listed'`.

The matching engine (`backend/services/matchingEngine.js`) polls for compatible buy orders and automatically settles matched pairs by transferring ownership records in Supabase.

---

### Step 6 — Escrow Settlement / Retirement

**Settlement (trade):** When a buyer calls `POST /api/marketplace/buy`, the matching engine finds a compatible sell order, updates both orders to `'matched'`, transfers `owner_id` on the `carbon_credits` record to the buyer, and records the trade.

**Retirement (burn):** A credit holder calls `POST /api/marketplace/retire`. The backend calls `contract.retireCredit(tokenId)` on-chain, which burns the NFT and emits `CreditRetired(tokenId, owner)`. The Supabase record is updated to `status = 'retired'`, permanently removing the credit from circulation and preventing it from being sold again.

---

## 3. How to Verify — Running the Full Lifecycle Simulation

### Prerequisites

Ensure all three services are running before executing the test:

```sh
# Terminal 1 — Hardhat local blockchain node
npx hardhat node

# Terminal 2 — Deploy contract (only needed once per node restart)
npx hardhat ignition deploy ignition/modules/CarbonCreditNFT.js --network localhost

# Terminal 3 — Backend API server
node backend/server.js

# Terminal 4 — Run the lifecycle simulation
node tests/simulate_full_lifecycle.js
```

Or simply use the one-click script which does all of the above automatically:

```sh
./start.sh
# Then in a new terminal:
node tests/simulate_full_lifecycle.js
```

---

### What the Simulation Does

The script (`tests/simulate_full_lifecycle.js`) exercises every component end-to-end:

1. Builds a mock sensor payload for `"Amazon Reforestation Zone A"` (50 credits, 120 acres).
2. Calls `mrvOracle.simulateSatelliteValidation()` directly (retries once if NDVI < 0.6).
3. Computes a keccak256 ZK-Proof hash from the verified result.
4. Calls `ipfsService.pinMetadataToIPFS()` to pin metadata to Pinata.
5. Calls `contract.mintCredit()` directly via ethers.js on the local Hardhat node.
6. Upserts a user, proposal, and `carbon_credits` record in Supabase.
7. Calls `POST /api/marketplace/sell` on the live backend.
8. Queries Supabase directly to assert `status = 'listed'`.

---

### Successful Terminal Output

A fully passing run produces output structured like this:

```
============================================================
  SETUP: Initializing provider, wallet, and contract
============================================================

[OK] Connected to RPC at http://127.0.0.1:8545 (block #42)
[OK] Wallet address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
[OK] Contract address: 0x5FbDB2315678afecb367f032d93F642f64180aa3

============================================================
  STEP 1: Producer generates sensor payload
============================================================

[OK] Sensor payload created:
     Project:     Amazon Reforestation Zone A
     Coordinates: -3.4653, -62.2159
     Credits:     50 tons
     Acreage:     120 acres
     Device:      SAT-SENTINEL-2B

============================================================
  STEP 2: MRV Oracle verifies sensor data
============================================================

[OK] MRV Oracle result:
     Verified:   true
     NDVI Score: 0.7412
[OK] ZK-Proof hash generated: 0x3a7bd3e2360a3d29eea436fcfb7e44255954e37ef599f7cf75e3bb4e40f50b98

============================================================
  STEP 3: Pinning metadata to IPFS via Pinata
============================================================

[OK] Metadata pinned to IPFS
     CID:  QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
     URL:  https://gateway.pinata.cloud/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco

============================================================
  STEP 4: Minting Carbon Credit NFT on-chain
============================================================

[..] Calling mintCredit(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, "ipfs://QmXoypiz...")...
[OK] Transaction sent: 0xabc123def456...7890abcdef
[OK] Transaction confirmed in block #43
[OK] NFT Minted!
     Token ID: 0
     Tx Hash:  0xabc123def456...7890abcdef
     Owner:    0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
[OK] On-chain owner verified: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

============================================================
  STEP 5: Listing token for sale on marketplace
============================================================

[OK] User record ready (id: <uuid>)
[OK] Proposal record ready (id: <uuid>)
[OK] carbon_credits record created (id: <uuid>)
[OK] Sell order created!
     Order ID:       <uuid>
     Credit ID:      <uuid>
     Asking Price:   100 (USDC)
     Status:         open

============================================================
  STEP 6: Validating carbon_credits record in Supabase
============================================================

[OK] Record found in carbon_credits table:
     ID:           <uuid>
     Token ID:     0
     Owner ID:     <uuid>
     Tx Hash:      <null or 0xabc...>
     Status:       listed
[OK] Status is 'listed' (active on marketplace) — validation passed!

============================================================
  SIMULATION COMPLETE
============================================================

Full lifecycle summary:
  Sensor payload   -> Amazon Reforestation Zone A
  MRV Oracle       -> verified (NDVI: 0.7412)
  ZK-Proof hash    -> 0x3a7bd3e2360a3d29...
  IPFS CID         -> QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
  NFT Token ID     -> 0
  Marketplace      -> listed at 100 USDC
  Supabase status  -> listed

All steps passed.
```

---

### Key Artifacts to Confirm Success

| Artifact | What to check |
|---|---|
| **Transaction Hash** | `Tx Hash: 0x...` — verify on Hardhat node logs or via `curl http://localhost:8545` |
| **IPFS CID** | `CID: Qm...` — retrieve metadata at `https://gateway.pinata.cloud/ipfs/<CID>` |
| **Token ID** | `Token ID: N` — verify ownership via `contract.ownerOf(N)` |
| **Supabase `carbon_credits.status`** | Must equal `'listed'` — visible in Supabase Table Editor |
| **Supabase `sell_orders.status`** | Must equal `'open'` — confirms marketplace listing |
| **Exit code** | Script exits with code `0` ("All steps passed.") — any failure exits with code `1` |

### Common Failure Modes

| Error message | Cause | Fix |
|---|---|---|
| `Cannot connect to RPC at http://127.0.0.1:8545` | Hardhat node not running | Run `npx hardhat node` |
| `missing required env vars` | `.env` file incomplete | Check all keys listed in README |
| `NDVI below threshold` (after retry) | Random NDVI was < 0.6 twice | Re-run; statistically rare |
| `Backend returned error` | Express server not running | Run `node backend/server.js` |
| `Pinata 401 Unauthorized` | Invalid Pinata credentials | Check `PINATA_API_KEY` / `PINATA_SECRET_KEY` |
| `Supabase insert error` | Schema not applied | Run `schema.sql` in Supabase SQL Editor |
