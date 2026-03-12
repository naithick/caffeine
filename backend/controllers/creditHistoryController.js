/**
 * creditHistoryController.js — Audit trail for carbon credit lifecycle events.
 */

const supabase = require("../config/supabaseClient");

/**
 * POST /api/history
 *
 * Log a credit lifecycle event (minted, listed, sold, purchased, retired, burned, revoked).
 * Typically called internally by other controllers after a state change.
 */
async function logCreditEvent(req, res) {
  try {
    const { credit_id, action, actor_id, price_eth, tx_hash, metadata } = req.body;

    if (!credit_id || !action || !actor_id) {
      return res.status(400).json({
        error: "credit_id, action, and actor_id are required",
      });
    }

    const validActions = ["minted", "listed", "sold", "purchased", "retired", "burned", "revoked"];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: `action must be one of: ${validActions.join(", ")}`,
      });
    }

    const { data, error } = await supabase
      .from("credit_history")
      .insert({
        credit_id,
        action,
        actor_id,
        price_eth: price_eth || null,
        tx_hash: tx_hash || null,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Credit history insert error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ entry: data });
  } catch (error) {
    console.error("❌ logCreditEvent failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/history/credit/:creditId
 *
 * Get complete lifecycle history for a specific carbon credit.
 */
async function getCreditHistory(req, res) {
  try {
    const { creditId } = req.params;

    if (!creditId) {
      return res.status(400).json({ error: "creditId is required" });
    }

    const { data, error } = await supabase
      .from("credit_history")
      .select("*, users!fk_history_actor(display_name, wallet_address)")
      .eq("credit_id", creditId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Credit history fetch error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ history: data });
  } catch (error) {
    console.error("❌ getCreditHistory failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/history/user/:userId
 *
 * Get all credit lifecycle events where a specific user was the actor.
 */
async function getUserHistory(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const { data, error } = await supabase
      .from("credit_history")
      .select("*")
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ User history fetch error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ history: data });
  } catch (error) {
    console.error("❌ getUserHistory failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { logCreditEvent, getCreditHistory, getUserHistory };
