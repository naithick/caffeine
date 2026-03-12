/**
 * eventListener.js — On-chain event listener for CreditSold events.
 *
 * Polls the MarketplaceEscrow contract for CreditSold events using
 * eth_getLogs via queryFilter. Syncs Supabase carbon_credits status
 * to 'transferred' when a sale is detected.
 *
 * The BUFFER_OVERRUN fix: the Solidity event does NOT use `indexed`
 * on tokenId, so the ABI here must match exactly.
 */

const { ethers } = require("ethers");
const supabase = require("../config/supabaseClient");

// ABI must match the contract EXACTLY — no `indexed` on tokenId
const ESCROW_ABI = [
  "event CreditSold(uint256 tokenId, address buyer, uint256 price)",
];

async function handleCreditSold(tokenId, buyer, price) {
  const tid = tokenId.toString();
  console.log(
    `🔔 CreditSold — tokenId=${tid}, buyer=${buyer}, price=${ethers.formatEther(price)} ETH`
  );

  const { error } = await supabase
    .from("carbon_credits")
    .update({ status: "transferred" })
    .eq("token_id", tid);

  if (error) {
    console.error(`❌ Supabase update failed for token ${tid}:`, error.message);
  } else {
    console.log(`✅ carbon_credits token_id=${tid} → status='transferred'`);
  }
}

async function startEventListener() {
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;

  if (!escrowAddress) {
    console.warn("⚠️  ESCROW_CONTRACT_ADDRESS not set — event listener skipped.");
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(escrowAddress, ESCROW_ABI, provider);

    let lastScannedBlock = 0;
    const POLL_MS = 2000;

    console.log(`📡 Event listener active on ${escrowAddress} (polling every ${POLL_MS / 1000}s)`);

    const poll = async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        if (currentBlock <= lastScannedBlock) return;

        const fromBlock = lastScannedBlock + 1;
        const logs = await provider.getLogs({
          address: escrowAddress,
          fromBlock,
          toBlock: currentBlock,
        });

        for (const log of logs) {
          try {
            const parsed = contract.interface.parseLog({
              topics: log.topics,
              data: log.data,
            });
            if (parsed && parsed.name === "CreditSold") {
              await handleCreditSold(
                parsed.args.tokenId,
                parsed.args.buyer,
                parsed.args.price
              );
            }
          } catch {
            // Not a CreditSold event — skip
          }
        }

        lastScannedBlock = currentBlock;
      } catch (err) {
        // Silently retry — Hardhat node may not be running
      }
    };

    // Catch-up on any events that happened before we started
    await poll();

    // Continuous forward polling
    setInterval(poll, POLL_MS);
  } catch (err) {
    console.warn("⚠️  Event listener could not start (blockchain node may be offline). Server will continue without it.");
  }
}

module.exports = { startEventListener };
