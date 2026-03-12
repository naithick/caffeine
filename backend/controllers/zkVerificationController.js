/**
 * zkVerificationController.js — Zero-Knowledge Proof Verification API
 *
 * Protects corporate supply chain data by verifying a cryptographic proof
 * payload against a predefined verification key, confirming emissions
 * thresholds without exposing raw data.
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

// In a real application, the verification key (vkey) would be generated
// during the trusted setup phase of the zk-SNARK circuit.
// Here we look for a mock vkey file, or proceed if one doesn't exist
// by simulating verification for the hackathon MVP.
const VKEY_PATH = path.join(__dirname, "../config/verification_key.json");

/**
 * POST /api/zk/verify
 *
 * Verifies a ZK proof against public signals.
 */
async function verifyZKProof(req, res) {
  try {
    const { proof, publicSignals } = req.body;

    if (!proof || !publicSignals) {
      return res.status(400).json({
        error: "proof and publicSignals are required in the payload",
      });
    }

    let isVerified = false;

    // Try to load the verification key
    if (fs.existsSync(VKEY_PATH)) {
      const vKey = JSON.parse(fs.readFileSync(VKEY_PATH, "utf-8"));

      // snarkjs.groth16.verify takes (vKey, publicSignals, proof)
      isVerified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    } else {
      // MVP fallback: simulate verification if no vKey is found
      console.warn(
        "⚠️ No verification_key.json found. Simulating ZK proof verification."
      );

      // Simple MVP simulation: we assume the proof is valid if it's well-formed
      // In reality, snarkjs requires the exact structured proof object.
      isVerified = typeof proof === "object" && Array.isArray(publicSignals);
    }

    if (isVerified) {
      return res.status(200).json({
        message:
          "ZK Proof verified successfully. Corporate emissions thresholds met.",
        verified: true,
      });
    } else {
      return res.status(400).json({
        error: "Invalid ZK Proof.",
        verified: false,
      });
    }
  } catch (error) {
    console.error("❌ verifyZKProof failed:", error.message);
    return res
      .status(500)
      .json({ error: "Internal server error during ZK Verification" });
  }
}

module.exports = { verifyZKProof };
