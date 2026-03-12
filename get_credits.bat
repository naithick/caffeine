@echo off
echo Querying CarbonCreditNFT smart contract...
call npx hardhat run scripts\get_blockchain_data.js --network localhost --no-compile
pause
