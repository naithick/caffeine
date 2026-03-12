/**
 * proposalController.js — Carbon credit proposal submission.
 */

const supabase = require("../config/supabaseClient");

/**
 * POST /api/proposals
 *
 * Insert a new carbon credit proposal.
 */
async function createProposal(req, res) {
  try {
    const {
      producer_id,
      title,
      description,
      credit_quantity,
      sensor_data,
      metadata_hash,
    } = req.body;

    if (!producer_id || !title || !credit_quantity) {
      return res.status(400).json({
        error: "producer_id, title, and credit_quantity are required",
      });
    }

    // ── Registry Bridge Verification ────────────────────
    // Simulate checking if the project/credit exists elsewhere.
    // In a real app, this would be an internal service call or a direct API req.
    // For MVP, if metadata_hash is provided and starts with "0xdead", block it.
    if (metadata_hash && metadata_hash.toLowerCase().startsWith("0xdead")) {
      return res.status(409).json({
        error:
          "Conflict: Project already registered in external registry. Double-counting prevented.",
      });
    }

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        producer_id,
        title,
        description: description || null,
        credit_quantity,
        sensor_data: sensor_data || null,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ proposal: data });
  } catch (error) {
    console.error("❌ createProposal failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/proposals
 *
 * Fetch the latest carbon credit proposals.
 */
async function getProposals(req, res) {
  try {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("❌ Supabase fetch error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ proposals: data });
  } catch (error) {
    console.error("❌ getProposals failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { createProposal, getProposals };
