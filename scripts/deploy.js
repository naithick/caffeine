/**
 * deploy.js — Deploy CarbonCreditNFT and MarketplaceEscrow to the local Hardhat network.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network localhost
 */

const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // ── Deploy CarbonCreditNFT ────────────────────────────────
  const CarbonCreditNFT = await hre.ethers.getContractFactory("CarbonCreditNFT");
  const carbonCreditNFT = await CarbonCreditNFT.deploy(deployer.address);
  await carbonCreditNFT.waitForDeployment();

  const nftAddress = await carbonCreditNFT.getAddress();
  console.log("CarbonCreditNFT deployed to:", nftAddress);

  // ── Deploy MarketplaceEscrow ──────────────────────────────
  const MarketplaceEscrow = await hre.ethers.getContractFactory("MarketplaceEscrow");
  const escrow = await MarketplaceEscrow.deploy(nftAddress);
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("MarketplaceEscrow deployed to:", escrowAddress);

  // ── Inject deployed addresses into .env ───────────────────
  const envPath = path.resolve(__dirname, "..", ".env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  // Replace or append NFT_CONTRACT_ADDRESS
  if (/^NFT_CONTRACT_ADDRESS=.*/m.test(envContent)) {
    envContent = envContent.replace(
      /^NFT_CONTRACT_ADDRESS=.*/m,
      `NFT_CONTRACT_ADDRESS=${nftAddress}`
    );
  } else {
    envContent += `${envContent.length > 0 && !envContent.endsWith("\n") ? "\n" : ""}NFT_CONTRACT_ADDRESS=${nftAddress}\n`;
  }

  // Replace or append ESCROW_CONTRACT_ADDRESS
  if (/^ESCROW_CONTRACT_ADDRESS=.*/m.test(envContent)) {
    envContent = envContent.replace(
      /^ESCROW_CONTRACT_ADDRESS=.*/m,
      `ESCROW_CONTRACT_ADDRESS=${escrowAddress}`
    );
  } else {
    envContent += `ESCROW_CONTRACT_ADDRESS=${escrowAddress}\n`;
  }

  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("Updated .env with deployed contract addresses");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
