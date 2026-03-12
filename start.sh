#!/usr/bin/env bash
# start.sh — Start the full CarbonX stack (backend + frontend).
#
# Usage:
#   chmod +x start.sh
#   ./start.sh            # normal start (skips npm install if node_modules exist)
#   ./start.sh --fresh    # force npm install before starting

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

FRESH=false
if [[ "${1:-}" == "--fresh" ]]; then
  FRESH=true
fi

# ── Cleanup on exit ──────────────────────────────────────────
cleanup() {
  echo ""
  echo "Shutting down..."
  [ -n "${BACKEND_PID:-}" ]  && kill "$BACKEND_PID"  2>/dev/null
  [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null
  [ -n "${HARDHAT_PID:-}" ]  && kill "$HARDHAT_PID"  2>/dev/null
  wait 2>/dev/null
  echo "All processes stopped."
}
trap cleanup EXIT INT TERM

# ── 1. Install dependencies (only if needed) ────────────────
if [ "$FRESH" = true ] || [ ! -d "node_modules" ]; then
  echo "[1/4] Installing root dependencies..."
  npm install --silent
else
  echo "[1/4] Root dependencies already installed (use --fresh to reinstall)"
fi

if [ "$FRESH" = true ] || [ ! -d "frontend/node_modules" ]; then
  echo "      Installing frontend dependencies..."
  cd frontend && npm install --silent && cd ..
else
  echo "      Frontend dependencies already installed"
fi

# ── 2. Start Hardhat node (optional — won't block if it fails) ─
echo "[2/4] Starting Hardhat node..."
npx hardhat node &
HARDHAT_PID=$!

echo "      Waiting for Hardhat RPC..."
HARDHAT_READY=false
for i in $(seq 1 15); do
  if curl -s -o /dev/null http://127.0.0.1:8545 2>/dev/null; then
    echo "      Hardhat node ready (PID $HARDHAT_PID)"
    HARDHAT_READY=true
    break
  fi
  sleep 1
done

if [ "$HARDHAT_READY" = true ]; then
  # Deploy contract only if Hardhat started
  echo "      Deploying CarbonCreditNFT contract..."
  echo "y" | npx hardhat ignition deploy ignition/modules/CarbonCreditNFT.js --network localhost 2>/dev/null || true
else
  echo "      ⚠ Hardhat node did not start (blockchain features will be unavailable)"
  kill "$HARDHAT_PID" 2>/dev/null || true
  HARDHAT_PID=""
fi

# ── 3. Start backend server ─────────────────────────────────
echo "[3/4] Starting backend server..."
node backend/server.js &
BACKEND_PID=$!
sleep 2

if curl -s http://localhost:5000/api/health | grep -q '"status":"ok"'; then
  echo "      Backend ready on http://localhost:5000 (PID $BACKEND_PID)"
else
  echo "      ⚠ Backend health check failed (Supabase may be unreachable)"
fi

# ── 4. Start frontend dev server ─────────────────────────────
echo "[4/4] Starting frontend dev server..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd "$ROOT_DIR"
sleep 3

echo ""
echo "========================================"
echo "  CarbonX Stack Running"
echo "----------------------------------------"
[ -n "${HARDHAT_PID:-}" ] && \
echo "  Hardhat  : http://127.0.0.1:8545"
echo "  Backend  : http://localhost:5000"
echo "  Frontend : http://localhost:3000"
echo "  Health   : http://localhost:5000/api/health"
echo "----------------------------------------"
echo "  Press Ctrl+C to stop everything"
echo "========================================"
echo ""

# Keep the script alive so all background processes stay running.
wait
