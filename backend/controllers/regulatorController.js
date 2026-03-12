/**
 * regulatorController.js
 *
 * Controller for actions performed by platform regulators (admins),
 * such as accrediting certifiers on-chain.
 */

const { ethers } = require("ethers");
const supabase = require("../config/supabaseClient");
const contractArtifact = require("../config/CarbonCreditNFT.json");

/**
 * POST /api/regulator/accredit
 *
 * Accredits a specified wallet as a certifier on-chain and updates their role in the DB.
 */
async function accreditCertifier(req, res) {
    try {
        const { certifierWallet } = req.body;

        if (!certifierWallet) {
            return res.status(400).json({ error: "certifierWallet is required" });
        }

        // 1. Initialize an ethers.js Provider and Wallet using the Admin/Regulator private key
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

        // Fallback to MINTER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY if REGULATOR_PRIVATE_KEY is not defined
        const adminPrivateKey =
            process.env.REGULATOR_PRIVATE_KEY ||
            process.env.DEPLOYER_PRIVATE_KEY ||
            process.env.MINTER_PRIVATE_KEY;

        if (!adminPrivateKey) {
            return res.status(500).json({ error: "Admin private key is not configured in .env" });
        }

        const wallet = new ethers.Wallet(adminPrivateKey, provider);

        // 2. Connect to the CarbonCreditNFT contract
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractArtifact.abi, wallet);

        // 3. Execute the addCertifier function on the smart contract
        console.log(`Sending on-chain transaction to accredit certifier: ${certifierWallet}...`);
        const tx = await contract.addCertifier(certifierWallet);
        const receipt = await tx.wait();
        console.log(`Certifier ${certifierWallet} accredited on-chain in tx ${receipt.hash}`);

        // 4. Update the Supabase 'users' table
        const { error } = await supabase
            .from("users")
            .update({ role: "certifier" })
            .eq("wallet_address", certifierWallet);

        if (error) {
            console.error("❌ DB update failed while trying to accredit certifier:", error.message);
            return res.status(500).json({
                error: "Certifier was accredited on-chain but database update failed.",
                details: error.message
            });
        }

        // 5. Return a 200 OK JSON response
        return res.status(200).json({
            message: "Certifier successfully accredited",
            txHash: receipt.hash
        });

    } catch (error) {
        console.error("❌ Error in accreditCertifier:", error.message);
        return res.status(500).json({ error: "Internal server error during certifier accreditation" });
    }
}

module.exports = {
    accreditCertifier,
};
