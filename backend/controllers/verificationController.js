/**
 * verificationController.js — Proposal review and on-chain minting.
 */

const supabase = require("../config/supabaseClient");
const { mintCarbonCredit } = require("../services/blockchainService");
const { simulateSatelliteValidation } = require("../services/mrvOracle");

/**
 * POST /api/verification/review
 *
 * Review a proposal: approve (triggers on-chain mint) or reject.
 */
async function reviewProposal(req, res) {
  try {
    const { proposal_id, certifier_id, decision } = req.body;

    if (!proposal_id || !certifier_id || !decision) {
      return res.status(400).json({
        error: "proposal_id, certifier_id, and decision are required",
      });
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        error: "decision must be 'approved' or 'rejected'",
      });
    }

    // ── REJECTED ────────────────────────────────────────
    if (decision === "rejected") {
      // Update proposal status
      const { error: updateError } = await supabase
        .from("proposals")
        .update({ status: "rejected" })
        .eq("id", proposal_id);

      if (updateError) {
        console.error("❌ Proposal update error:", updateError.message);
        return res.status(500).json({ error: updateError.message });
      }

      // Insert review record
      const { data: review, error: reviewError } = await supabase
        .from("proposal_reviews")
        .insert({
          proposal_id,
          certifier_id,
          decision: "rejected",
        })
        .select()
        .single();

      if (reviewError) {
        console.error("❌ Review insert error:", reviewError.message);
        return res.status(500).json({ error: reviewError.message });
      }

      return res.status(200).json({
        message: "Proposal rejected",
        review,
      });
    }

    // ── APPROVED — Mint on-chain first ──────────────────
    // Fetch the producer's wallet address from the proposal
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("*, users!fk_proposal_producer(wallet_address)")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      console.error("❌ Proposal fetch error:", fetchError?.message);
      return res.status(404).json({ error: "Proposal not found" });
    }

    const walletAddress = proposal.users?.wallet_address;
    if (!walletAddress) {
      return res.status(400).json({
        error: "Producer wallet address not found for this proposal",
      });
    }

    // ── Mint carbon credit NFT ──────────────────────────
    let mintResult;
    try {
      mintResult = await mintCarbonCredit(walletAddress, proposal_id);
    } catch (mintError) {
      console.error("❌ On-chain mint failed:", mintError.message);
      return res.status(502).json({
        error: "Blockchain minting failed. Database not updated.",
        details: mintError.message,
      });
    }

    // ── Mint succeeded — update database ────────────────
    // 1. Update proposal status
    const { error: statusError } = await supabase
      .from("proposals")
      .update({ status: "approved" })
      .eq("id", proposal_id);

    if (statusError) {
      console.error("❌ Proposal status update error:", statusError.message);
    }

    // 2. Insert review record
    const { data: review, error: reviewError } = await supabase
      .from("proposal_reviews")
      .insert({
        proposal_id,
        certifier_id,
        decision: "approved",
      })
      .select()
      .single();

    if (reviewError) {
      console.error("❌ Review insert error:", reviewError.message);
    }

    // 3. Insert minted asset into carbon_credits
    const { data: credit, error: creditError } = await supabase
      .from("carbon_credits")
      .insert({
        proposal_id,
        owner_id: proposal.producer_id,
        token_id: mintResult.tokenId,
        tx_hash: mintResult.txHash,
        status: "minted",
      })
      .select()
      .single();

    if (creditError) {
      console.error("❌ Credit insert error:", creditError.message);
    }

    return res.status(200).json({
      message: "Proposal approved and carbon credit minted",
      review,
      credit,
      blockchain: mintResult,
    });
  } catch (error) {
    console.error("❌ reviewProposal failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/verification/auto
 *
 * MRV Oracle: automatically verify and mint a carbon credit without
 * a human certifier, using satellite NDVI data validation.
 */
async function autoVerifyProposal(req, res) {
  try {
    const { proposal_id } = req.body;

    if (!proposal_id) {
      return res.status(400).json({ error: "proposal_id is required" });
    }

    // ── Fetch proposal + producer wallet ────────────────
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("*, users!fk_proposal_producer(wallet_address)")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      console.error("❌ Proposal fetch error:", fetchError?.message);
      return res.status(404).json({ error: "Proposal not found" });
    }

    // ── Run satellite validation ─────────────────────────
    const validation = await simulateSatelliteValidation(proposal);
    console.log(`🛰  MRV Oracle result for proposal ${proposal_id}:`, validation);

    // ── REJECTED by oracle ───────────────────────────────
    if (!validation.verified) {
      const { error: updateError } = await supabase
        .from("proposals")
        .update({
          status: "rejected",
          sensor_data: {
            ...(proposal.sensor_data || {}),
            ndvi_score: validation.ndvi_score,
            mrv_reason: validation.reason,
          },
        })
        .eq("id", proposal_id);

      if (updateError) {
        console.error("❌ Proposal update error:", updateError.message);
        return res.status(500).json({ error: updateError.message });
      }

      return res.status(200).json({
        message: "Proposal rejected by MRV Oracle",
        ndvi_score: validation.ndvi_score,
        reason: validation.reason,
      });
    }

    // ── VERIFIED — mint on-chain ─────────────────────────
    const walletAddress = proposal.users?.wallet_address;
    if (!walletAddress) {
      return res.status(400).json({
        error: "Producer wallet address not found for this proposal",
      });
    }

    let mintResult;
    try {
      mintResult = await mintCarbonCredit(walletAddress, proposal_id);
    } catch (mintError) {
      console.error("❌ On-chain mint failed:", mintError.message);
      return res.status(502).json({
        error: "Blockchain minting failed. Database not updated.",
        details: mintError.message,
      });
    }

    // ── Mint succeeded — update proposal status ──────────
    const { error: statusError } = await supabase
      .from("proposals")
      .update({
        status: "approved",
        sensor_data: {
          ...(proposal.sensor_data || {}),
          ndvi_score: validation.ndvi_score,
        },
      })
      .eq("id", proposal_id);

    if (statusError) {
      console.error("❌ Proposal status update error:", statusError.message);
    }

    // ── Insert minted credit record ───────────────────────
    const { data: credit, error: creditError } = await supabase
      .from("carbon_credits")
      .insert({
        proposal_id,
        owner_id: proposal.producer_id,
        token_id: mintResult.tokenId,
        tx_hash: mintResult.txHash,
        status: "minted",
      })
      .select()
      .single();

    if (creditError) {
      console.error("❌ Credit insert error:", creditError.message);
    }

    return res.status(200).json({
      message: "Proposal auto-approved and carbon credit minted via MRV Oracle",
      ndvi_score: validation.ndvi_score,
      credit,
      blockchain: mintResult,
    });
  } catch (error) {
    console.error("❌ autoVerifyProposal failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { reviewProposal, autoVerifyProposal };
