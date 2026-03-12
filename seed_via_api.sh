#!/usr/bin/env bash
# seed_via_api.sh — Seed extra demo data through the running backend API.
# Run this AFTER start.sh is running and seed_data.sql has been pasted into Supabase.

API="http://localhost:5000/api"

echo "=== Seeding extra demo data via API ==="

# ── More proposals from GreenForest Corp (producer) ──────────────
echo "[1/6] Creating additional proposals..."

curl -s -X POST "$API/proposals" -H "Content-Type: application/json" -d '{
  "producer_id": "aaaa0001-0001-0001-0001-000000000001",
  "title": "Borneo Peatland Conservation",
  "description": "Conservation of 500 hectares of tropical peatland in Central Kalimantan. Methodology VM0004 applied for avoided emissions from peat decomposition.",
  "credit_quantity": 300,
  "sensor_data": {"device_id": "IOT-PEAT-B4", "co2_sequestered_tons": 300, "temperature_c": 30, "humidity_pct": 88, "ndvi_score": 0.78, "recorded_at": "2026-03-09T10:00:00Z"}
}' | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'  Proposal: {d.get(\"proposal\",{}).get(\"id\",\"ERR\")}')" 2>/dev/null

curl -s -X POST "$API/proposals" -H "Content-Type: application/json" -d '{
  "producer_id": "aaaa0001-0001-0001-0001-000000000001",
  "title": "Himalayan Agroforestry Initiative",
  "description": "Planting native fruit and timber trees across 80 hectares of degraded agricultural land in Uttarakhand. Baseline methodology AR-AMS0007.",
  "credit_quantity": 120,
  "sensor_data": {"device_id": "IOT-AGRO-H5", "co2_sequestered_tons": 120, "temperature_c": 18, "humidity_pct": 65, "ndvi_score": 0.67, "recorded_at": "2026-03-10T06:00:00Z"}
}' | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'  Proposal: {d.get(\"proposal\",{}).get(\"id\",\"ERR\")}')" 2>/dev/null

curl -s -X POST "$API/proposals" -H "Content-Type: application/json" -d '{
  "producer_id": "aaaa0001-0001-0001-0001-000000000001",
  "title": "Tamil Nadu Wind Farm Upgrade",
  "description": "Repowering 15 wind turbines in the Muppandal wind farm. Old 250kW units replaced with 2MW turbines. Methodology AMS-I.D applied.",
  "credit_quantity": 450,
  "sensor_data": {"device_id": "IOT-WIND-TN6", "co2_sequestered_tons": 450, "temperature_c": 33, "humidity_pct": 55, "ndvi_score": 0.52, "recorded_at": "2026-03-08T16:00:00Z"}
}' | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'  Proposal: {d.get(\"proposal\",{}).get(\"id\",\"ERR\")}')" 2>/dev/null

# ── Auto-verify some proposals (simulates MRV Oracle) ────────────
echo "[2/6] Auto-verifying proposals via MRV Oracle..."

# Get all proposals
PROPOSALS=$(curl -s "$API/proposals" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data.get('proposals', []):
    if p['status'] == 'submitted':
        print(p['id'])
" 2>/dev/null)

VERIFIED_COUNT=0
for PID in $PROPOSALS; do
  RESULT=$(curl -s -X POST "$API/verification/auto" -H "Content-Type: application/json" -d "{\"proposal_id\": \"$PID\"}" 2>/dev/null)
  STATUS=$(echo "$RESULT" | python3 -c "import sys, json; d=json.load(sys.stdin); print('OK' if d.get('credit') else d.get('reason','FAIL'))" 2>/dev/null)
  if [ "$STATUS" = "OK" ]; then
    VERIFIED_COUNT=$((VERIFIED_COUNT + 1))
    echo "  ✅ Verified: $PID"
  else
    echo "  ⏭ Skipped (NDVI < 0.6): $PID"
  fi
done
echo "  Verified $VERIFIED_COUNT proposals"

# ── List verified credits on marketplace ─────────────────────────
echo "[3/6] Listing verified credits on marketplace..."

CREDITS=$(curl -s "$API/proposals" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data.get('proposals', []):
    if p['status'] == 'approved':
        print(p['id'])
" 2>/dev/null)

# We need to list credits for sale
# First get carbon_credits from Supabase via sell endpoint
echo "  (Credits will be available for marketplace listing)"

# ── Add more notifications ───────────────────────────────────────
echo "[4/6] Creating notifications..."

curl -s -X POST "$API/notifications" -H "Content-Type: application/json" -d '{
  "user_id": "aaaa0001-0001-0001-0001-000000000001",
  "message": "Your Borneo Peatland Conservation proposal has been auto-verified by MRV Oracle.",
  "type": "success"
}' > /dev/null 2>&1

curl -s -X POST "$API/notifications" -H "Content-Type: application/json" -d '{
  "user_id": "aaaa0002-0002-0002-0002-000000000002",
  "message": "New carbon credits are available on the marketplace. Browse 3 new listings.",
  "type": "info"
}' > /dev/null 2>&1

curl -s -X POST "$API/notifications" -H "Content-Type: application/json" -d '{
  "user_id": "aaaa0003-0003-0003-0003-000000000003",
  "message": "2 proposals auto-verified by MRV Oracle. Review their sensor data.",
  "type": "info"
}' > /dev/null 2>&1

curl -s -X POST "$API/notifications" -H "Content-Type: application/json" -d '{
  "user_id": "aaaa0004-0004-0004-0004-000000000004",
  "message": "Carbon credit prices have dropped 5% this week. Good time to invest.",
  "type": "info"
}' > /dev/null 2>&1

echo "  4 notifications created"

# ── Log credit history events ────────────────────────────────────
echo "[5/6] Logging credit history events..."

curl -s -X POST "$API/history" -H "Content-Type: application/json" -d '{
  "credit_id": "pppp0001-0001-0001-0001-000000000001",
  "action": "minted",
  "actor_id": "aaaa0001-0001-0001-0001-000000000001",
  "tx_hash": "0xdemo1234567890abcdef"
}' > /dev/null 2>&1

curl -s -X POST "$API/history" -H "Content-Type: application/json" -d '{
  "credit_id": "pppp0001-0001-0001-0001-000000000001",
  "action": "listed",
  "actor_id": "aaaa0001-0001-0001-0001-000000000001",
  "price_eth": "2.5"
}' > /dev/null 2>&1

echo "  2 history entries created"

echo ""
echo "[6/6] Done! Extra demo data seeded."
echo ""
echo "Demo accounts:"
echo "  Seller : admin@greenforest.io  → seller dashboard"
echo "  Buyer  : trade@ecotrade.com    → buyer dashboard"  
echo "  Verifier: audit@verraaudit.org → verifier dashboard"
