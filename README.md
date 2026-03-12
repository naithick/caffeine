# 🌿 CarbonX — Democratized Carbon Credit Trading

> **Tokenizing verified carbon credits as on-chain NFTs — from satellite data to settled trade in a single pipeline.**

Built at **Foundathon** · Full-stack Web3 platform

---

## 🔥 Problem Statement

The voluntary carbon market processes **$2B+ annually**, yet remains gated by weeks-long manual verification and a market structure that excludes small-scale producers. Credit issuance relies on self-reported PDDs with no automated satellite-based validation, and audit trails live in PDF documents instead of on immutable ledgers.

---

## 💡 Our Solution

CarbonX replaces the manual pipeline with an automated on-chain issuance system: an MRV Oracle scores satellite NDVI data to validate proposals, an ERC-721 NFT is minted for each approved credit, and a price-time priority matching engine settles trades off-chain while the NFT lifecycle stays trustless on-chain.

| Metric | Traditional Market | CarbonX |
|---|---|---|
| Credit issuance time | 6–18 weeks | ~seconds (on-chain mint) |
| Verification data source | Self-reported PDDs | NDVI satellite oracle (threshold > 0.6) |
| Audit trail | PDF documents | Immutable on-chain + Supabase history table |
| Credit retirement | Registry form request | Burn NFT on-chain (permanent, verifiable) |

---

## ✨ Features

- 🛰️ **MRV Oracle** — Automated NDVI scoring validates proposals; enforces vegetation threshold > 0.6 and capacity cap of 15 t CO₂/acre
- 🪙 **ERC-721 NFT Minting** — Each verified credit is a unique on-chain token; burn-on-retire permanently removes it from supply via `retireCredit()`
- ⚖️ **Price-Time Priority Matching Engine** — Off-chain order book with maker pricing logic; automatically settles buy/sell pairs across Supabase order-state tables
- 🪪 **KYC Verification** — Two-tier identity flow (individual + company) with document references, admin review, and status gating before market access
- 🔔 **Notifications + Audit Trail** — Every credit state change (`minted → listed → sold → retired`) is logged in `credit_history`; users receive typed notifications
- 🎭 **Role-Based Dashboards** — Four distinct UIs (Producer, Investor, Verifier, Corporate) rendered from a single Zustand-driven state machine
- 📋 **PDD Proposal Workflow** — Producers submit Project Design Documents with sensor data; verifiers approve/reject → triggers on-chain mint on approval

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
└──────┬──────────────────────────┬───────────────────────┘
       │ Supabase SDK             │ ethers.js v6
┌──────▼──────────────┐   ┌──────▼──────────────────────┐
│  Supabase PostgreSQL│   │   Hardhat EVM  (:8545)      │
│  10 tables          │   │   CarbonCreditNFT (ERC-721) │
│  UUID PKs + enums   │   │   MarketplaceEscrow         │
│  pgcrypto ext.      │   │   ↑ Event Listener          │
└─────────────────────┘   │   (CreditSold → DB sync)    │
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

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **Supabase account** — https://supabase.com

### Setup & Launch

```sh
# 1. Clone and enter the repo
git clone https://github.com/naithick/caffeine.git && cd caffeine

# 2. Create .env in the project root (see Environment Setup below)

# 3. Set up the database (Supabase SQL Editor)
#    Run schema.sql → then schema_additions.sql → then seed_data.sql (optional)

# 4. One-command launch
chmod +x start.sh
./start.sh             # add --fresh to force npm install
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
├── backend/
│   ├── controllers/          # 9 controllers (user, KYC, proposals, marketplace, etc.)
│   ├── services/
│   │   ├── blockchainService.js   # ethers.js v6 — mint / retire via ERC-721
│   │   ├── mrvOracle.js           # NDVI satellite validation oracle
│   │   ├── matchingEngine.js      # price-time priority order matching
│   │   └── eventListener.js       # on-chain CreditSold → DB sync
│   ├── config/
│   │   ├── supabaseClient.js
│   │   ├── CarbonCreditNFT.json   # ABI for ethers.js
│   │   └── validateEnv.js
│   ├── routes/index.js            # Express router
│   └── server.js
├── contracts/
│   ├── CarbonCreditNFT.sol        # ERC-721 + Ownable (mint / retire / revoke)
│   └── MarketplaceEscrow.sol
├── frontend/
│   ├── app/                       # Next.js App Router (layout + page)
│   ├── components/                # 20+ React components per role
│   └── lib/                       # Zustand store, types, utilities
├── scripts/deploy.js              # Contract deployment script
├── schema.sql                     # Core DB schema (7 tables + ENUMs)
├── schema_additions.sql           # KYC, credit_history, notifications (3 tables)
├── seed_data.sql                  # Demo data
├── start.sh                       # One-click full-stack launcher
└── hardhat.config.js
```

---

## 🔬 Core Technical Component — MRV Oracle Verification Pipeline

The MRV (Measurement, Reporting & Verification) Oracle is the automated verification engine that replaces manual certifier review. It validates proposals using NDVI satellite scoring before any NFT is minted.

| Stage | Component | What it does |
|---|---|---|
| 1. Proposal submission | `proposalController.js` | Producer submits PDD with sensor data; stored as `status: 'submitted'` |
| 2. Satellite validation | `mrvOracle.js` | Scores NDVI from sensor payload; enforces NDVI > 0.6 and capacity ≤ 15 t/acre |
| 3. On-chain mint | `blockchainService.js` | Calls `contract.mintCredit()` → extracts `tokenId` from Transfer event |
| 4. Credit record | `verificationController.js` | Writes `carbon_credits` row with `txHash`, `tokenId`, `status: 'minted'` |

```js
// verificationController.js — auto-verify path (abbreviated)
const oracle = await simulateSatelliteValidation(proposal);
if (!oracle.verified) return res.status(400).json({ error: oracle.reason });

const { tokenId, txHash } = await mintCarbonCredit(recipientWallet, proposalId);

await supabase.from("carbon_credits").insert({
  proposal_id, owner_id: producer_id,
  tx_hash: txHash, token_id: tokenId, status: "minted"
});
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

---

## ⚙️ Environment Setup

Create a `.env` file in the project root:

```env
# Supabase
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Pinata IPFS (optional — for NFT metadata pinning)
PINATA_API_KEY=<your-pinata-api-key>
PINATA_SECRET_KEY=<your-pinata-secret-key>

# Blockchain (use Hardhat account #0 private key for local dev)
DEPLOYER_PRIVATE_KEY=<hardhat-account-0-private-key>
MINTER_PRIVATE_KEY=<hardhat-account-0-private-key>
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ESCROW_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
RPC_URL=http://127.0.0.1:8545
```

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

Built by **Team Caffeine** at Foundathon.

---

## 📄 License

[MIT](LICENSE)
