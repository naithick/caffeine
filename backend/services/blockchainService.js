/**
 * blockchainService.js
 *
 * Ethers.js v6 integration service for interacting with the
 * CarbonCreditNFT smart contract on the local Hardhat network.
 */

const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// ── Load ABI ────────────────────────────────────────────────
const contractArtifact = require("../config/CarbonCreditNFT.json");
const CONTRACT_ABI = contractArtifact.abi;

// ── Environment variables ───────────────────────────────────
const { CONTRACT_ADDRESS, RPC_URL, MINTER_PRIVATE_KEY } = process.env;

if (!CONTRACT_ADDRESS || !RPC_URL || !MINTER_PRIVATE_KEY) {
  throw new Error(
    "Missing required environment variables. " +
      "Ensure CONTRACT_ADDRESS, RPC_URL, and MINTER_PRIVATE_KEY are set in .env"
  );
}

// ── Initialize ethers.js v6 objects ─────────────────────────
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(MINTER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

/**
 * Mint a new Carbon Credit NFT.
 *
 * @param   {string} recipientWallet  — Ethereum address of the credit recipient.
 * @param   {string} proposalId       — Unique ID of the approved proposal.
 * @returns {Promise<{ txHash: string, tokenId: string }>}
 */
async function mintCarbonCredit(recipientWallet, proposalId) {
  // ── Build token metadata URI ────────────────────────────
  const tokenURI = JSON.stringify({
    name: `Carbon Credit — Proposal #${proposalId}`,
    description: "Verified carbon credit issued on approval.",
    proposalId,
    issuedAt: new Date().toISOString(),
  });

  try {
    // ── Verify RPC connectivity ───────────────────────────
    await provider.getBlockNumber();

    console.log(
      `⛏  Minting credit for proposal ${proposalId} → ${recipientWallet}`
    );

    // ── Send transaction ──────────────────────────────────
    const tx = await contract.mintCredit(recipientWallet, tokenURI);
    console.log(`📨 Transaction sent: ${tx.hash}`);

    // ── Wait for confirmation ─────────────────────────────
    const receipt = await tx.wait();

    // ── Extract Token ID from the Transfer event ──────────
    //    Transfer(address from, address to, uint256 tokenId)
    const transferEvent = receipt.logs.find((log) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === "Transfer";
      } catch {
        return false;
      }
    });

    let tokenId = null;
    if (transferEvent) {
      const parsed = contract.interface.parseLog(transferEvent);
      tokenId = parsed.args.tokenId.toString();
    }

    console.log(`✅ Minted! Token ID: ${tokenId}  |  Tx: ${receipt.hash}`);

    return {
      txHash: receipt.hash,
      tokenId,
    };
  } catch (error) {
    // ── Explicit RPC-down detection ───────────────────────
    if (
      error.code === "SERVER_ERROR" ||
      error.code === "NETWORK_ERROR" ||
      error.code === "ECONNREFUSED" ||
      error.message?.includes("ECONNREFUSED")
    ) {
      console.error(
        "❌ RPC connection failed. Is the Hardhat node running?\n" +
          `   Tried to connect to: ${RPC_URL}\n` +
          `   Start it with: npx hardhat node`
      );
    } else {
      console.error("❌ Minting failed:", error.message || error);
    }

    throw error;
  }
}

/**
 * Retire (burn) a Carbon Credit NFT on-chain.
 *
 * The contract requires msg.sender == ownerOf(tokenId), so this builds
 * a signer from the user's wallet and calls retireCredit directly.
 * On Hardhat localhost every account is unlocked, making impersonation
 * straightforward; in production the user would sign client-side.
 *
 * @param   {string} userWallet — Ethereum address of the token owner.
 * @param   {string} tokenId   — On-chain NFT token ID to retire.
 * @returns {Promise<{ txHash: string }>}
 */
async function retireOnChainCredit(userWallet, tokenId) {
  try {
    await provider.getBlockNumber();

    console.log(`🔥 Retiring token ${tokenId} for ${userWallet}`);

    // Impersonate the token owner on the Hardhat node so the require
    // ownerOf(tokenId) == msg.sender passes.
    await provider.send("hardhat_impersonateAccount", [userWallet]);

    const ownerSigner = await provider.getSigner(userWallet);
    const ownerContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      ownerSigner
    );

    const tx = await ownerContract.retireCredit(tokenId);
    console.log(`📨 Retire tx sent: ${tx.hash}`);

    const receipt = await tx.wait();

    await provider.send("hardhat_stopImpersonatingAccount", [userWallet]);

    console.log(`✅ Retired! Token ${tokenId}  |  Tx: ${receipt.hash}`);

    return { txHash: receipt.hash };
  } catch (error) {
    if (
      error.code === "SERVER_ERROR" ||
      error.code === "NETWORK_ERROR" ||
      error.code === "ECONNREFUSED" ||
      error.message?.includes("ECONNREFUSED")
    ) {
      console.error(
        "❌ RPC connection failed. Is the Hardhat node running?\n" +
          `   Tried to connect to: ${RPC_URL}\n` +
          `   Start it with: npx hardhat node`
      );
    } else {
      console.error("❌ Retirement failed:", error.message || error);
    }

    throw error;
  }
}

module.exports = { mintCarbonCredit, retireOnChainCredit, provider, contract };
