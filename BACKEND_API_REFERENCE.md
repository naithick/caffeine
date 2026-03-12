# Backend API Reference — Carbon Credit Trading Platform

> **Base URL:** `http://localhost:5000/api`
> **Content-Type:** `application/json` (all requests)
> **Auth:** No bearer tokens — users are identified by wallet address.

---

## Quick Reference

| Method | Endpoint                    | Purpose                                    |
| ------ | --------------------------- | ------------------------------------------ |
| GET    | `/api/health`               | Server health check                        |
| POST   | `/api/users/auth`           | Register / login via wallet address        |
| POST   | `/api/kyc/submit`           | Submit KYC verification request            |
| GET    | `/api/kyc/:userId`          | Get latest KYC status for a user           |
| POST   | `/api/kyc/review`           | Admin approves/rejects KYC                 |
| POST   | `/api/proposals`            | Submit a carbon credit proposal            |
| GET    | `/api/proposals`            | List recent proposals                      |
| POST   | `/api/verification/review`  | Human certifier approves/rejects proposal  |
| POST   | `/api/verification/auto`    | MRV Oracle auto-verifies proposal          |
| POST   | `/api/marketplace/sell`     | Create a sell order                        |
| GET    | `/api/marketplace/sell`     | List all sell orders                       |
| POST   | `/api/marketplace/buy`      | Create a buy order (bid)                   |
| GET    | `/api/marketplace/buy`      | List all buy orders                        |
| POST   | `/api/marketplace/retire`   | Burn/retire a carbon credit NFT            |
| POST   | `/api/history`              | Log a credit lifecycle event               |
| GET    | `/api/history/credit/:id`   | Get lifecycle history for a credit         |
| GET    | `/api/history/user/:id`     | Get all credit events for a user           |
| GET    | `/api/notifications/:userId`| Get user notifications                     |
| POST   | `/api/notifications`        | Create a notification                      |
| PATCH  | `/api/notifications/:id/read`| Mark notification as read                 |
| DELETE | `/api/notifications/:id`    | Delete a notification                      |
| POST   | `/api/bridge/verify`        | Check for double-counting across registries|
| POST   | `/api/zk/verify`            | Verify a ZK proof                          |

---

## Data Flow (what the frontend needs to drive)

```
1. User connects wallet
       │
       ▼
2. POST /api/users/auth  ──►  { user.id, user.role }
       │
       ├─── Producer flow:
       │    3. POST /api/proposals         ──►  { proposal.id }
       │    4. POST /api/verification/auto ──►  mints NFT if NDVI passes
       │    5. POST /api/marketplace/sell   ──►  lists credit for sale
       │
       └─── Buyer flow:
            6. GET  /api/marketplace/sell   ──►  browse available credits
            7. POST /api/marketplace/buy    ──►  place a buy order
            8. On-chain: call escrow buyCredit() from wallet (ethers.js)
            9. Event listener auto-syncs DB status to 'transferred'
```

---

## Enums (important for dropdowns, badges, filters)

```
user_role:       'producer' | 'buyer' | 'certification_body'
proposal_status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
credit_status:   'minted' | 'listed' | 'transferred' | 'retired' | 'revoked'
order_status:    'open' | 'partially_filled' | 'filled' | 'cancelled'
trade_status:    'matched' | 'settling' | 'settled' | 'failed'
```

---

## Endpoints

---

### `GET /api/health`

Server uptime / connectivity check.

**Response** `200`
```json
{
  "status": "ok",
  "timestamp": "2026-03-10T05:43:51.747Z",
  "uptime": 19.43
}
```

---

### `POST /api/kyc/submit`

Submit a KYC verification request for a user.

**Request Body**
| Field                | Type   | Required | Notes                                       |
| -------------------- | ------ | -------- | ------------------------------------------- |
| `user_id`            | UUID   | yes      | The user submitting KYC                     |
| `account_type`       | string | no       | `"individual"` (default) or `"company"`      |
| `full_name`          | string | cond.    | Required for individuals                    |
| `company_name`       | string | cond.    | Required for companies                      |
| `registration_number`| string | cond.    | Required for companies                      |
| `email`              | string | yes      | Contact email                               |
| `country`            | string | yes      | Country of origin                           |

**Response** `201`
```json
{
  "kyc": {
    "id": "uuid",
    "user_id": "uuid",
    "account_type": "individual",
    "status": "pending",
    "created_at": "..."
  }
}
```

---

### `GET /api/kyc/:userId`

Get the latest KYC record for a user.

**Response** `200`
```json
{
  "kyc": { ... },
  "status": "pending" | "verified" | "rejected" | "none"
}
```

---

### `POST /api/kyc/review`

Admin reviews a KYC submission.

**Request Body**
| Field              | Type   | Required | Notes                          |
| ------------------ | ------ | -------- | ------------------------------ |
| `kyc_id`           | UUID   | yes      | The KYC record to review       |
| `reviewer_id`      | UUID   | yes      | The admin reviewing            |
| `decision`         | string | yes      | `"verified"` or `"rejected"`   |
| `rejection_reason` | string | no       | Reason if rejected             |

**Response** `200`
```json
{
  "message": "KYC verified",
  "kyc": { ... }
}
```

---

### `POST /api/users/auth`

Register a new user or return an existing user by wallet address. Call this on wallet connect.

**Request Body**
| Field            | Type   | Required | Notes                                         |
| ---------------- | ------ | -------- | --------------------------------------------- |
| `wallet_address` | string | yes      | `0x`-prefixed, 42 chars. Stored lowercase.    |
| `role`           | string | no       | `"producer"` (default), `"buyer"`, or `"certification_body"` |

**Response** `200` (existing user) / `201` (new user)
```json
{
  "user": {
    "id": "uuid",
    "wallet_address": "0x...",
    "display_name": null,
    "role": "producer",
    "created_at": "2026-03-10T...",
    "updated_at": "2026-03-10T..."
  },
  "isNew": true
}
```

**Errors**
- `400` — missing `wallet_address`
- `500` — DB error

---

### `POST /api/proposals`

Submit a new carbon credit proposal.

**Request Body**
| Field             | Type    | Required | Notes                                         |
| ----------------- | ------- | -------- | --------------------------------------------- |
| `producer_id`     | UUID    | yes      | The `user.id` of the producer                 |
| `title`           | string  | yes      | Project name                                  |
| `description`     | string  | no       | Freeform description                          |
| `credit_quantity` | integer | yes      | Number of tons (must be > 0)                  |
| `sensor_data`     | object  | no       | IoT sensor readings (JSONB)                   |
| `metadata_hash`   | string  | no       | If starts with `"0xdead"` → 409 (double-count)|

**Response** `201`
```json
{
  "proposal": {
    "id": "uuid",
    "producer_id": "uuid",
    "title": "Amazon Reforestation Zone A",
    "description": "...",
    "commodity_type": "carbon_credit",
    "credit_quantity": 50,
    "sensor_data": { ... },
    "status": "submitted",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Errors**
- `400` — missing required fields
- `409` — double-counting detected (metadata_hash starts with `0xdead`)
- `500` — DB error

---

### `GET /api/proposals`

Fetch the 20 most recent proposals (all statuses).

**Response** `200`
```json
{
  "proposals": [
    {
      "id": "uuid",
      "producer_id": "uuid",
      "title": "...",
      "status": "submitted",
      "credit_quantity": 50,
      "sensor_data": { ... },
      "created_at": "..."
    }
  ]
}
```

---

### `POST /api/verification/review`

Human-in-the-loop: a certification body approves or rejects a proposal. If approved, an NFT is minted on-chain automatically.

**Request Body**
| Field          | Type   | Required | Notes                                |
| -------------- | ------ | -------- | ------------------------------------ |
| `proposal_id`  | UUID   | yes      | The proposal to review               |
| `certifier_id` | UUID   | yes      | The `certification_bodies.id`        |
| `decision`     | string | yes      | `"approved"` or `"rejected"`         |

**Response** `200` (approved)
```json
{
  "message": "Proposal approved and carbon credit minted",
  "review": {
    "id": "uuid",
    "proposal_id": "uuid",
    "certifier_id": "uuid",
    "decision": "approved",
    "reviewed_at": "..."
  },
  "credit": {
    "id": "uuid",
    "proposal_id": "uuid",
    "owner_id": "uuid",
    "token_id": "0",
    "status": "minted"
  },
  "blockchain": {
    "txHash": "0x...",
    "tokenId": "0"
  }
}
```

**Response** `200` (rejected)
```json
{
  "message": "Proposal rejected",
  "review": { "id": "uuid", "decision": "rejected", ... }
}
```

**Errors**
- `400` — missing fields or invalid decision
- `404` — proposal not found
- `502` — blockchain mint failed

---

### `POST /api/verification/auto`

MRV Oracle auto-verification. Runs satellite NDVI scoring — if score >= 0.6, mints NFT automatically (no human certifier needed).

**Request Body**
| Field         | Type | Required | Notes                          |
| ------------- | ---- | -------- | ------------------------------ |
| `proposal_id` | UUID | yes      | The proposal to auto-verify    |

**Response** `200` (approved + minted)
```json
{
  "message": "Proposal auto-approved and carbon credit minted via MRV Oracle",
  "ndvi_score": 0.72,
  "credit": {
    "id": "uuid",
    "token_id": "1",
    "status": "minted"
  },
  "blockchain": {
    "txHash": "0x...",
    "tokenId": "1"
  }
}
```

**Response** `200` (rejected by oracle)
```json
{
  "message": "Proposal rejected by MRV Oracle",
  "ndvi_score": 0.45,
  "reason": "NDVI score 0.45 is below the threshold of 0.6"
}
```

**Errors**
- `400` — missing `proposal_id` or no wallet on file
- `404` — proposal not found
- `502` — blockchain mint failed

---

### `POST /api/marketplace/sell`

Create a sell order (list a carbon credit for sale).

**Request Body**
| Field             | Type   | Required | Notes                                     |
| ----------------- | ------ | -------- | ----------------------------------------- |
| `seller_id`       | UUID   | yes      | The `user.id` of the seller               |
| `credit_id`       | UUID   | yes      | The `carbon_credits.id` to sell            |
| `asking_price_eth`| number | yes      | Price in ETH (e.g. `1.0`)                 |

**Response** `201`
```json
{
  "order": {
    "id": "uuid",
    "seller_id": "uuid",
    "credit_id": "uuid",
    "asking_price_eth": "1.000000000000000000",
    "quantity": 1,
    "status": "open",
    "listed_at": "...",
    "created_at": "..."
  }
}
```

> **Note:** `asking_price_eth` is returned as a **string** to preserve 18-decimal precision. Parse it with `ethers.parseEther()` or `parseFloat()`.

---

### `GET /api/marketplace/sell`

List all sell orders (newest first).

**Response** `200`
```json
{
  "orders": [
    {
      "id": "uuid",
      "seller_id": "uuid",
      "credit_id": "uuid",
      "asking_price_eth": "1.000000000000000000",
      "status": "open",
      "listed_at": "..."
    }
  ]
}
```

---

### `POST /api/marketplace/buy`

Create a buy order (bid) for a carbon credit.

**Request Body**
| Field           | Type   | Required | Notes                                    |
| --------------- | ------ | -------- | ---------------------------------------- |
| `buyer_id`      | UUID   | yes      | The `user.id` of the buyer               |
| `credit_id`     | UUID   | yes      | The `carbon_credits.id` to bid on        |
| `bid_price_eth` | number | yes      | Bid price in ETH (e.g. `1.0`)           |

**Response** `201`
```json
{
  "order": {
    "id": "uuid",
    "buyer_id": "uuid",
    "credit_id": "uuid",
    "bid_price_eth": "1.000000000000000000",
    "quantity": 1,
    "status": "open",
    "placed_at": "...",
    "created_at": "..."
  }
}
```

---

### `GET /api/marketplace/buy`

List all buy orders (newest first).

**Response** `200`
```json
{
  "orders": [
    {
      "id": "uuid",
      "buyer_id": "uuid",
      "credit_id": "uuid",
      "bid_price_eth": "1.000000000000000000",
      "status": "open",
      "placed_at": "..."
    }
  ]
}
```

---

### `POST /api/marketplace/retire`

Burn a carbon credit NFT on-chain and mark it as retired in the database. Only the current owner can retire.

**Request Body**
| Field            | Type   | Required | Notes                               |
| ---------------- | ------ | -------- | ----------------------------------- |
| `token_id`       | string | yes      | On-chain NFT token ID               |
| `wallet_address` | string | yes      | Wallet address of the token owner   |

**Response** `200`
```json
{
  "message": "Carbon credit retired (burned) successfully",
  "credit": {
    "id": "uuid",
    "token_id": "0",
    "status": "retired",
    "retired_at": "2026-03-10T..."
  },
  "blockchain": {
    "txHash": "0x..."
  }
}
```

**Errors**
- `400` — missing fields
- `502` — on-chain burn failed

---

### `POST /api/bridge/verify`

Cross-registry double-counting check. Verifies a project hasn't been registered in external registries (Verra, Gold Standard, etc.).

**Request Body**
| Field           | Type   | Required | Notes                                   |
| --------------- | ------ | -------- | --------------------------------------- |
| `metadata_hash` | string | yes      | Deterministic hash of project metadata  |

**Response** `200` (clean)
```json
{
  "message": "Verification passed. No external conflicts found.",
  "verified": true
}
```

**Response** `409` (double-counted)
```json
{
  "error": "Conflict: Credit already exists in an external registry. Double-counting prevented.",
  "registry": "Simulated External Registry"
}
```

---

### `POST /api/zk/verify`

Verify a zero-knowledge proof for corporate emissions data without exposing raw supply chain data.

**Request Body**
| Field           | Type     | Required | Notes                              |
| --------------- | -------- | -------- | ---------------------------------- |
| `proof`         | object   | yes      | snarkjs Groth16 proof object       |
| `publicSignals` | string[] | yes      | Array of public signal strings     |

**Response** `200` (valid)
```json
{
  "message": "ZK Proof verified successfully. Corporate emissions thresholds met.",
  "verified": true
}
```

**Response** `400` (invalid)
```json
{
  "error": "Invalid ZK Proof.",
  "verified": false
}
```

> **MVP Note:** If no `verification_key.json` exists on the backend, the API simulates verification — any well-formed proof object with a publicSignals array returns `verified: true`.

---

## Database Tables (for reference)

These are the 6 main tables your frontend may need to understand:

| Table              | Key Fields                                                  | Notes                                |
| ------------------ | ----------------------------------------------------------- | ------------------------------------ |
| `users`            | `id`, `wallet_address`, `display_name`, `role`              | One per wallet address               |
| `proposals`        | `id`, `producer_id`, `title`, `credit_quantity`, `status`   | Status: submitted → approved/rejected|
| `carbon_credits`   | `id`, `proposal_id`, `owner_id`, `token_id`, `status`      | Lifecycle: minted→listed→transferred→retired |
| `sell_orders`      | `id`, `seller_id`, `credit_id`, `asking_price_eth`, `status` | Price as string (18 decimals)      |
| `buy_orders`       | `id`, `buyer_id`, `credit_id`, `bid_price_eth`, `status`   | Price as string (18 decimals)        |
| `trades`           | `id`, `sell_order_id`, `buy_order_id`, `credit_id`, `status` | Final trade record                 |
| `kyc_verifications`| `id`, `user_id`, `account_type`, `status`                   | Individual or company KYC records    |
| `credit_history`   | `id`, `credit_id`, `action`, `actor_id`                     | Immutable audit trail                |
| `notifications`    | `id`, `user_id`, `message`, `type`, `is_read`               | Persistent user notifications        |

---

## Smart Contracts (on-chain ops the frontend calls directly)

The frontend uses **ethers.js v6** + MetaMask to call these directly (not through the backend API):

### CarbonCreditNFT — `0x5FbDB2315678afecb367f032d93F642f64180aa3`

```solidity
// Read-only
function ownerOf(uint256 tokenId) → address
function tokenURI(uint256 tokenId) → string
function balanceOf(address owner) → uint256

// Write (requires connected wallet)
function approve(address to, uint256 tokenId)   // Approve escrow before listing
function retireCredit(uint256 tokenId)           // Burn your own credit
```

### MarketplaceEscrow — `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

```solidity
// Write (requires connected wallet)
function listCredit(uint256 tokenId, uint256 price)   // List NFT for sale
function buyCredit(uint256 tokenId) payable            // Buy listed NFT

// Events (listened to by backend automatically)
event CreditSold(uint256 tokenId, address buyer, uint256 price)
```

**Typical buy flow from frontend:**
1. Buyer calls `escrow.buyCredit(tokenId, { value: priceInWei })` via MetaMask
2. Backend event listener detects `CreditSold` event
3. `carbon_credits.status` auto-updates to `"transferred"` in Supabase
4. Frontend polls `GET /api/marketplace/sell` or reads Supabase directly

---

## Error Format

All errors follow this shape:
```json
{
  "error": "Human-readable error message",
  "details": "optional — additional context (e.g. blockchain error)"
}
```

Common HTTP status codes:
| Code | Meaning                                    |
| ---- | ------------------------------------------ |
| 200  | Success                                    |
| 201  | Created (new resource)                     |
| 400  | Bad request (missing/invalid fields)       |
| 404  | Resource not found                         |
| 409  | Conflict (double-counting)                 |
| 500  | Internal server / database error           |
| 502  | Blockchain operation failed                |

---

## Running the Backend

```bash
# Terminal 1 — Blockchain
npx hardhat node

# Terminal 2 — Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 — Backend server
node backend/server.js
# → Server on http://localhost:5000
# → Event listener polling MarketplaceEscrow every 2s
```

Test that it works:
```bash
curl http://localhost:5000/api/health
```
