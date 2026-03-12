/**
 * registryBridgeController.js — Cross-market tracking to prevent double-counting.
 */

/**
 * POST /api/bridge/verify
 *
 * Takes a project's deterministic metadata hash and simulates querying
 * external registries (e.g., Verra, Gold Standard) to ensure the credit
 * has not been issued elsewhere.
 */
async function verifyExternalRegistry(req, res) {
  try {
    const { metadata_hash } = req.body;

    if (!metadata_hash) {
      return res.status(400).json({
        error: "metadata_hash is required for registry verification",
      });
    }

    // Simulate external API calls to Verra, Gold Standard, etc.
    // We simulate a 409 Conflict if the hash starts with "0xdead"
    const isDoubleCounted = metadata_hash.toLowerCase().startsWith("0xdead");

    if (isDoubleCounted) {
      return res.status(409).json({
        error:
          "Conflict: Credit already exists in an external registry. Double-counting prevented.",
        registry: "Simulated External Registry",
      });
    }

    return res.status(200).json({
      message: "Verification passed. No external conflicts found.",
      verified: true,
    });
  } catch (error) {
    console.error("❌ verifyExternalRegistry failed:", error.message);
    return res
      .status(500)
      .json({ error: "Internal server error during registry bridge check" });
  }
}

module.exports = { verifyExternalRegistry };
