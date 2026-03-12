const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const CarbonCreditNFT = await hre.ethers.getContractFactory("CarbonCreditNFT");
  const nft = CarbonCreditNFT.attach(contractAddress);

  const credits = [];
  let tokenId = 0;
  
  while (true) {
    try {
      const owner = await nft.ownerOf(tokenId);
      const uri = await nft.tokenURI(tokenId);
      credits.push({ tokenId: tokenId.toString(), owner, metadata_uri: uri });
      tokenId++;
    } catch (e) {
      // Exits loop when tokenId doesn't exist
      break;
    }
  }

  console.log(JSON.stringify({ minted_credits: credits }, null, 2));
}

main().catch((error) => {
  console.error("Error: Could not connect to blockchain. Make sure Hardhat is running (e.g., via ./start.sh)");
  process.exitCode = 1;
});
