/**
 * kycController.js — KYC verification submission and review.
 */

const supabase = require("../config/supabaseClient");

/**
 * POST /api/kyc/submit
 *
 * Submit a KYC verification request.
 */
async function submitKYC(req, res) {
  try {
    const {
      user_id,
      account_type,
      full_name,
      company_name,
      registration_number,
      email,
      country,
      primary_doc_url,
      primary_doc_type,
      secondary_doc_url,
      secondary_doc_type,
    } = req.body;

    if (!user_id || !email || !country) {
      return res.status(400).json({
        error: "user_id, email, and country are required",
      });
    }

    if (account_type === "individual" && !full_name) {
      return res.status(400).json({ error: "full_name is required for individuals" });
    }

    if (account_type === "company" && (!company_name || !registration_number)) {
      return res.status(400).json({
        error: "company_name and registration_number are required for companies",
      });
    }

    const { data, error } = await supabase
      .from("kyc_verifications")
      .insert({
        user_id,
        account_type: account_type || "individual",
        full_name: full_name || null,
        company_name: company_name || null,
        registration_number: registration_number || null,
        email,
        country,
        primary_doc_url: primary_doc_url || null,
        primary_doc_type: primary_doc_type || null,
        secondary_doc_url: secondary_doc_url || null,
        secondary_doc_type: secondary_doc_type || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ KYC insert error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ kyc: data });
  } catch (error) {
    console.error("❌ submitKYC failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/kyc/:userId
 *
 * Get the latest KYC record for a user.
 */
async function getKYCStatus(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const { data, error } = await supabase
      .from("kyc_verifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ KYC fetch error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      kyc: data,
      status: data?.status || "none",
    });
  } catch (error) {
    console.error("❌ getKYCStatus failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/kyc/review
 *
 * Admin reviews a KYC submission (approve or reject).
 */
async function reviewKYC(req, res) {
  try {
    const { kyc_id, reviewer_id, decision, rejection_reason } = req.body;

    if (!kyc_id || !reviewer_id || !decision) {
      return res.status(400).json({
        error: "kyc_id, reviewer_id, and decision are required",
      });
    }

    if (!["verified", "rejected"].includes(decision)) {
      return res.status(400).json({
        error: "decision must be 'verified' or 'rejected'",
      });
    }

    const updatePayload = {
      status: decision,
      reviewed_by: reviewer_id,
      reviewed_at: new Date().toISOString(),
    };

    if (decision === "rejected" && rejection_reason) {
      updatePayload.rejection_reason = rejection_reason;
    }

    const { data, error } = await supabase
      .from("kyc_verifications")
      .update(updatePayload)
      .eq("id", kyc_id)
      .select()
      .single();

    if (error) {
      console.error("❌ KYC review error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      message: `KYC ${decision}`,
      kyc: data,
    });
  } catch (error) {
    console.error("❌ reviewKYC failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { submitKYC, getKYCStatus, reviewKYC };
