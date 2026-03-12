/**
 * marketplaceController.js — Buy/sell carbon credits on the marketplace.
 */

const supabase = require("../config/supabaseClient");
const { retireOnChainCredit } = require("../services/blockchainService");
const { ethers } = require("ethers");

// ── Load the Escrow ABI (compiled artifact) ─────────────────
let ESCROW_ABI;
try {
  const escrowArtifact = require("../../artifacts/contracts/MarketplaceEscrow.sol/MarketplaceEscrow.json");
  ESCROW_ABI = escrowArtifact.abi;
} catch {
  // Fallback: minimal ABI with only the event we need
  ESCROW_ABI = [
    "event CreditSold(uint256 tokenId, address buyer, uint256 price)",
  ];
}

const ESCROW_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

// ── Helpers ─────────────────────────────────────────────────

/**
 * Safely convert NUMERIC(38,18) fields to strings to prevent
 * IEEE 754 floating-point precision loss in JSON responses.
 */
function sanitizePriceFields(row, fields) {
  const sanitized = { ...row };
  for (const field of fields) {
    if (sanitized[field] !== null && sanitized[field] !== undefined) {
      sanitized[field] = String(sanitized[field]);
    }
  }
  return sanitized;
}

// ── Sell Orders ─────────────────────────────────────────────

/**
 * POST /api/marketplace/sell
 *
 * Create a sell order for a carbon credit.
 */
async function createSellOrder(req, res) {
  try {
    const { seller_id, credit_id, asking_price_eth } = req.body;

    if (!seller_id || !credit_id || !asking_price_eth) {
      return res.status(400).json({
        error: "seller_id, credit_id, and asking_price_eth are required",
      });
    }

    const { data, error } = await supabase
      .from("sell_orders")
      .insert({
        seller_id,
        credit_id,
        asking_price_eth,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Sell order insert error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      order: sanitizePriceFields(data, ["asking_price_eth"]),
    });
  } catch (error) {
    console.error("❌ createSellOrder failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/marketplace/sell
 *
 * List all open sell orders.
 */
async function getSellOrders(_req, res) {
  try {
    const { data, error } = await supabase
      .from("sell_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Sell orders fetch error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    const sanitized = data.map((row) =>
      sanitizePriceFields(row, ["asking_price_eth"])
    );

    return res.status(200).json({ orders: sanitized });
  } catch (error) {
    console.error("❌ getSellOrders failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ── Buy Orders ──────────────────────────────────────────────

/**
 * POST /api/marketplace/buy
 *
 * Create a buy order (bid) for a carbon credit.
 */
async function createBuyOrder(req, res) {
  try {
    const { buyer_id, credit_id, bid_price_eth } = req.body;

    if (!buyer_id || !credit_id || !bid_price_eth) {
      return res.status(400).json({
        error: "buyer_id, credit_id, and bid_price_eth are required",
      });
    }

    const { data, error } = await supabase
      .from("buy_orders")
      .insert({
        buyer_id,
        credit_id,
        bid_price_eth,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Buy order insert error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      order: sanitizePriceFields(data, ["bid_price_eth"]),
    });
  } catch (error) {
    console.error("❌ createBuyOrder failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/marketplace/buy
 *
 * List all open buy orders.
 */
async function getBuyOrders(_req, res) {
  try {
    const { data, error } = await supabase
      .from("buy_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Buy orders fetch error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    const sanitized = data.map((row) =>
      sanitizePriceFields(row, ["bid_price_eth"])
    );

    return res.status(200).json({ orders: sanitized });
  } catch (error) {
    console.error("❌ getBuyOrders failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ── Retirement ─────────────────────────────────────────────

/**
 * POST /api/marketplace/retire
 *
 * Burn a carbon credit NFT on-chain and mark it retired in the database.
 */
async function retireCredit(req, res) {
  try {
    const { token_id, wallet_address } = req.body;

    if (!token_id || !wallet_address) {
      return res.status(400).json({
        error: "token_id and wallet_address are required",
      });
    }

    // ── Burn on-chain ───────────────────────────────────────
    let retireResult;
    try {
      retireResult = await retireOnChainCredit(wallet_address, token_id);
    } catch (retireError) {
      console.error("❌ On-chain retirement failed:", retireError.message);
      return res.status(502).json({
        error: "Blockchain retirement failed. Database not updated.",
        details: retireError.message,
      });
    }

    // ── Update database ─────────────────────────────────────
    const { data, error } = await supabase
      .from("carbon_credits")
      .update({ status: "retired", retired_at: new Date().toISOString() })
      .eq("token_id", token_id)
      .select()
      .single();

    if (error) {
      console.error("❌ Credit retirement DB update error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      message: "Carbon credit retired (burned) successfully",
      credit: data,
      blockchain: retireResult,
    });
  } catch (error) {
    console.error("❌ retireCredit failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ── Fraud Prevention ──────────────────────────────────────────

/**
 * POST /api/marketplace/execute
 *
 * Execute a trade via the on-chain MarketplaceEscrow contract.
 * Listens for the CreditSold event before updating Supabase.
 */
async function executeTrade(req, res) {
  try {
    const { token_id } = req.body;

    if (!token_id) {
      return res.status(400).json({ error: "token_id is required" });
    }

    if (!ESCROW_ADDRESS) {
      return res.status(500).json({
        error: "ESCROW_CONTRACT_ADDRESS not set in environment",
      });
    }

    // Initialize provider and read-only contract to listen for CreditSold
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const escrowContract = new ethers.Contract(
      ESCROW_ADDRESS,
      ESCROW_ABI,
      provider
    );

    // Wait for the CreditSold event for this specific tokenId.
    // This resolves once the on-chain event is emitted (e.g. after buyCredit tx).
    const sold = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        escrowContract.removeAllListeners("CreditSold");
        reject(new Error("Timed out waiting for CreditSold event"));
      }, 60_000); // 60s timeout

      escrowContract.on("CreditSold", (eventTokenId, buyer, price) => {
        if (eventTokenId.toString() === String(token_id)) {
          clearTimeout(timeout);
          escrowContract.removeAllListeners("CreditSold");
          resolve({ tokenId: eventTokenId.toString(), buyer, price: price.toString() });
        }
      });
    });

    // On-chain event captured — update Supabase
    const { data, error } = await supabase
      .from("carbon_credits")
      .update({ status: "transferred" })
      .eq("token_id", sold.tokenId)
      .select()
      .single();

    if (error) {
      console.error("❌ Trade DB update error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      message: "Trade executed — on-chain CreditSold event confirmed",
      credit: data,
      event: sold,
    });
  } catch (error) {
    console.error("❌ executeTrade failed:", error.message);
    return res.status(500).json({ error: error.message });
  }
}

// ── Fraud Prevention ──────────────────────────────────────────

/**
 * POST /api/marketplace/revoke
 *
 * Revoke a fraudulent credit on-chain and update status in database.
 */
async function revokeFraudulentCredit(req, res) {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ error: "tokenId is required" });
    }

    // Initialize an ethers.js Wallet and connect to CarbonCreditNFT
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const contractArtifact = require("../config/CarbonCreditNFT.json");
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractArtifact.abi, wallet);

    // Execute revokeCredit
    const tx = await contract.revokeCredit(tokenId);
    const receipt = await tx.wait();

    // Update Supabase
    const { error } = await supabase
      .from("carbon_credits")
      .update({ status: "revoked" })
      .eq("id", tokenId);

    if (error) {
      console.error("❌ Credit revocation DB update error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ txHash: receipt.hash });
  } catch (error) {
    console.error("❌ revokeFraudulentCredit failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  createSellOrder,
  getSellOrders,
  createBuyOrder,
  getBuyOrders,
  executeTrade,
  retireCredit,
  revokeFraudulentCredit,
};
