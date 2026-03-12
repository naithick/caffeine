-- =============================================================================
-- CarbonX — ADDITIVE Schema Migration (paste this AFTER existing schema)
-- =============================================================================
-- These are NEW tables and columns only. Nothing existing is altered or dropped.
-- Safe to run on top of schema.sql in Supabase SQL Editor.
-- =============================================================================

-- =============================================================================
-- NEW ENUM TYPES
-- =============================================================================

CREATE TYPE kyc_status AS ENUM ('pending', 'in_review', 'verified', 'rejected');
CREATE TYPE account_type AS ENUM ('individual', 'company');
CREATE TYPE notification_type AS ENUM ('success', 'info', 'warning');
CREATE TYPE history_action AS ENUM ('minted', 'listed', 'sold', 'purchased', 'retired', 'burned', 'revoked');

-- =============================================================================
-- 9. KYC VERIFICATIONS — Identity verification records
-- =============================================================================
-- Stores KYC submissions. Each user can have multiple attempts (resubmit on
-- rejection). The latest record determines the user's verification status.

CREATE TABLE kyc_verifications (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL,
    account_type          account_type NOT NULL DEFAULT 'individual',

    -- Individual fields
    full_name             TEXT,

    -- Company fields
    company_name          TEXT,
    registration_number   TEXT,       -- CIN / Tax ID / Company Number

    -- Shared fields
    email                 TEXT NOT NULL,
    country               TEXT NOT NULL,

    -- Document references (Supabase Storage paths or IPFS CIDs)
    primary_doc_url       TEXT,       -- passport/national ID  OR  certificate of incorporation
    primary_doc_type      TEXT,       -- e.g. 'passport', 'national_id', 'incorporation_cert'
    secondary_doc_url     TEXT,       -- utility bill  OR  corporate bank statement / tax doc
    secondary_doc_type    TEXT,       -- e.g. 'utility_bill', 'bank_statement', 'tax_document'

    -- Status tracking
    status                kyc_status NOT NULL DEFAULT 'pending',
    reviewed_by           UUID,       -- admin/verifier who reviewed
    reviewed_at           TIMESTAMPTZ,
    rejection_reason      TEXT,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_kyc_user       FOREIGN KEY (user_id)     REFERENCES users (id),
    CONSTRAINT fk_kyc_reviewer   FOREIGN KEY (reviewed_by) REFERENCES users (id),
    
    -- Individual must have full_name, company must have company_name + registration_number
    CONSTRAINT chk_kyc_individual CHECK (
        account_type != 'individual' OR full_name IS NOT NULL
    ),
    CONSTRAINT chk_kyc_company CHECK (
        account_type != 'company' OR (company_name IS NOT NULL AND registration_number IS NOT NULL)
    )
);

CREATE INDEX idx_kyc_user   ON kyc_verifications (user_id);
CREATE INDEX idx_kyc_status ON kyc_verifications (status);

CREATE TRIGGER trg_kyc_updated_at
    BEFORE UPDATE ON kyc_verifications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 10. CREDIT HISTORY — Full audit trail for carbon credit lifecycle
-- =============================================================================
-- Every state transition (minted → listed → sold → retired) is logged here.
-- Immutable append-only log for compliance and transparency.

CREATE TABLE credit_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_id   UUID NOT NULL,
    action      history_action NOT NULL,
    actor_id    UUID NOT NULL,
    price_eth   NUMERIC(38, 18),        -- price at time of action (if applicable)
    tx_hash     TEXT,                    -- on-chain transaction hash (if applicable)
    metadata    JSONB,                   -- any extra context
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_history_credit FOREIGN KEY (credit_id) REFERENCES carbon_credits (id),
    CONSTRAINT fk_history_actor  FOREIGN KEY (actor_id)  REFERENCES users (id)
);

CREATE INDEX idx_history_credit ON credit_history (credit_id);
CREATE INDEX idx_history_actor  ON credit_history (actor_id);
CREATE INDEX idx_history_action ON credit_history (action);

-- =============================================================================
-- 11. NOTIFICATIONS — Persistent user notifications
-- =============================================================================
-- Replaces the ephemeral Zustand notifications that vanish on refresh.

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    message     TEXT NOT NULL,
    type        notification_type NOT NULL DEFAULT 'info',
    is_read     BOOLEAN NOT NULL DEFAULT false,
    link        TEXT,                    -- optional deep-link context
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_notif_user    ON notifications (user_id);
CREATE INDEX idx_notif_unread  ON notifications (user_id, is_read) WHERE is_read = false;

-- =============================================================================
-- DONE. New tables: kyc_verifications, credit_history, notifications
-- =============================================================================
-- NOTE: The existing `users` table already has `display_name`. 
-- The frontend fields `kyc_status`, `balance_eth`, `carbon_credits` will be
-- derived from joins:
--   - kyc_status  → latest kyc_verifications.status WHERE user_id = ?
--   - balance_eth → read from blockchain / wallet provider
--   - carbon_credits → COUNT(*) from carbon_credits WHERE owner_id = ? AND status = 'minted'
-- This avoids altering the users table.
-- =============================================================================
