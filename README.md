# 🌿 CarbonX — Democratized Carbon Credit Trading

> **Tokenizing verified carbon credits as on-chain NFTs — from satellite data to settled trade in a single pipeline.**

Built at **Foundathon** · Full-stack Web3 platform · **14 milestones completed end-to-end**

---

## 🔥 Problem Statement

The voluntary carbon market processes **$2B+ annually**, yet remains gated by weeks-long manual verification, siloed registries with no cross-check mechanism, and a market structure that excludes small-scale producers. **Double-counting alone costs the market an estimated 30–40% of credit integrity** — with no automated prevention layer in place.

---

## 💡 Our Solution

CarbonX replaces the manual pipeline with a fully automated on-chain issuance system: satellite NDVI data drives an MRV Oracle, ZK-proof hashes lock in verification integrity, Pinata pins immutable metadata to IPFS, and an ERC-721 NFT is minted in seconds. A price-time priority matching engine settles trades off-chain while keeping the NFT lifecycle trustless on-chain.

| Metric | Traditional Market | CarbonX | Reference |
|---|---|---|---|
| Credit issuance time | 6–18 weeks | ~seconds (on-chain mint) | Verra VCS process |
| Double-counting prevention | Manual registry lookups | Automated keccak256 hash check via Registry Bridge | Gold Standard |
| Verification data source | Self-reported PDDs | NDVI satellite oracle (threshold > 0.6) | Sentinel Hub |
| Audit trail | PDF documents | Immutable on-chain + Supabase history table | ERC-721 standard |

---

## ✨ Features

- 🛰️ **MRV Oracle** — Automated satellite NDVI scoring (threshold > 0.6) replaces manual proposal review; capacity-checked at 15 t CO₂/acre
- 🔐 **ZK-Proof Integrity** — keccak256 commitment hash over `{ndvi_score, credit_quantity, coordinates, timestamp}` locks verification inputs; full snarkjs groth16 circuit in production
- 🪙 **ERC-721 NFT Minting** — Each verified credit is a unique on-chain token with IPFS-pinned metadata; burn-on-retire permanently removes it from supply
- 🏛️ **Registry Bridge** — Cross-checks incoming sensor hash against external registries (Verra mock) to prevent double-counting before any mint is allowed
- ⚖️ **Price-Time Priority Matching Engine** — Off-chain order book with maker pricing logic; automatically settles buy/sell pairs across 5 Supabase order-state tables
- 🪪 **KYC Verification** — Two-tier identity flow (individual + company) with document URL references, admin review, and status gating before market access
- 🔔 **Real-time Notifications + Audit Trail** — Every credit state change (`minted → listed → sold → retired`) is written to `credit_history`; users get typed notifications (`success / info / warning`)
- 🎭 **Role-Based Dashboards** — Four distinct UIs (Producer/Seller, Investor/Buyer, Verifier/Admin, Corporate) rendered from a single Zustand-driven state machine

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Frontend  (Next.js :3000)                  │
│  landing → register → KYC → role-select → dashboard    │
└────────────────────────┬────────────────────────────────┘
                         │  REST
┌────────────────────────▼────────────────────────────────┐
│           Express.js REST API  (:5000)                  │
│  /users  /kyc  /proposals  /verification                │
│  /marketplace  /history  /notifications                 │
│  /bridge/verify  /zk/verify                             │
└──────┬──────────────────────────┬───────────────────────┘
       │ Supabase SDK             │ ethers.js v6
┌──────▼──────────────┐   ┌──────▼──────────────────────┐
│  Supabase PostgreSQL│   │   Hardhat EVM  (:8545)      │
│  10 tables          │   │   CarbonCreditNFT (ERC-721) │
│  UUID PKs + enums   │   │   MarketplaceEscrow         │
│  pgcrypto ext.      │   │   ↑ Event Listener          │
└─────────────────────┘   │   (CreditSold → DB sync)    │
                          └─────────────────────────────┘
                                      │ Pinata
                          ┌───────────▼─────────────────┐
                          │   IPFS (NFT metadata CIDs)  │
                          └─────────────────────────────┘
```

### 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, shadcn/ui (Radix), Zustand, Tailwind CSS |
| Backend | Node.js, Express.js v5, ethers.js v6 |
| Database | Supabase (PostgreSQL) — 10 tables, pgcrypto, typed ENUMs |
| Blockchain | Hardhat v2, Solidity 0.8.27, OpenZeppelin v5 (ERC-721 + Ownable) |
| Smart Contracts | `CarbonCreditNFT` (ERC-721) · `MarketplaceEscrow` |
| File Storage | IPFS via Pinata (pinJSONToIPFS) |
| ZK Proofs | snarkjs v0.7 (groth16 verify) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **Supabase account** — https://supabase.com
- **Pinata IPFS account** — https://app.pinata.cloud

### Linux / macOS

```sh
# 1. Clone and enter the repo
git clone https://github.com/your-org/carbonx.git && cd carbonx

# 2. Copy and fill in environment variables
cp .env.example .env   # edit with your keys

# 3. Set up the database (Supabase SQL Editor)
#    Run schema.sql → then schema_additions.sql → then seed_data.sql (optional)

# 4. One-command launch
chmod +x start.sh
./start.sh             # add --fresh to force npm install
```

### Windows

```bat
REM Set up .env, then:
start.bat
REM or use --fresh flag:
start.bat --fresh
```

### Access URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health check | http://localhost:5000/api/health |
| Hardhat RPC | http://127.0.0.1:8545 |

---

## 📁 Project Structure

```
carbonx/
├── backend/
│   ├── controllers/          # userController, kycController, proposalController,
│   │                         # verificationController, marketplaceController,
│   │                         # creditHistoryController, notificationController,
│   │                         # registryBridgeController, zkVerificationController
│   ├── services/
│   │   ├── blockchainService.js   # ethers.js v6 — mint / retire via ERC-721
│   │   ├── mrvOracle.js           # NDVI satellite validation oracle
│   │   ├── ipfsService.js         # Pinata JSON pinning
│   │   ├── matchingEngine.js      # price-time priority order matching
│   │   ├── registryBridge.js      # double-counting prevention
│   │   ├── eventListener.js       # on-chain CreditSold → DB sync
│   │   └── zkVerificationController.js # snarkjs groth16 verify
│   ├── config/
│   │   ├── supabaseClient.js
│   │   ├── CarbonCreditNFT.json   # ABI mirror for ethers.js
│   │   └── validateEnv.js
│   ├── routes/index.js            # Express router — all 24 endpoints
│   └── server.js
├── contracts/
│   ├── CarbonCreditNFT.sol        # ERC-721 + Ownable (mint / retire / revoke)
│   └── MarketplaceEscrow.sol
├── frontend/
│   ├── app/                       # Next.js App Router (layout + page)
│   ├── components/                # 20+ React components per role
│   └── lib/                       # Zustand store, API client, TypeScript types
├── ignition/modules/              # Hardhat Ignition deployment module
├── schema.sql                     # Core DB schema (7 tables + ENUMs)
├── schema_additions.sql           # KYC, credit_history, notifications (3 tables)
├── seed_data.sql                  # Demo users + sample credits
├── start.sh / start.bat           # One-click full-stack launcher
└── hardhat.config.js
```

---

## 🔬 Core Technical Component — MRV Oracle + ZK-Proof Pipeline

The verification pipeline is the trust anchor of the entire platform. It chains four operations atomically before any NFT is minted:

| Stage | Component | What it does |
|---|---|---|
| 1. Satellite validation | `mrvOracle.js` | Scores NDVI from sensor payload; enforces NDVI > 0.6 and capacity ≤ 15 t/acre |
| 2. ZK commitment | `verificationController.js` | keccak256 hash over `{ndvi_score, credit_quantity, coordinates, timestamp}` |
| 3. Registry check | `registryBridge.js` | Hash checked against Verra mock API; rejects duplicate sensor data |
| 4. IPFS pin + mint | `ipfsService.js` + `blockchainService.js` | Metadata pinned to Pinata → CID used as ERC-721 tokenURI |

```js
// verificationController.js — auto-verify path (abbreviated)
const oracle = await simulateSatelliteValidation(proposal);
if (!oracle.verified) return res.status(400).json({ error: oracle.reason });

const zkProofHash = ethers.keccak256(ethers.toUtf8Bytes(
  JSON.stringify({
    ndvi_score:       oracle.ndvi_score,
    credit_quantity:  proposal.credit_quantity,
    coordinates:      proposal.coordinates,
    timestamp:        new Date().toISOString(),
  })
));

const isUnique = await checkExternalRegistries(sensorDataHash);
if (!isUnique) return res.status(409).json({ error: "Double-counting detected" });

const cid      = await pinMetadataToIPFS({ ...proposal, zkProofHash });
const { tokenId, txHash } = await mintCarbonCredit(recipientWallet, proposalId);
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health + uptime |
| `POST` | `/api/users/auth` | Authenticate / register via wallet address |
| `POST` | `/api/kyc/submit` | Submit KYC verification request |
| `GET` | `/api/kyc/:userId` | Get KYC status for a user |
| `POST` | `/api/kyc/review` | Admin approves / rejects KYC |
| `POST` | `/api/proposals` | Submit a new PDD proposal |
| `GET` | `/api/proposals` | List all proposals |
| `POST` | `/api/verification/review` | Certifier decision → mints NFT on approval |
| `POST` | `/api/verification/auto` | MRV Oracle auto-verification + mint |
| `POST` | `/api/marketplace/sell` | Create a sell order |
| `GET` | `/api/marketplace/sell` | List open sell orders |
| `POST` | `/api/marketplace/buy` | Place a buy order (triggers matching engine) |
| `GET` | `/api/marketplace/buy` | List open buy orders |
| `POST` | `/api/marketplace/retire` | Burn / retire a carbon credit NFT |
| `POST` | `/api/history` | Log a credit lifecycle event |
| `GET` | `/api/history/credit/:creditId` | Full lifecycle history for one credit |
| `GET` | `/api/history/user/:userId` | All credit events for a user |
| `GET` | `/api/notifications/:userId` | Get user notifications |
| `POST` | `/api/notifications` | Create a notification |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read |
| `DELETE` | `/api/notifications/:id` | Delete a notification |
| `POST` | `/api/bridge/verify` | Cross-registry double-counting check |
| `POST` | `/api/zk/verify` | Verify a ZK-SNARK proof (snarkjs groth16) |

> Full request/response examples: [`BACKEND_API_REFERENCE.md`](BACKEND_API_REFERENCE.md)

---

## ⚙️ Environment Setup

Create a `.env` file in the project root:

```env
# Supabase
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Pinata IPFS
PINATA_API_KEY=<your-pinata-api-key>
PINATA_SECRET_KEY=<your-pinata-secret-key>

# Blockchain (use Hardhat account #0 private key for local dev)
DEPLOYER_PRIVATE_KEY=<hardhat-account-0-private-key>
MINTER_PRIVATE_KEY=<hardhat-account-0-private-key>
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ESCROW_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
RPC_URL=http://127.0.0.1:8545
```

> ⚠️ Never commit real private keys or your Supabase Service Role Key.

**Database setup (Supabase SQL Editor):**
1. Run [`schema.sql`](schema.sql) — core tables + ENUMs
2. Run [`schema_additions.sql`](schema_additions.sql) — KYC, credit_history, notifications
3. *(Optional)* Run [`seed_data.sql`](seed_data.sql) — demo accounts + sample credits

**Demo accounts (after seeding):**

| Role | Email | Password |
|---|---|---|
| Project Developer | `admin@greenforest.io` | any |
| Investor | `trade@ecotrade.com` | any |
| Verifier | `audit@verraaudit.org` | any |

---

## 👥 Team

Built by a team at **Foundathon**.

---

## 📄 License

[MIT](LICENSE)
