# 🚀 Sepolia Testnet Deployment Guide

This guide walks you through deploying StableRent to Sepolia testnet for your hackathon demo.

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] Node.js 18+ installed
- [ ] Git repository set up
- [ ] Alchemy account (free) - https://www.alchemy.com/
- [ ] Sepolia ETH from faucet
- [ ] PYUSD testnet tokens from faucet
- [ ] MetaMask or similar wallet

## 🎯 Quick Start (TL;DR)

```bash
# 1. Set up environment variables (see below)
cp .env.example .env
# Edit .env with your values

# 2. Compile contracts
npm run compile

# 3. Deploy to Sepolia
npm run deploy:sepolia

# 4. Deploy frontend to Vercel
cd frontend && vercel deploy --prod

# 5. Test on Sepolia!
```

---

## Step 1: Get API Keys and Testnet Funds

### 1.1 Alchemy API Key (Free)

1. Go to https://www.alchemy.com/
2. Sign up for a free account
3. Click "Create App"
   - Chain: Ethereum
   - Network: Sepolia
4. Copy your API Key
5. Your RPC URL will be: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

### 1.2 Get Sepolia ETH (Free)

You need ~0.05 SepoliaETH for deployment. Get it from:

- **Alchemy Faucet**: https://www.alchemy.com/faucets/ethereum-sepolia (best, 0.5 ETH)
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Google Faucet**: https://cloud.google.com/application/web3/faucet/ethereum/sepolia

### 1.3 Get PYUSD Testnet Tokens

PYUSD on Sepolia: `0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53`

Use the faucet you found to get testnet PYUSD tokens!

---

## Step 2: Configure Environment

### 2.1 Create `.env` file in project root

```bash
# Copy the example
cp .env.example .env
```

### 2.2 Edit `.env` with your values

```env
# Your Alchemy Sepolia RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Your wallet private key (create a TEST wallet, never use your main wallet!)
SEPOLIA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Optional: For contract verification on Etherscan
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

⚠️ **SECURITY WARNING**: 
- Use a NEW test wallet for deployment, not your main wallet!
- Never commit your `.env` file to git (it's already in `.gitignore`)
- Never share your private key

---

## Step 3: Deploy Smart Contracts to Sepolia

### 3.1 Compile Contracts

```bash
npm run compile
```

This should output: "Compiled X Solidity files successfully"

### 3.2 Deploy to Sepolia

```bash
npm run deploy:sepolia
```

This will:
- ✅ Deploy `StableRentSubscription` contract
- ✅ Verify PYUSD token is accessible
- ✅ Save deployment info to `deployments/sepolia.json`
- ✅ Display configuration for frontend and backend

**Save the contract address** - you'll need it for frontend and backend!

### 3.3 Verify Contract on Etherscan (Optional but Recommended)

Verification makes your code readable on Etherscan, which is great for judges!

```bash
# Get Etherscan API key from https://etherscan.io/myapikey
# Add to .env: ETHERSCAN_API_KEY=your_key

# Run verification (replace with your contract address and deployer address)
npx hardhat verify --network sepolia CONTRACT_ADDRESS "DEPLOYER_ADDRESS" "0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53"
```

**View your contract on Etherscan**: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

---

## Step 4: Deploy Frontend

The frontend can be deployed to Vercel (easiest) or Netlify.

### 4.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 4.2 Configure Frontend Environment

Create `frontend/.env` with:

```env
VITE_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
VITE_PYUSD_ADDRESS=0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53
VITE_DEFAULT_CHAIN=sepolia
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### 4.3 Deploy to Vercel

```bash
cd frontend

# Login to Vercel (first time only)
vercel login

# Deploy
vercel deploy --prod
```

### 4.4 Add Environment Variables in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `frontend/.env`
5. Redeploy if needed

**Your frontend is now live!** 🎉

---

## Step 5: Deploy Backend (Optional but Recommended)

### 5.1 Set Up Database

**Option A: Vercel Postgres** (easiest if using Vercel)
1. Go to Vercel dashboard → Storage → Create Database → Postgres
2. Copy `DATABASE_URL`

**Option B: Supabase** (free tier available)
1. Go to https://supabase.com/
2. Create new project
3. Get database connection string

**Option C: Railway** (free tier available)
1. Go to https://railway.app/
2. Create PostgreSQL database
3. Copy connection string

### 5.2 Configure Backend Environment

Create `backend/.env` with:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Server
PORT=3001
NODE_ENV=production
API_URL=https://your-backend.vercel.app

# Frontend (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app

# JWT (generate secure random strings)
JWT_SECRET=generate_a_secure_random_string_here_32_chars_minimum
REFRESH_TOKEN_SECRET=another_secure_random_string_32_chars_minimum

# Email (optional - use Resend.com or Gmail)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=your_api_key
FROM_EMAIL=noreply@yourdomain.com

# Blockchain
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
DEFAULT_CHAIN_ID=11155111

# Envio Webhook Secret (generate random string)
ENVIO_WEBHOOK_SECRET=generate_a_secure_random_string
```

### 5.3 Deploy Backend to Vercel

```bash
cd backend

# Deploy
vercel deploy --prod
```

### 5.4 Run Database Migrations

```bash
# After deployment, run migrations
cd backend
npm run prisma:migrate
```

---

## Step 6: Deploy Envio Indexer

### 6.1 Sign Up for Envio

1. Go to https://envio.dev/
2. Sign up for account
3. Request production resources if needed (mention hackathon)

### 6.2 Update Envio Config

Edit `envio.config.yaml`:

```yaml
networks:
  - id: 11155111  # Sepolia
    name: ethereum-sepolia
    rpc_url: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
    start_block: YOUR_DEPLOYMENT_BLOCK_NUMBER
    
contracts:
  - name: StableRentSubscription
    address: YOUR_DEPLOYED_CONTRACT_ADDRESS
    network: ethereum-sepolia
```

### 6.3 Deploy to Envio

Follow Envio's deployment guide for hosted service. You'll get a GraphQL endpoint like:
`https://indexer.envio.dev/YOUR_INDEXER_ID/v1/graphql`

### 6.4 Update Frontend with Envio Endpoint

Add to `frontend/.env`:
```env
VITE_ENVIO_ENDPOINT=https://indexer.envio.dev/YOUR_INDEXER_ID/v1/graphql
```

Redeploy frontend with updated env vars.

---

## Step 7: (Optional) Deploy Gelato Automation

If you want automated payment processing:

### 7.1 Deploy Gelato Contracts

```bash
npm run deploy:gelato:sepolia
```

### 7.2 Fund Gelato 1Balance

1. Go to https://app.gelato.network/balance
2. Connect wallet
3. Deposit ~0.1 ETH to 1Balance on Sepolia

### 7.3 Create Gelato Task

```bash
npm run gelato:config:sepolia
```

Follow the output instructions to create a task via Gelato dashboard.

---

## Step 8: Test Everything!

### 8.1 Connect MetaMask to Sepolia

1. Open MetaMask
2. Network dropdown → Select "Sepolia"
3. If not available, add manually:
   - Network Name: Sepolia
   - RPC URL: Your Alchemy Sepolia URL
   - Chain ID: 11155111
   - Currency: ETH

### 8.2 Get Test Tokens

Make sure you have:
- ✅ Sepolia ETH (for gas)
- ✅ PYUSD testnet tokens (for subscriptions)

### 8.3 Test Full Flow

1. **Open your deployed frontend**
2. **Connect wallet** (make sure you're on Sepolia)
3. **Approve PYUSD**: Approve the contract to spend PYUSD
4. **Create subscription**: Set up a test subscription
5. **Process payment**: Trigger a payment
6. **View dashboard**: Check payment history and subscription status
7. **Cancel subscription**: Test cancellation flow

### 8.4 Test on Different Devices

- Desktop browser
- Mobile browser
- Different wallets (MetaMask, WalletConnect)

---

## Step 9: Create Demo Video

Record a 2-4 minute video showing:

1. **Introduction** (30s)
   - What problem you're solving
   - Why PYUSD is perfect for this

2. **Demo** (2-3 min)
   - Connect wallet
   - Show PYUSD balance
   - Create subscription
   - Approve PYUSD spending
   - Process payment
   - Show transaction on Etherscan
   - Show dashboard with history

3. **Technology** (30s)
   - Mention Hardhat 3.0
   - Mention Envio indexing
   - Mention PYUSD on Sepolia

**Tools for recording**:
- Loom (easiest): https://www.loom.com/
- OBS Studio (free): https://obsproject.com/
- QuickTime (Mac built-in)

---

## Step 10: Prepare Submission

### 10.1 Update README.md

Make sure your main README includes:
- ✅ Clear project description
- ✅ Live demo links (frontend, Etherscan)
- ✅ Technology stack (Hardhat, Envio, PYUSD)
- ✅ Setup instructions
- ✅ Link to demo video

### 10.2 Submission Checklist

For PayPal/PYUSD hackathon, you need:

- [ ] Public GitHub repository with source code
- [ ] Live demo deployed on Sepolia testnet
- [ ] Demo video (2-4 minutes) uploaded (YouTube, Loom, etc.)
- [ ] Contract verified on Sepolia Etherscan
- [ ] Working frontend that judges can interact with
- [ ] Clear README with setup and usage instructions
- [ ] Evidence of PYUSD usage in transactions
- [ ] (If applicable) Envio indexer deployed and working

### 10.3 Submission Links to Prepare

Gather these URLs for your submission:

```
Frontend URL: https://your-frontend.vercel.app
Backend URL: https://your-backend.vercel.app
Contract (Etherscan): https://sepolia.etherscan.io/address/YOUR_CONTRACT
GitHub Repo: https://github.com/yourusername/sub-manager
Demo Video: https://www.youtube.com/watch?v=YOUR_VIDEO_ID
Envio GraphQL: https://indexer.envio.dev/YOUR_INDEXER_ID/v1/graphql
```

---

## 🐛 Troubleshooting

### "Insufficient funds for gas"
- Get more Sepolia ETH from faucets listed above

### "Transaction reverted"
- Check you have PYUSD balance
- Check you've approved the contract to spend PYUSD
- Check contract address is correct in frontend

### "Network mismatch"
- Make sure MetaMask is on Sepolia (Chain ID: 11155111)
- Make sure frontend is configured for Sepolia

### "Cannot connect wallet"
- Try refreshing the page
- Try disconnecting and reconnecting
- Check browser console for errors

### Deployment fails with "Invalid API key"
- Double-check your Alchemy API key
- Make sure `.env` file is in the correct location
- Check there are no extra spaces in API key

---

## 📚 Additional Resources

### Testnet Explorers
- Sepolia Etherscan: https://sepolia.etherscan.io/
- Alchemy Composer: https://composer.alchemy.com/

### Getting Help
- Hardhat Docs: https://hardhat.org/docs
- Envio Docs: https://docs.envio.dev/
- Gelato Docs: https://docs.gelato.network/
- PYUSD Docs: https://paxos.com/pyusd/

### Free Services Used
- ✅ Alchemy: Free RPC endpoints
- ✅ Vercel: Free frontend hosting
- ✅ Railway/Render: Free backend hosting
- ✅ Sepolia: Free testnet
- ✅ Etherscan: Free explorer and verification

---

## ✅ Final Checklist

Before submitting:

- [ ] Contracts deployed to Sepolia
- [ ] Contracts verified on Etherscan
- [ ] Frontend deployed and working
- [ ] Backend deployed (optional)
- [ ] Envio indexer deployed
- [ ] Full user flow tested end-to-end
- [ ] Demo video recorded and uploaded
- [ ] README updated with all links
- [ ] Repository is public
- [ ] All sensitive data removed from code

---

**Good luck with your hackathon submission!** 🚀

If you run into issues, check the troubleshooting section or refer to the main README.

