# Local Development Guide

This guide explains how to test your frontend and backend with a local Hardhat blockchain.

## Quick Start

```bash
./launch.sh
# Choose option 1: Everything (Backend + Hardhat + Frontend)
```

That's it! The script will:
- ✅ Start Backend API on `http://localhost:3001`
- ✅ Start Hardhat blockchain on `http://localhost:8545`
- ✅ **Automatically deploy contracts**
- ✅ **Automatically update frontend config** with contract address
- ✅ Start Frontend on `http://localhost:5173`

## What's Happening

### 1. Local Blockchain (Hardhat)
- Forks Ethereum mainnet at the latest block
- Runs at `http://localhost:8545`
- Chain ID: `31337`
- Provides 20 test accounts with 10,000 ETH each
- Has access to real PYUSD contract (forked from mainnet)

### 2. Contract Deployment
- Automatically deploys `StableRentSubscription` contract
- Saves deployment address to `deployments/localhost.json`
- Updates `frontend/.env` with contract address

### 3. Frontend Configuration
- Frontend automatically configured to use localhost network
- Contract address automatically set
- Ready to connect with MetaMask

## Connect MetaMask

### Step 1: Add Hardhat Network to MetaMask

1. Open MetaMask
2. Click network dropdown → **Add Network** → **Add a network manually**
3. Enter these details:

```
Network Name:    Hardhat Local
RPC URL:         http://localhost:8545
Chain ID:        31337
Currency Symbol: ETH
```

### Step 2: Import Test Account

After starting Hardhat, check `logs/hardhat.log` for test accounts. Import Account #0:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**To import:**
1. Open MetaMask
2. Click account icon → **Import Account**
3. Paste the private key above
4. You now have 10,000 ETH for testing!

### Step 3: Connect to Frontend

1. Open `http://localhost:5173` in your browser
2. Make sure MetaMask is on **Hardhat Local** network
3. Click "Connect MetaMask"
4. Approve the connection

## Getting Test PYUSD

Your test account has ETH but no PYUSD. To get PYUSD:

### Option 1: Use Hardhat Console (Recommended)

```bash
npx hardhat console --network localhost
```

Then in the console:

```javascript
// Get contracts
const pyusd = await ethers.getContractAt("IERC20", "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8");
const [user] = await ethers.getSigners();

// Impersonate a PYUSD whale
const whaleAddress = "0x4D73AdB72bC3DD368966edD0f0b2148401A178E2";
await hre.network.provider.request({
  method: "hardhat_impersonateAccount",
  params: [whaleAddress],
});

const whale = await ethers.getSigner(whaleAddress);

// Transfer PYUSD to your account
await pyusd.connect(whale).transfer(user.address, ethers.parseUnits("10000", 6));

console.log("✅ Transferred 10,000 PYUSD to", user.address);
```

### Option 2: Write a Helper Script

See `test/helpers/setup.ts` for the `fundAccountWithPyusd()` function.

## Frontend Environment

The launch script automatically creates/updates `frontend/.env`:

```env
VITE_DEFAULT_CHAIN=localhost
VITE_CONTRACT_ADDRESS=<automatically set>
VITE_PYUSD_ADDRESS=0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
VITE_LOCALHOST_RPC_URL=http://localhost:8545
```

## Testing the Full Stack

### 1. Test Backend API

```bash
curl http://localhost:3001/health
```

### 2. Test Smart Contracts

```bash
npm test
```

### 3. Test Frontend → Contract Integration

1. Connect MetaMask to Hardhat Local
2. Get test PYUSD (see above)
3. Approve PYUSD spending in frontend
4. Create a subscription

## Logs

All services log to the `logs/` directory:

```bash
tail -f logs/backend.log      # Backend API
tail -f logs/hardhat.log      # Hardhat blockchain
tail -f logs/deployment.log   # Contract deployment
tail -f logs/frontend.log     # Frontend
```

## Useful Commands

### Redeploy Contracts

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### Explore PYUSD

```bash
npm run explore
```

### View Database

```bash
cd backend && npx prisma studio
```

### Check Contract Address

```bash
cat deployments/localhost.json
```

## Stopping Services

Press `Ctrl+C` in the terminal where `launch.sh` is running. This will stop all services gracefully.

## Troubleshooting

### MetaMask shows "Nonce too high" error

Reset MetaMask account:
1. MetaMask → Settings → Advanced
2. Scroll down to "Clear activity tab data"
3. Click "Clear"

### Contract not deployed

Check deployment log:
```bash
cat logs/deployment.log
```

### Frontend can't connect to contracts

1. Verify Hardhat is running: `curl http://localhost:8545`
2. Check contract address: `cat frontend/.env`
3. Verify MetaMask is on Chain ID 31337

### PYUSD balance not showing

1. Make sure you've imported PYUSD to your test account (see "Getting Test PYUSD")
2. Check you're on the correct network in MetaMask
3. Try refreshing the frontend

## Network Comparison

| Feature | Mainnet | Sepolia | Localhost (Hardhat) |
|---------|---------|---------|---------------------|
| **Cost** | Real $$ | Free | Free |
| **Speed** | 12s blocks | 12s blocks | Instant |
| **Data** | Real | Test | Forked mainnet |
| **Risk** | High | None | None |
| **Best For** | Production | Public testing | Development |

## Why Use Local Hardhat?

✅ **Instant transactions** - no waiting for blocks  
✅ **Free** - no gas fees  
✅ **Real data** - forked from mainnet  
✅ **Private** - only on your machine  
✅ **Fast iteration** - restart anytime  
✅ **Safe** - can't lose real money  

## Next Steps

Once you've tested locally:

1. Test on **Sepolia testnet** for public testing
2. Get community feedback
3. Audit smart contracts
4. Deploy to **mainnet** for production

---

**Happy coding!** 🚀

