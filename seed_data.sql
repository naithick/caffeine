-- =============================================================================
-- CarbonX — Demo Seed Data
-- =============================================================================
-- Paste this in Supabase SQL Editor AFTER running schema.sql + schema_additions.sql
-- Creates demo users for each role, pre-verified KYC, sample proposals, and credits.
-- =============================================================================

-- ── Demo Users ──────────────────────────────────────────────
-- Using fixed UUIDs so foreign keys work reliably

INSERT INTO users (id, wallet_address, display_name, role) VALUES
  ('aaaa0001-0001-0001-0001-000000000001', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'GreenForest Corp', 'producer'),
  ('aaaa0002-0002-0002-0002-000000000002', '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'EcoTrade Investments', 'buyer'),
  ('aaaa0003-0003-0003-0003-000000000003', '0xcccccccccccccccccccccccccccccccccccccccc', 'ITP Auditor Group', 'certification_body'),
  ('aaaa0004-0004-0004-0004-000000000004', '0xdddddddddddddddddddddddddddddddddddddddd', 'CarbonNeutral Industries', 'buyer')
ON CONFLICT (wallet_address) DO NOTHING;

-- ── KYC Records (all verified) ──────────────────────────────

INSERT INTO kyc_verifications (user_id, account_type, company_name, registration_number, email, country, status, reviewed_at) VALUES
  ('aaaa0001-0001-0001-0001-000000000001', 'company', 'GreenForest Corp', 'CIN-2024-GF001', 'admin@greenforest.io', 'India', 'verified', now()),
  ('aaaa0002-0002-0002-0002-000000000002', 'company', 'EcoTrade Investments', 'CIN-2024-ET002', 'trade@ecotrade.com', 'Singapore', 'verified', now()),
  ('aaaa0003-0003-0003-0003-000000000003', 'company', 'VerraAudit Labs', 'CIN-2024-VA003', 'audit@verraaudit.org', 'Switzerland', 'verified', now()),
  ('aaaa0004-0004-0004-0004-000000000004', 'company', 'CarbonNeutral Industries', 'CIN-2024-CN004', 'ops@carbonneutral.co', 'Germany', 'verified', now());

-- ── Sample Proposals ────────────────────────────────────────

INSERT INTO proposals (id, producer_id, title, description, commodity_type, credit_quantity, sensor_data, status, submitted_at) VALUES
  (
    'pppp0001-0001-0001-0001-000000000001',
    'aaaa0001-0001-0001-0001-000000000001',
    'Amazon Reforestation Plot B — 500 Ton Batch',
    'Large-scale native species reforestation across 200 hectares in the Amazon basin. Baseline methodology AR-ACM0003 applied with satellite-verified NDVI monitoring.',
    'carbon_credit',
    500,
    '{"device_id": "IOT-AMAZON-B1", "co2_sequestered_tons": 500, "temperature_c": 28, "humidity_pct": 89, "ndvi_score": 0.82, "recorded_at": "2026-03-10T12:00:00Z"}'::jsonb,
    'submitted',
    now() - interval '2 days'
  ),
  (
    'pppp0002-0002-0002-0002-000000000002',
    'aaaa0001-0001-0001-0001-000000000001',
    'Western Ghats Mangrove Restoration',
    'Coastal mangrove rehabilitation project covering 50 hectares along the Karnataka coastline. Blue carbon methodology applied with tidal sensor verification.',
    'carbon_credit',
    150,
    '{"device_id": "IOT-MNGV-K2", "co2_sequestered_tons": 150, "temperature_c": 31, "humidity_pct": 92, "ndvi_score": 0.71, "recorded_at": "2026-03-10T14:30:00Z"}'::jsonb,
    'submitted',
    now() - interval '1 day'
  ),
  (
    'pppp0003-0003-0003-0003-000000000003',
    'aaaa0001-0001-0001-0001-000000000001',
    'Rajasthan Solar Cookstove Distribution',
    'Distribution of 2000 efficient solar cookstoves across rural Rajasthan communities, replacing traditional biomass burning. Methodology AMS-II.G applied.',
    'carbon_credit',
    80,
    '{"device_id": "IOT-COOK-R3", "co2_sequestered_tons": 80, "temperature_c": 35, "humidity_pct": 25, "ndvi_score": 0.45, "recorded_at": "2026-03-11T08:00:00Z"}'::jsonb,
    'submitted',
    now()
  );

-- ── Sample Notifications ────────────────────────────────────

INSERT INTO notifications (user_id, message, type) VALUES
  ('aaaa0001-0001-0001-0001-000000000001', 'Your KYC verification has been approved.', 'success'),
  ('aaaa0001-0001-0001-0001-000000000001', 'Proposal "Amazon Reforestation Plot B" is pending VVB review.', 'info'),
  ('aaaa0003-0003-0003-0003-000000000003', '3 proposals are awaiting your review.', 'warning'),
  ('aaaa0002-0002-0002-0002-000000000002', 'Welcome to CarbonX marketplace. Browse available credits.', 'info');

-- ── Done ─────────────────────────────────────────────────────
-- Demo accounts:
--   Seller/Producer : admin@greenforest.io     (wallet 0xaaaa...)
--   Buyer/Investor  : trade@ecotrade.com       (wallet 0xbbbb...)
--   Verifier        : audit@verraaudit.org     (wallet 0xcccc...)
--   Buyer #2        : ops@carbonneutral.co     (wallet 0xdddd...)
-- =============================================================================
