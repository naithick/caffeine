/**
 * userController.js — User authentication via Web3 wallet address.
 */

const supabase = require("../config/supabaseClient");

/**
 * POST /api/users/auth
 *
 * Upsert user by wallet address.
 * - If user exists → return existing profile.
 * - If not → insert new user with given role and return profile.
 */
async function authUser(req, res) {
  try {
    const { wallet_address, role } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: "wallet_address is required" });
    }

    // ── Check if user already exists ────────────────────
    const { data: existing, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", wallet_address.toLowerCase())
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Supabase fetch error:", fetchError.message);
      return res.status(500).json({ error: fetchError.message });
    }

    if (existing) {
      return res.status(200).json({ user: existing, isNew: false });
    }

    // ── Create new user ─────────────────────────────────
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        wallet_address: wallet_address.toLowerCase(),
        role: role || "producer",
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Supabase insert error:", insertError.message);
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(201).json({ user: newUser, isNew: true });
  } catch (error) {
    console.error("❌ authUser failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { authUser };
