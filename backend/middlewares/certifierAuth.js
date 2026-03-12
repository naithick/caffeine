const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const contractArtifact = require("../config/CarbonCreditNFT.json");
const CONTRACT_ABI = contractArtifact.abi;
const { CONTRACT_ADDRESS, RPC_URL } = process.env;

// Initialize a read-only Provider using a local RPC URL (or fall back to default Hardhat URL)
const provider = new ethers.JsonRpcProvider(RPC_URL || "http://127.0.0.1:8545");

// Create a read-only Contract instance of CarbonCreditNFT
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

/**
 * Express middleware to verify if a user's wallet is an accredited certifier on-chain.
 */
async function verifyCertifierOnChain(req, res, next) {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: "Missing walletAddress in request body" });
        }

        // Call the approvedCertifiers mapping on the smart contract
        const isCertifier = await contract.approvedCertifiers(walletAddress);

        if (!isCertifier) {
            return res.status(403).json({ error: "Unauthorized: Wallet is not an accredited certifier on-chain" });
        }

        next();
    } catch (error) {
        console.error("Error in verifyCertifierOnChain middleware:", error);
        res.status(500).json({ error: "Internal server error during on-chain verification" });
    }
}

module.exports = { verifyCertifierOnChain };
