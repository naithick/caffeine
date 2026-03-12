# Frontend Mock Data Reference

> **Purpose:** Complete sample data for UI development. Matches the exact Supabase PostgreSQL schema field-for-field. Use these payloads to build and render every view before API integration is complete.
>
> **When to replace:** Swap these mocks with real API calls once the backend is accessible. See `BACKEND_API_REFERENCE.md` for endpoint contracts.

---

## Schema Overview

```
users → proposals → proposal_reviews
                 → carbon_credits → sell_orders → trades
                                  → buy_orders  → trades
```

**Enum values:**
- `user_role`: `producer` | `buyer` | `certification_body`
- `proposal_status`: `draft` | `submitted` | `under_review` | `approved` | `rejected`
- `credit_status`: `minted` | `listed` | `transferred` | `retired` | `revoked`
- `order_status`: `open` | `partially_filled` | `filled` | `cancelled`
- `trade_status`: `matched` | `settling` | `settled` | `failed`

**ETH price fields** (`asking_price_eth`, `bid_price_eth`, `execution_price_eth`) are returned as **strings** from the API. Use `ethers.formatEther()` / `parseEther()` — never cast to `Number`.

---

## 1. Users

Table: `users`

```json
[
  {
    "id": "a1b2c3d4-0001-0000-0000-000000000001",
    "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "display_name": "Ravi Kumar (Farmer)",
    "role": "producer",
    "created_at": "2026-03-01T08:00:00.000Z",
    "updated_at": "2026-03-01T08:00:00.000Z"
  },
  {
    "id": "a1b2c3d4-0002-0000-0000-000000000002",
    "wallet_address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "display_name": "Siti Rahma (Farmer)",
    "role": "producer",
    "created_at": "2026-03-02T09:00:00.000Z",
    "updated_at": "2026-03-02T09:00:00.000Z"
  },
  {
    "id": "a1b2c3d4-0003-0000-0000-000000000003",
    "wallet_address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "display_name": "Jean-Pierre Mbeki (Farmer)",
    "role": "producer",
    "created_at": "2026-03-03T10:00:00.000Z",
    "updated_at": "2026-03-03T10:00:00.000Z"
  },
  {
    "id": "a1b2c3d4-0004-0000-0000-000000000004",
    "wallet_address": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "display_name": "ClimateCorp GmbH",
    "role": "buyer",
    "created_at": "2026-03-04T11:00:00.000Z",
    "updated_at": "2026-03-04T11:00:00.000Z"
  },
  {
    "id": "a1b2c3d4-0005-0000-0000-000000000005",
    "wallet_address": "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    "display_name": "GreenOffset Pte Ltd",
    "role": "buyer",
    "created_at": "2026-03-04T12:00:00.000Z",
    "updated_at": "2026-03-04T12:00:00.000Z"
  },
  {
    "id": "a1b2c3d4-0006-0000-0000-000000000006",
    "wallet_address": "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "display_name": "UNFCCC Verifier Node",
    "role": "certification_body",
    "created_at": "2026-03-01T07:00:00.000Z",
    "updated_at": "2026-03-01T07:00:00.000Z"
  }
]
```

---

## 2. Certification Bodies

Table: `certification_bodies`

```json
[
  {
    "id": "cb000001-0000-0000-0000-000000000001",
    "user_id": "a1b2c3d4-0006-0000-0000-000000000006",
    "organization_name": "UNFCCC Verifier Node",
    "accreditation_authority": "UNFCCC",
    "registry_contract_address": "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "is_active": true,
    "created_at": "2026-03-01T07:00:00.000Z",
    "updated_at": "2026-03-01T07:00:00.000Z"
  }
]
```

---

## 3. Proposals

Table: `proposals`

```json
[
  {
    "id": "prop0001-0000-0000-0000-000000000001",
    "producer_id": "a1b2c3d4-0001-0000-0000-000000000001",
    "title": "Amazon Reforestation Plot A — 50 Ton Batch",
    "description": "Verified CO2 sequestration from a 12-hectare reforestation plot in the Manaus region. Full IoT sensor coverage. NDVI confirmed.",
    "commodity_type": "carbon_credit",
    "credit_quantity": 50,
    "supporting_documents": {
      "land_ownership": "https://ipfs.io/ipfs/QmDoc1LandTitle",
      "intent_certificate": "https://ipfs.io/ipfs/QmDoc1Intent",
      "financial_history": "https://ipfs.io/ipfs/QmDoc1FinHist"
    },
    "proof_of_intent": "Signed agreement with REDD+ program, ref: REDD-BR-2026-001",
    "proof_of_value": "Independent baseline assessment: 48.7 tCO2e/yr",
    "sensor_data": {
      "device_id": "IOT-BR-44291",
      "co2_sequestered_tons": 50,
      "temperature_c": 24,
      "humidity_pct": 82,
      "ndvi_score": 0.637,
      "recorded_at": "2026-03-10T06:00:00.000Z"
    },
    "status": "approved",
    "submitted_at": "2026-03-05T09:00:00.000Z",
    "created_at": "2026-03-04T14:00:00.000Z",
    "updated_at": "2026-03-05T10:00:00.000Z"
  },
  {
    "id": "prop0002-0000-0000-0000-000000000002",
    "producer_id": "a1b2c3d4-0002-0000-0000-000000000002",
    "title": "Borneo Mangrove Restoration — 120 Ton Batch",
    "description": "Mangrove planting initiative along the Sarawak coast. NDVI density confirmed by two independent satellite passes. Tidal sensor data included.",
    "commodity_type": "carbon_credit",
    "credit_quantity": 120,
    "supporting_documents": {
      "land_ownership": "https://ipfs.io/ipfs/QmDoc2LandTitle",
      "intent_certificate": "https://ipfs.io/ipfs/QmDoc2Intent"
    },
    "proof_of_intent": "Malaysian Forestry Dept approval, ref: MFD-2026-0882",
    "proof_of_value": "Dual-satellite NDVI analysis: avg score 0.712",
    "sensor_data": {
      "device_id": "IOT-MY-90312",
      "co2_sequestered_tons": 120,
      "temperature_c": 28,
      "humidity_pct": 91,
      "ndvi_score": 0.712,
      "recorded_at": "2026-03-09T12:00:00.000Z"
    },
    "status": "approved",
    "submitted_at": "2026-03-06T10:00:00.000Z",
    "created_at": "2026-03-06T08:00:00.000Z",
    "updated_at": "2026-03-06T11:00:00.000Z"
  },
  {
    "id": "prop0003-0000-0000-0000-000000000003",
    "producer_id": "a1b2c3d4-0003-0000-0000-000000000003",
    "title": "Congo Basin Agroforestry — Expansion Phase 2",
    "description": "Extension of existing agroforestry corridor. Pending second satellite verification window due to cloud cover on primary pass.",
    "commodity_type": "carbon_credit",
    "credit_quantity": 75,
    "supporting_documents": {
      "land_ownership": "https://ipfs.io/ipfs/QmDoc3LandTitle"
    },
    "proof_of_intent": "DRC MEDD permit ref: MEDD-DRC-2025-417",
    "proof_of_value": null,
    "sensor_data": {
      "device_id": "IOT-CD-11844",
      "co2_sequestered_tons": 75,
      "temperature_c": 27,
      "humidity_pct": 88,
      "ndvi_score": 0.589,
      "recorded_at": "2026-03-09T14:00:00.000Z"
    },
    "status": "under_review",
    "submitted_at": "2026-03-09T15:00:00.000Z",
    "created_at": "2026-03-09T13:00:00.000Z",
    "updated_at": "2026-03-09T15:00:00.000Z"
  },
  {
    "id": "prop0004-0000-0000-0000-000000000004",
    "producer_id": "a1b2c3d4-0001-0000-0000-000000000001",
    "title": "Sahel Greenbelt Initiative — 300 Ton Request",
    "description": "Anti-desertification planting along the Sahel border. Rejected: initial submission lacked ground-truth GPS boundary data.",
    "commodity_type": "carbon_credit",
    "credit_quantity": 300,
    "supporting_documents": null,
    "proof_of_intent": null,
    "proof_of_value": null,
    "sensor_data": null,
    "status": "rejected",
    "submitted_at": "2026-03-03T09:00:00.000Z",
    "created_at": "2026-03-02T11:00:00.000Z",
    "updated_at": "2026-03-04T09:00:00.000Z"
  }
]
```

---

## 4. Proposal Reviews

Table: `proposal_reviews`

```json
[
  {
    "id": "rev00001-0000-0000-0000-000000000001",
    "proposal_id": "prop0001-0000-0000-0000-000000000001",
    "certifier_id": "cb000001-0000-0000-0000-000000000001",
    "decision": "approved",
    "remarks": "NDVI score 0.637 exceeds 0.55 threshold. Sensor data consistent with satellite imagery. Approved for minting.",
    "reviewed_at": "2026-03-05T10:00:00.000Z"
  },
  {
    "id": "rev00002-0000-0000-0000-000000000002",
    "proposal_id": "prop0002-0000-0000-0000-000000000002",
    "certifier_id": "cb000001-0000-0000-0000-000000000001",
    "decision": "approved",
    "remarks": "Dual-pass satellite confirmation. Mangrove density above baseline. 120 tCO2e approved.",
    "reviewed_at": "2026-03-06T11:00:00.000Z"
  },
  {
    "id": "rev00003-0000-0000-0000-000000000003",
    "proposal_id": "prop0004-0000-0000-0000-000000000004",
    "certifier_id": "cb000001-0000-0000-0000-000000000001",
    "decision": "rejected",
    "remarks": "Missing GPS boundary proof. Resubmit with georeferenced land parcel data.",
    "reviewed_at": "2026-03-04T09:00:00.000Z"
  }
]
```

---

## 5. Carbon Credits

Table: `carbon_credits`

> Each credit = 1 minted ERC-721 NFT. `token_id` is the on-chain token ID. `contract_address` is the deployed `CarbonCreditNFT` contract.

```json
[
  {
    "id": "cc000001-0000-0000-0000-000000000001",
    "proposal_id": "prop0001-0000-0000-0000-000000000001",
    "owner_id": "a1b2c3d4-0001-0000-0000-000000000001",
    "token_id": "1",
    "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "metadata": {
      "name": "Carbon Credit — Proposal #prop0001",
      "description": "50 tCO2e. Amazon Reforestation Plot A.",
      "ipfs_cid": "QmRcotsw5Nh8KrTqFBKiVYFJL9bBfXsGkPmbELNuNEgJoY",
      "ndvi_score": 0.637,
      "co2_tonnage": 50,
      "location": "-3.4653, -62.2159",
      "issued_at": "2026-03-05T10:05:00.000Z"
    },
    "status": "transferred",
    "minted_at": "2026-03-05T10:05:00.000Z",
    "retired_at": null,
    "created_at": "2026-03-05T10:05:00.000Z",
    "updated_at": "2026-03-10T08:12:33.000Z"
  },
  {
    "id": "cc000002-0000-0000-0000-000000000002",
    "proposal_id": "prop0002-0000-0000-0000-000000000002",
    "owner_id": "a1b2c3d4-0002-0000-0000-000000000002",
    "token_id": "2",
    "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "metadata": {
      "name": "Carbon Credit — Proposal #prop0002",
      "description": "120 tCO2e. Borneo Mangrove Restoration.",
      "ipfs_cid": "QmT5NvUtoM5nWFfrQdVrFtvGSKFg2LBjrm2HXX5DoYRqNA",
      "ndvi_score": 0.712,
      "co2_tonnage": 120,
      "location": "1.5533, 110.3592",
      "issued_at": "2026-03-06T11:05:00.000Z"
    },
    "status": "listed",
    "minted_at": "2026-03-06T11:05:00.000Z",
    "retired_at": null,
    "created_at": "2026-03-06T11:05:00.000Z",
    "updated_at": "2026-03-09T14:30:00.000Z"
  },
  {
    "id": "cc000003-0000-0000-0000-000000000003",
    "proposal_id": "prop0003-0000-0000-0000-000000000003",
    "owner_id": "a1b2c3d4-0003-0000-0000-000000000003",
    "token_id": "3",
    "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "metadata": {
      "name": "Carbon Credit — Proposal #prop0003",
      "description": "75 tCO2e. Congo Basin Agroforestry.",
      "ipfs_cid": "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn",
      "ndvi_score": 0.589,
      "co2_tonnage": 75,
      "location": "-0.2280, 15.8277",
      "issued_at": "2026-03-10T09:15:00.000Z"
    },
    "status": "minted",
    "minted_at": "2026-03-10T09:15:00.000Z",
    "retired_at": null,
    "created_at": "2026-03-10T09:15:00.000Z",
    "updated_at": "2026-03-10T09:15:00.000Z"
  },
  {
    "id": "cc000004-0000-0000-0000-000000000004",
    "proposal_id": "prop0001-0000-0000-0000-000000000001",
    "owner_id": "a1b2c3d4-0001-0000-0000-000000000001",
    "token_id": "4",
    "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "metadata": {
      "name": "Carbon Credit — Batch 2",
      "description": "200 tCO2e. Western Ghats Bamboo Corridor.",
      "ipfs_cid": "QmYwAPJzv5CZsnAzt8auVZRnGT4ioSGREqFiFBvhS4SqjQ",
      "ndvi_score": 0.801,
      "co2_tonnage": 200,
      "location": "12.2958, 75.5612",
      "issued_at": "2026-03-08T06:00:00.000Z"
    },
    "status": "transferred",
    "minted_at": "2026-03-08T06:00:00.000Z",
    "retired_at": null,
    "created_at": "2026-03-08T06:00:00.000Z",
    "updated_at": "2026-03-08T06:22:10.000Z"
  },
  {
    "id": "cc000005-0000-0000-0000-000000000005",
    "proposal_id": "prop0002-0000-0000-0000-000000000002",
    "owner_id": "a1b2c3d4-0002-0000-0000-000000000002",
    "token_id": "5",
    "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "metadata": {
      "name": "Carbon Credit — Patagonia Batch",
      "description": "30 tCO2e. Patagonia Grassland Sequestration.",
      "ipfs_cid": "QmZTR5bcpQD7cFgTorPaqvGMCv5quzEdtJaEkR2poHhE76",
      "ndvi_score": 0.423,
      "co2_tonnage": 30,
      "location": "-41.8101, -68.9063",
      "issued_at": "2026-03-07T11:45:00.000Z"
    },
    "status": "retired",
    "minted_at": "2026-03-07T11:45:00.000Z",
    "retired_at": "2026-03-10T10:00:00.000Z",
    "created_at": "2026-03-07T11:45:00.000Z",
    "updated_at": "2026-03-10T10:00:00.000Z"
  },
  {
    "id": "cc000006-0000-0000-0000-000000000006",
    "proposal_id": "prop0003-0000-0000-0000-000000000003",
    "owner_id": "a1b2c3d4-0003-0000-0000-000000000003",
    "token_id": "6",
    "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "metadata": {
      "name": "Carbon Credit — Sundarbans",
      "description": "90 tCO2e. Sundarbans Delta Recovery.",
      "ipfs_cid": "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
      "ndvi_score": 0.655,
      "co2_tonnage": 90,
      "location": "21.9497, 89.1833",
      "issued_at": "2026-03-09T17:20:00.000Z"
    },
    "status": "listed",
    "minted_at": "2026-03-09T17:20:00.000Z",
    "retired_at": null,
    "created_at": "2026-03-09T17:20:00.000Z",
    "updated_at": "2026-03-09T17:30:00.000Z"
  }
]
```

---

## 6. Sell Orders

Table: `sell_orders`

> `asking_price_eth` is a **string**. Do not cast to `Number`.

```json
[
  {
    "id": "so000001-0000-0000-0000-000000000001",
    "seller_id": "a1b2c3d4-0001-0000-0000-000000000001",
    "credit_id": "cc000001-0000-0000-0000-000000000001",
    "asking_price_eth": "1.000000000000000000",
    "quantity": 1,
    "status": "filled",
    "listed_at": "2026-03-10T08:05:00.000Z",
    "created_at": "2026-03-10T08:05:00.000Z",
    "updated_at": "2026-03-10T08:12:33.000Z"
  },
  {
    "id": "so000002-0000-0000-0000-000000000002",
    "seller_id": "a1b2c3d4-0002-0000-0000-000000000002",
    "credit_id": "cc000002-0000-0000-0000-000000000002",
    "asking_price_eth": "2.400000000000000000",
    "quantity": 1,
    "status": "open",
    "listed_at": "2026-03-09T14:30:00.000Z",
    "created_at": "2026-03-09T14:30:00.000Z",
    "updated_at": "2026-03-09T14:30:00.000Z"
  },
  {
    "id": "so000003-0000-0000-0000-000000000003",
    "seller_id": "a1b2c3d4-0001-0000-0000-000000000001",
    "credit_id": "cc000004-0000-0000-0000-000000000004",
    "asking_price_eth": "4.000000000000000000",
    "quantity": 1,
    "status": "filled",
    "listed_at": "2026-03-08T06:01:00.000Z",
    "created_at": "2026-03-08T06:01:00.000Z",
    "updated_at": "2026-03-08T06:22:10.000Z"
  },
  {
    "id": "so000004-0000-0000-0000-000000000004",
    "seller_id": "a1b2c3d4-0002-0000-0000-000000000002",
    "credit_id": "cc000005-0000-0000-0000-000000000005",
    "asking_price_eth": "0.600000000000000000",
    "quantity": 1,
    "status": "filled",
    "listed_at": "2026-03-07T12:00:00.000Z",
    "created_at": "2026-03-07T12:00:00.000Z",
    "updated_at": "2026-03-07T12:05:44.000Z"
  },
  {
    "id": "so000005-0000-0000-0000-000000000005",
    "seller_id": "a1b2c3d4-0003-0000-0000-000000000003",
    "credit_id": "cc000006-0000-0000-0000-000000000006",
    "asking_price_eth": "1.800000000000000000",
    "quantity": 1,
    "status": "open",
    "listed_at": "2026-03-09T17:30:00.000Z",
    "created_at": "2026-03-09T17:30:00.000Z",
    "updated_at": "2026-03-09T17:30:00.000Z"
  }
]
```

---

## 7. Buy Orders

Table: `buy_orders`

> `bid_price_eth` is a **string**. `escrow_tx_hash` is the on-chain ETH locking tx.

```json
[
  {
    "id": "bo000001-0000-0000-0000-000000000001",
    "buyer_id": "a1b2c3d4-0004-0000-0000-000000000004",
    "credit_id": "cc000001-0000-0000-0000-000000000001",
    "bid_price_eth": "1.000000000000000000",
    "quantity": 1,
    "status": "filled",
    "escrow_tx_hash": "0xa1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
    "placed_at": "2026-03-10T08:10:00.000Z",
    "created_at": "2026-03-10T08:10:00.000Z",
    "updated_at": "2026-03-10T08:12:33.000Z"
  },
  {
    "id": "bo000002-0000-0000-0000-000000000002",
    "buyer_id": "a1b2c3d4-0005-0000-0000-000000000005",
    "credit_id": "cc000004-0000-0000-0000-000000000004",
    "bid_price_eth": "4.000000000000000000",
    "quantity": 1,
    "status": "filled",
    "escrow_tx_hash": "0xb2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f901a",
    "placed_at": "2026-03-08T06:15:00.000Z",
    "created_at": "2026-03-08T06:15:00.000Z",
    "updated_at": "2026-03-08T06:22:10.000Z"
  },
  {
    "id": "bo000003-0000-0000-0000-000000000003",
    "buyer_id": "a1b2c3d4-0004-0000-0000-000000000004",
    "credit_id": "cc000005-0000-0000-0000-000000000005",
    "bid_price_eth": "0.600000000000000000",
    "quantity": 1,
    "status": "filled",
    "escrow_tx_hash": "0xc3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f901a2b",
    "placed_at": "2026-03-07T12:03:00.000Z",
    "created_at": "2026-03-07T12:03:00.000Z",
    "updated_at": "2026-03-07T12:05:44.000Z"
  },
  {
    "id": "bo000004-0000-0000-0000-000000000004",
    "buyer_id": "a1b2c3d4-0004-0000-0000-000000000004",
    "credit_id": "cc000002-0000-0000-0000-000000000002",
    "bid_price_eth": "2.200000000000000000",
    "quantity": 1,
    "status": "open",
    "escrow_tx_hash": null,
    "placed_at": "2026-03-09T18:00:00.000Z",
    "created_at": "2026-03-09T18:00:00.000Z",
    "updated_at": "2026-03-09T18:00:00.000Z"
  }
]
```

---

## 8. Trades

Table: `trades`

> `execution_price_eth` is a **string**. `settlement_tx_hash` is the on-chain atomic swap transaction.

```json
[
  {
    "id": "tr000001-0000-0000-0000-000000000001",
    "sell_order_id": "so000001-0000-0000-0000-000000000001",
    "buy_order_id": "bo000001-0000-0000-0000-000000000001",
    "credit_id": "cc000001-0000-0000-0000-000000000001",
    "execution_price_eth": "1.000000000000000000",
    "quantity": 1,
    "status": "settled",
    "settlement_tx_hash": "0xa1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
    "matched_at": "2026-03-10T08:12:00.000Z",
    "settled_at": "2026-03-10T08:12:33.000Z"
  },
  {
    "id": "tr000002-0000-0000-0000-000000000002",
    "sell_order_id": "so000003-0000-0000-0000-000000000003",
    "buy_order_id": "bo000002-0000-0000-0000-000000000002",
    "credit_id": "cc000004-0000-0000-0000-000000000004",
    "execution_price_eth": "4.000000000000000000",
    "quantity": 1,
    "status": "settled",
    "settlement_tx_hash": "0xb2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f901a",
    "matched_at": "2026-03-08T06:21:00.000Z",
    "settled_at": "2026-03-08T06:22:10.000Z"
  },
  {
    "id": "tr000003-0000-0000-0000-000000000003",
    "sell_order_id": "so000004-0000-0000-0000-000000000004",
    "buy_order_id": "bo000003-0000-0000-0000-000000000003",
    "credit_id": "cc000005-0000-0000-0000-000000000005",
    "execution_price_eth": "0.600000000000000000",
    "quantity": 1,
    "status": "settled",
    "settlement_tx_hash": "0xc3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f901a2b",
    "matched_at": "2026-03-07T12:04:00.000Z",
    "settled_at": "2026-03-07T12:05:44.000Z"
  },
  {
    "id": "tr000004-0000-0000-0000-000000000004",
    "sell_order_id": "so000002-0000-0000-0000-000000000002",
    "buy_order_id": "bo000004-0000-0000-0000-000000000004",
    "credit_id": "cc000002-0000-0000-0000-000000000002",
    "execution_price_eth": "2.400000000000000000",
    "quantity": 1,
    "status": "matching",
    "settlement_tx_hash": null,
    "matched_at": "2026-03-09T18:05:00.000Z",
    "settled_at": null
  }
]
```

---

## Entity Relationship Summary

```
users[0001] (producer: Ravi)
  └── proposals[prop0001] (approved)
        └── proposal_reviews[rev0001] (approved by UNFCCC)
        └── carbon_credits[cc0001] (status: transferred)
              └── sell_orders[so0001] (filled @ 1.0 ETH)
              └── buy_orders[bo0001]  (filled @ 1.0 ETH)
              └── trades[tr0001]      (settled, tx: 0xa1b2...)

users[0001] (producer: Ravi)
  └── carbon_credits[cc0004] (status: transferred)
        └── sell_orders[so0003] (filled @ 4.0 ETH)
        └── buy_orders[bo0002]  (filled by GreenOffset)
        └── trades[tr0002]      (settled, tx: 0xb2c3...)

users[0002] (producer: Siti)
  └── proposals[prop0002] (approved)
        └── carbon_credits[cc0005] (status: retired)
              └── trades[tr0003]   (settled + retired)

users[0002] (producer: Siti)
  └── carbon_credits[cc0002] (status: listed)
        └── sell_orders[so0002] (open @ 2.4 ETH)
        └── buy_orders[bo0004]  (open bid @ 2.2 ETH — not yet matched)
        └── trades[tr0004]      (status: matching — in flight)

users[0003] (producer: Jean-Pierre)
  └── proposals[prop0003] (under_review)
        └── carbon_credits[cc0003] (status: minted — no sell order yet)
        └── carbon_credits[cc0006] (status: listed)
              └── sell_orders[so0005] (open @ 1.8 ETH)
```

---

## Contract Addresses (local Hardhat)

| Contract | Address |
|---|---|
| `CarbonCreditNFT` (ERC-721) | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| `MarketplaceEscrow` | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |

> **Note:** These are Hardhat localhost addresses. They reset on every `npx hardhat node` restart.
