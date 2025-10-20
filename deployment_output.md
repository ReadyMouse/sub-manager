```bash
npm run deploy:sepolia
```
Output:
```
> playground@1.0.0 deploy:sepolia
> hardhat run scripts/deploy-sepolia.ts --network sepolia

🚀 Deploying StableRent to Sepolia Testnet...

📝 Deploying contracts with account: 0xbA2994967b75c22DBF9833fFD0A749BD66e7F0F3
💰 Account balance: 0.05 SepoliaETH

🌐 Network: sepolia
🔗 Chain ID: 11155111
✅ Confirmed: Connected to Sepolia testnet

📦 Deploying StableRentSubscription...
   Using PYUSD address: 0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53
⏳ Waiting for deployment transaction to be mined...
✅ StableRentSubscription deployed to: 0xd91844e669a6138dc41fe1aEb0091822CC12f4d1

🔍 Verifying deployment...
   ✓ PYUSD Token Address: 0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53
   ✓ Contract Owner: 0xbA2994967b75c22DBF9833fFD0A749BD66e7F0F3
   ✓ Your PYUSD Balance: 0.0 PYUSD

⚠️  You have no PYUSD! Get testnet PYUSD from the faucet
   (You found a faucet - use that to get PYUSD tokens)
✅ Verification complete!

💾 Deployment info saved to: /Users/mouse/src/sub-manager/deployments/sepolia.json

============================================================================
📋 FRONTEND CONFIGURATION
============================================================================

Add these to your frontend/.env file:

VITE_CONTRACT_ADDRESS=0xd91844e669a6138dc41fe1aEb0091822CC12f4d1
VITE_PYUSD_ADDRESS=0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53
VITE_DEFAULT_CHAIN=sepolia
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

Or run these commands:

echo "VITE_CONTRACT_ADDRESS=0xd91844e669a6138dc41fe1aEb0091822CC12f4d1" > frontend/.env
echo "VITE_PYUSD_ADDRESS=0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53" >> frontend/.env
echo "VITE_DEFAULT_CHAIN=sepolia" >> frontend/.env
echo "VITE_SEPOLIA_RPC_URL=YOUR_RPC_URL_HERE" >> frontend/.env

============================================================================

============================================================================
📋 BACKEND CONFIGURATION
============================================================================

Add these to your backend/.env file:

CONTRACT_ADDRESS=0xd91844e669a6138dc41fe1aEb0091822CC12f4d1
DEFAULT_CHAIN_ID=11155111

============================================================================

============================================================================
🔍 ETHERSCAN VERIFICATION
============================================================================

View your contract on Etherscan:
https://sepolia.etherscan.io/address/0xd91844e669a6138dc41fe1aEb0091822CC12f4d1

To verify source code on Etherscan (makes it readable for judges!):

1. Get free Etherscan API key from: https://etherscan.io/myapikey
2. Add to .env file: ETHERSCAN_API_KEY=your_api_key
3. Run this command:

npx hardhat verify --network sepolia 0xd91844e669a6138dc41fe1aEb0091822CC12f4d1 "0xbA2994967b75c22DBF9833fFD0A749BD66e7F0F3" "0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53"

============================================================================

============================================================================
🦊 METAMASK CONFIGURATION
============================================================================

MetaMask should auto-detect Sepolia network, but if not:

Network Name:    Sepolia
RPC URL:         https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
Chain ID:        11155111
Currency Symbol: ETH
Block Explorer:  https://sepolia.etherscan.io

Get Sepolia ETH from:
  - https://sepoliafaucet.com/
  - https://www.alchemy.com/faucets/ethereum-sepolia

Get PYUSD testnet tokens from your faucet!

============================================================================

✅ Deployment complete!

💡 NEXT STEPS:
  1. ✅ Contract deployed to Sepolia
  2. 📝 Update frontend/.env with contract addresses (see above)
  3. 📝 Update backend/.env with contract address (see above)
  4. 🔍 Verify contract on Etherscan (optional but recommended)
  5. 💰 Get PYUSD testnet tokens from faucet
  6. 🚀 Deploy frontend to Vercel/Netlify
  7. 🚀 Deploy backend to Vercel/Render/Railway
  8. 📊 Deploy Envio indexer to hosted service
  9. 🧪 Test full flow on Sepolia!

📄 Deployment details saved to: deployments/sepolia.json

```