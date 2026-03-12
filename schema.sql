-- =============================================================================
-- Carbon Credit Lifecycle & Trading Platform — Supabase PostgreSQL Schema
-- =============================================================================
-- Hybrid Web2.5 architecture: off-chain application layer (this schema)
-- backed by on-chain settlement via smart contracts on Ethereum.
--
-- SECURITY MODEL: No Row Level Security. All authorization is enforced by
-- the Node.js backend, which connects using the Supabase Service Role Key.
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM ('producer', 'buyer', 'certification_body');

CREATE TYPE proposal_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'rejected'
);

CREATE TYPE credit_status AS ENUM (
    'minted',
    'listed',
    'transferred',
    'retired',
    'revoked'
);

CREATE TYPE order_status AS ENUM (
    'open',
    'partially_filled',
    'filled',
    'cancelled'
);

CREATE TYPE trade_status AS ENUM (
    'matched',
    'settling',
    'settled',
    'failed'
);

-- =============================================================================
-- 1. USERS — Web3 wallet identity mapping
-- =============================================================================
-- Maps 42-character hex wallet addresses (0x + 40 hex chars) to user profiles
-- and roles. Each user authenticates via a Web3 wallet (e.g., MetaMask) and
-- is assigned one of three roles: Producer, Buyer, or Certification Body.

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address  TEXT NOT NULL,
    display_name    TEXT,
    role            user_role NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_wallet_address UNIQUE (wallet_address),
    CONSTRAINT chk_wallet_address_hex  CHECK (wallet_address ~ '^0x[0-9a-fA-F]{40}$')
);

CREATE INDEX idx_users_role ON users (role);

-- =============================================================================
-- 2. CERTIFICATION BODIES — Accredited third-party verifiers
-- =============================================================================
-- Registered in a dedicated Certifier Registry. Accredited by regulatory
-- authorities (UNFCCC, ICVCM, ETS-EU, PACM, etc.). On-chain registry address
-- references the smart contract Certifier Registry.

CREATE TABLE certification_bodies (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID NOT NULL,
    organization_name         TEXT NOT NULL,
    accreditation_authority   TEXT NOT NULL,   -- e.g. 'UNFCCC', 'ICVCM', 'ETS-EU'
    registry_contract_address TEXT,            -- on-chain Certifier Registry address
    is_active                 BOOLEAN NOT NULL DEFAULT true,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_cb_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uq_cb_user UNIQUE (user_id)
);

CREATE INDEX idx_cb_active ON certification_bodies (is_active) WHERE is_active = true;

-- =============================================================================
-- 3. PROPOSALS — Producer credit-minting proposals
-- =============================================================================
-- Producers create proposals containing background work, due diligence,
-- financial history, ownership record, proof of intent, and proof of value.
-- sensor_data stores IoT environmental sensing readings as JSONB.
-- supporting_documents stores financial history, ownership records, approvals.

CREATE TABLE proposals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id             UUID NOT NULL,
    title                   TEXT NOT NULL,
    description             TEXT,
    commodity_type          TEXT NOT NULL DEFAULT 'carbon_credit',
    credit_quantity         INTEGER NOT NULL CHECK (credit_quantity > 0),
    supporting_documents    JSONB,   -- financial history, ownership records, approvals
    proof_of_intent         TEXT,
    proof_of_value          TEXT,
    sensor_data             JSONB,   -- IoT environmental sensing data
    status                  proposal_status NOT NULL DEFAULT 'draft',
    submitted_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_proposal_producer FOREIGN KEY (producer_id) REFERENCES users (id)
);

CREATE INDEX idx_proposals_producer  ON proposals (producer_id);
CREATE INDEX idx_proposals_status    ON proposals (status);
CREATE INDEX idx_proposals_submitted ON proposals (submitted_at)
    WHERE status = 'submitted';

-- =============================================================================
-- 4. PROPOSAL REVIEWS — Human-in-the-loop certification decisions
-- =============================================================================
-- Certification bodies review proposals in a verification dashboard and
-- record an approve or reject decision with remarks.

CREATE TABLE proposal_reviews (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id   UUID NOT NULL,
    certifier_id  UUID NOT NULL,
    decision      TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
    remarks       TEXT,
    reviewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_review_proposal  FOREIGN KEY (proposal_id) REFERENCES proposals (id),
    CONSTRAINT fk_review_certifier FOREIGN KEY (certifier_id) REFERENCES certification_bodies (id)
);

CREATE INDEX idx_reviews_proposal  ON proposal_reviews (proposal_id);
CREATE INDEX idx_reviews_certifier ON proposal_reviews (certifier_id);

-- =============================================================================
-- 5. CARBON CREDITS — Tokenized NFT-backed credits
-- =============================================================================
-- Each credit represents one metric ton of CO2 equivalent, mapped to an NFT.
-- Minted upon proposal approval. Metadata includes approved proposal identifier,
-- supporting documents, and on-chain transaction history references.
-- Credits follow the lifecycle: minted → listed → transferred → retired.
-- Revocation is supported for credits later deemed invalid.

CREATE TABLE carbon_credits (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id       UUID NOT NULL,
    owner_id          UUID NOT NULL,
    token_id          TEXT,           -- on-chain NFT token ID
    contract_address  TEXT,           -- smart contract address (ERC-721 / ERC-1155)
    metadata          JSONB,         -- NFT metadata: creation, approval, transfer history refs
    status            credit_status NOT NULL DEFAULT 'minted',
    minted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    retired_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_credit_proposal FOREIGN KEY (proposal_id) REFERENCES proposals (id),
    CONSTRAINT fk_credit_owner    FOREIGN KEY (owner_id)    REFERENCES users (id)
);

CREATE INDEX idx_credits_proposal ON carbon_credits (proposal_id);
CREATE INDEX idx_credits_owner    ON carbon_credits (owner_id);
CREATE INDEX idx_credits_status   ON carbon_credits (status);
CREATE INDEX idx_credits_token    ON carbon_credits (token_id)
    WHERE token_id IS NOT NULL;

-- =============================================================================
-- 6. SELL ORDERS — NFT listings on the off-chain order book
-- =============================================================================
-- Created when an owner lists a credit for sale. Contains NFT info, owner
-- address, transaction preferences, and metadata attributes for the Order
-- Matching System. Price is denominated in ETH (18 decimal places for WEI
-- precision).

CREATE TABLE sell_orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id        UUID NOT NULL,
    credit_id        UUID NOT NULL,
    asking_price_eth NUMERIC(38, 18) NOT NULL CHECK (asking_price_eth > 0),
    quantity         INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status           order_status NOT NULL DEFAULT 'open',
    listed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_sell_seller FOREIGN KEY (seller_id) REFERENCES users (id),
    CONSTRAINT fk_sell_credit FOREIGN KEY (credit_id) REFERENCES carbon_credits (id)
);

CREATE INDEX idx_sell_orders_seller ON sell_orders (seller_id);
CREATE INDEX idx_sell_orders_credit ON sell_orders (credit_id);
CREATE INDEX idx_sell_orders_open   ON sell_orders (asking_price_eth ASC, listed_at ASC)
    WHERE status = 'open';

-- =============================================================================
-- 7. BUY ORDERS — Buyer bids on the off-chain order book
-- =============================================================================
-- Created when a buyer places a bid on a specific NFT-backed carbon credit.
-- Contains bid price, quantity, and buyer preferences. ETH is locked in an
-- on-chain escrow account; escrow_tx_hash references that locking transaction.

CREATE TABLE buy_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id        UUID NOT NULL,
    credit_id       UUID NOT NULL,    -- target NFT asset the buyer is bidding on
    bid_price_eth   NUMERIC(38, 18) NOT NULL CHECK (bid_price_eth > 0),
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status          order_status NOT NULL DEFAULT 'open',
    escrow_tx_hash  TEXT,            -- on-chain escrow locking transaction hash
    placed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_buy_buyer  FOREIGN KEY (buyer_id)  REFERENCES users (id),
    CONSTRAINT fk_buy_credit FOREIGN KEY (credit_id) REFERENCES carbon_credits (id)
);

CREATE INDEX idx_buy_orders_buyer  ON buy_orders (buyer_id);
CREATE INDEX idx_buy_orders_credit ON buy_orders (credit_id);
CREATE INDEX idx_buy_orders_open   ON buy_orders (credit_id, bid_price_eth DESC, placed_at ASC)
    WHERE status = 'open';

-- =============================================================================
-- 8. TRADES — Order matches and execution records
-- =============================================================================
-- Records each match produced by the off-chain Order Matching System
-- (Price-Time priority). Tracks execution status from match through
-- on-chain settlement.

CREATE TABLE trades (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_order_id       UUID NOT NULL,
    buy_order_id        UUID NOT NULL,
    credit_id           UUID NOT NULL,
    execution_price_eth NUMERIC(38, 18) NOT NULL CHECK (execution_price_eth > 0),
    quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status              trade_status NOT NULL DEFAULT 'matched',
    settlement_tx_hash  TEXT,        -- on-chain settlement transaction hash
    matched_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    settled_at          TIMESTAMPTZ,

    CONSTRAINT fk_trade_sell   FOREIGN KEY (sell_order_id) REFERENCES sell_orders (id),
    CONSTRAINT fk_trade_buy    FOREIGN KEY (buy_order_id)  REFERENCES buy_orders (id),
    CONSTRAINT fk_trade_credit FOREIGN KEY (credit_id)     REFERENCES carbon_credits (id)
);

CREATE INDEX idx_trades_sell   ON trades (sell_order_id);
CREATE INDEX idx_trades_buy    ON trades (buy_order_id);
CREATE INDEX idx_trades_credit ON trades (credit_id);
CREATE INDEX idx_trades_status ON trades (status);

-- =============================================================================
-- UPDATED_AT TRIGGER — auto-update timestamps on row modification
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_certification_bodies_updated_at
    BEFORE UPDATE ON certification_bodies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_carbon_credits_updated_at
    BEFORE UPDATE ON carbon_credits
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sell_orders_updated_at
    BEFORE UPDATE ON sell_orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_buy_orders_updated_at
    BEFORE UPDATE ON buy_orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- PRECISION DOCUMENTATION — NUMERIC(38,18) ETH columns
-- =============================================================================
-- These columns store ETH values with WEI-level precision (18 decimal places).
-- JavaScript's IEEE 754 Number type loses precision beyond 2^53.
-- Backend and frontend code MUST parse these using ethers.js or BigInt.
-- =============================================================================

COMMENT ON COLUMN sell_orders.asking_price_eth IS
    'ETH price with 18 decimal places (WEI precision). '
    'FRONTEND WARNING: Parse with ethers.parseEther() / ethers.formatEther() '
    'or BigInt. Do NOT cast to JavaScript Number — IEEE 754 loses precision beyond 2^53.';

COMMENT ON COLUMN buy_orders.bid_price_eth IS
    'ETH price with 18 decimal places (WEI precision). '
    'FRONTEND WARNING: Parse with ethers.parseEther() / ethers.formatEther() '
    'or BigInt. Do NOT cast to JavaScript Number — IEEE 754 loses precision beyond 2^53.';

COMMENT ON COLUMN trades.execution_price_eth IS
    'ETH price with 18 decimal places (WEI precision). '
    'FRONTEND WARNING: Parse with ethers.parseEther() / ethers.formatEther() '
    'or BigInt. Do NOT cast to JavaScript Number — IEEE 754 loses precision beyond 2^53.';
