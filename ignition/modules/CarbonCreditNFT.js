const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CarbonCreditNFTModule", (m) => {
  // Default to the first Hardhat account if no initialOwner is provided.
  const initialOwner = m.getParameter(
    "initialOwner",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // Hardhat account #0
  );

  const carbonCreditNFT = m.contract("CarbonCreditNFT", [initialOwner]);

  return { carbonCreditNFT };
});
