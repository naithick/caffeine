-- =============================================================================
-- CarbonX — Complete Supabase PostgreSQL Schema + Demo Seed Data
-- =============================================================================
-- Paste this entire file in the Supabase SQL Editor to set up the database.
-- Creates all tables, enums, indexes, triggers, and demo data in one go.
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

CREATE TYPE kyc_status AS ENUM ('pending', 'in_review', 'verified', 'rejected');
CREATE TYPE account_type AS ENUM ('individual', 'company');
CREATE TYPE notification_type AS ENUM ('success', 'info', 'warning');
CREATE TYPE history_action AS ENUM ('minted', 'listed', 'sold', 'purchased', 'retired', 'burned', 'revoked');

-- =============================================================================
-- 1. USERS
-- =============================================================================

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
-- 2. CERTIFICATION BODIES
-- =============================================================================

CREATE TABLE certification_bodies (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID NOT NULL,
    organization_name         TEXT NOT NULL,
    accreditation_authority   TEXT NOT NULL,
    registry_contract_address TEXT,
    is_active                 BOOLEAN NOT NULL DEFAULT true,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_cb_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uq_cb_user UNIQUE (user_id)
);

CREATE INDEX idx_cb_active ON certification_bodies (is_active) WHERE is_active = true;

-- =============================================================================
-- 3. PROPOSALS
-- =============================================================================

CREATE TABLE proposals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id             UUID NOT NULL,
    title                   TEXT NOT NULL,
    description             TEXT,
    commodity_type          TEXT NOT NULL DEFAULT 'carbon_credit',
    credit_quantity         INTEGER NOT NULL CHECK (credit_quantity > 0),
    supporting_documents    JSONB,
    proof_of_intent         TEXT,
    proof_of_value          TEXT,
    sensor_data             JSONB,
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
-- 4. PROPOSAL REVIEWS
-- =============================================================================

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
-- 5. CARBON CREDITS
-- =============================================================================

CREATE TABLE carbon_credits (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id       UUID NOT NULL,
    owner_id          UUID NOT NULL,
    token_id          TEXT,
    contract_address  TEXT,
    metadata          JSONB,
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
-- 6. SELL ORDERS
-- =============================================================================

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
-- 7. BUY ORDERS
-- =============================================================================

CREATE TABLE buy_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id        UUID NOT NULL,
    credit_id       UUID NOT NULL,
    bid_price_eth   NUMERIC(38, 18) NOT NULL CHECK (bid_price_eth > 0),
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status          order_status NOT NULL DEFAULT 'open',
    escrow_tx_hash  TEXT,
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
-- 8. TRADES
-- =============================================================================

CREATE TABLE trades (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_order_id       UUID NOT NULL,
    buy_order_id        UUID NOT NULL,
    credit_id           UUID NOT NULL,
    execution_price_eth NUMERIC(38, 18) NOT NULL CHECK (execution_price_eth > 0),
    quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status              trade_status NOT NULL DEFAULT 'matched',
    settlement_tx_hash  TEXT,
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
-- 9. KYC VERIFICATIONS
-- =============================================================================

CREATE TABLE kyc_verifications (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL,
    account_type          account_type NOT NULL DEFAULT 'individual',
    full_name             TEXT,
    company_name          TEXT,
    registration_number   TEXT,
    email                 TEXT NOT NULL,
    country               TEXT NOT NULL,
    primary_doc_url       TEXT,
    primary_doc_type      TEXT,
    secondary_doc_url     TEXT,
    secondary_doc_type    TEXT,
    status                kyc_status NOT NULL DEFAULT 'pending',
    reviewed_by           UUID,
    reviewed_at           TIMESTAMPTZ,
    rejection_reason      TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_kyc_user       FOREIGN KEY (user_id)     REFERENCES users (id),
    CONSTRAINT fk_kyc_reviewer   FOREIGN KEY (reviewed_by) REFERENCES users (id),
    CONSTRAINT chk_kyc_individual CHECK (
        account_type != 'individual' OR full_name IS NOT NULL
    ),
    CONSTRAINT chk_kyc_company CHECK (
        account_type != 'company' OR (company_name IS NOT NULL AND registration_number IS NOT NULL)
    )
);

CREATE INDEX idx_kyc_user   ON kyc_verifications (user_id);
CREATE INDEX idx_kyc_status ON kyc_verifications (status);

-- =============================================================================
-- 10. CREDIT HISTORY
-- =============================================================================

CREATE TABLE credit_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_id   UUID NOT NULL,
    action      history_action NOT NULL,
    actor_id    UUID NOT NULL,
    price_eth   NUMERIC(38, 18),
    tx_hash     TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_history_credit FOREIGN KEY (credit_id) REFERENCES carbon_credits (id),
    CONSTRAINT fk_history_actor  FOREIGN KEY (actor_id)  REFERENCES users (id)
);

CREATE INDEX idx_history_credit ON credit_history (credit_id);
CREATE INDEX idx_history_actor  ON credit_history (actor_id);
CREATE INDEX idx_history_action ON credit_history (action);

-- =============================================================================
-- 11. NOTIFICATIONS
-- =============================================================================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    message     TEXT NOT NULL,
    type        notification_type NOT NULL DEFAULT 'info',
    is_read     BOOLEAN NOT NULL DEFAULT false,
    link        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_notif_user    ON notifications (user_id);
CREATE INDEX idx_notif_unread  ON notifications (user_id, is_read) WHERE is_read = false;

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_certification_bodies_updated_at
    BEFORE UPDATE ON certification_bodies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_proposals_updated_at
    BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_carbon_credits_updated_at
    BEFORE UPDATE ON carbon_credits FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sell_orders_updated_at
    BEFORE UPDATE ON sell_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_buy_orders_updated_at
    BEFORE UPDATE ON buy_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_kyc_updated_at
    BEFORE UPDATE ON kyc_verifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- DEMO SEED DATA
-- =============================================================================

INSERT INTO users (id, wallet_address, display_name, role) VALUES
  ('aaaa0001-0001-0001-0001-000000000001', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'GreenForest Corp', 'producer'),
  ('aaaa0002-0002-0002-0002-000000000002', '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'EcoTrade Investments', 'buyer'),
  ('aaaa0003-0003-0003-0003-000000000003', '0xcccccccccccccccccccccccccccccccccccccccc', 'ITP Auditor Group', 'certification_body'),
  ('aaaa0004-0004-0004-0004-000000000004', '0xdddddddddddddddddddddddddddddddddddddddd', 'CarbonNeutral Industries', 'buyer')
ON CONFLICT (wallet_address) DO NOTHING;

INSERT INTO kyc_verifications (user_id, account_type, company_name, registration_number, email, country, status, reviewed_at) VALUES
  ('aaaa0001-0001-0001-0001-000000000001', 'company', 'GreenForest Corp', 'CIN-2024-GF001', 'admin@greenforest.io', 'India', 'verified', now()),
  ('aaaa0002-0002-0002-0002-000000000002', 'company', 'EcoTrade Investments', 'CIN-2024-ET002', 'trade@ecotrade.com', 'Singapore', 'verified', now()),
  ('aaaa0003-0003-0003-0003-000000000003', 'company', 'VerraAudit Labs', 'CIN-2024-VA003', 'audit@verraaudit.org', 'Switzerland', 'verified', now()),
  ('aaaa0004-0004-0004-0004-000000000004', 'company', 'CarbonNeutral Industries', 'CIN-2024-CN004', 'ops@carbonneutral.co', 'Germany', 'verified', now());

INSERT INTO proposals (id, producer_id, title, description, commodity_type, credit_quantity, sensor_data, status, submitted_at) VALUES
  (
    'pppp0001-0001-0001-0001-000000000001',
    'aaaa0001-0001-0001-0001-000000000001',
    'Amazon Reforestation Plot B — 500 Ton Batch',
    'Large-scale native species reforestation across 200 hectares in the Amazon basin.',
    'carbon_credit', 500,
    '{"device_id": "IOT-AMAZON-B1", "co2_sequestered_tons": 500, "temperature_c": 28, "humidity_pct": 89, "ndvi_score": 0.82, "recorded_at": "2026-03-10T12:00:00Z"}'::jsonb,
    'submitted', now() - interval '2 days'
  ),
  (
    'pppp0002-0002-0002-0002-000000000002',
    'aaaa0001-0001-0001-0001-000000000001',
    'Western Ghats Mangrove Restoration',
    'Coastal mangrove rehabilitation covering 50 hectares along the Karnataka coastline.',
    'carbon_credit', 150,
    '{"device_id": "IOT-MNGV-K2", "co2_sequestered_tons": 150, "temperature_c": 31, "humidity_pct": 92, "ndvi_score": 0.71, "recorded_at": "2026-03-10T14:30:00Z"}'::jsonb,
    'submitted', now() - interval '1 day'
  ),
  (
    'pppp0003-0003-0003-0003-000000000003',
    'aaaa0001-0001-0001-0001-000000000001',
    'Rajasthan Solar Cookstove Distribution',
    'Distribution of 2000 efficient solar cookstoves across rural Rajasthan communities.',
    'carbon_credit', 80,
    '{"device_id": "IOT-COOK-R3", "co2_sequestered_tons": 80, "temperature_c": 35, "humidity_pct": 25, "ndvi_score": 0.45, "recorded_at": "2026-03-11T08:00:00Z"}'::jsonb,
    'submitted', now()
  );

INSERT INTO notifications (user_id, message, type) VALUES
  ('aaaa0001-0001-0001-0001-000000000001', 'Your KYC verification has been approved.', 'success'),
  ('aaaa0001-0001-0001-0001-000000000001', 'Proposal "Amazon Reforestation Plot B" is pending VVB review.', 'info'),
  ('aaaa0003-0003-0003-0003-000000000003', '3 proposals are awaiting your review.', 'warning'),
  ('aaaa0002-0002-0002-0002-000000000002', 'Welcome to CarbonX marketplace. Browse available credits.', 'info');

-- =============================================================================
-- Demo accounts:
--   Producer  : admin@greenforest.io
--   Investor  : trade@ecotrade.com
--   Verifier  : audit@verraaudit.org
--   Investor 2: ops@carbonneutral.co
-- =============================================================================
