#!/usr/bin/env bash
# get_credits.sh — Extracts exact JSON of minted credits and owners from the local Hardhat blockchain
# Run this while `start.sh` is already running!

echo "Querying CarbonCreditNFT smart contract..."
npx hardhat run scripts/get_blockchain_data.js --network localhost --no-compile
