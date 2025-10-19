# 🔐 Environment Variables Setup Guide

Quick reference for all environment variables needed across the StableRent project.

## 📍 Root Directory (.env)

For Hardhat contract deployment:

```env
# ============================================================================
# ETHEREUM RPC ENDPOINTS
# ============================================================================
# Get free API keys from https://www.alchemy.com/

# Mainnet (for local testing with forking)
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Sepolia (for testnet deployment - REQUIRED FOR HACKATHON)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# ============================================================================
# DEPLOYMENT WALLET
# ============================================================================
# Private key of wallet used for deployment
# ⚠️ USE A TEST WALLET ONLY - NEVER YOUR MAIN WALLET!

SEPOLIA_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000

# ============================================================================
# CONTRACT VERIFICATION (Optional but recommended)
# ============================================================================
# Get from https://etherscan.io/myapikey

ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

**How to get private key from MetaMask:**
1. Create a NEW test wallet (don't use your main wallet!)
2. Click account icon → Account Details → Show Private Key
3. Enter your password
4. Copy private key (starts with 0x)

---

## 📍 Frontend Directory (frontend/.env)

For React/Vite frontend application:

```env
# ============================================================================
# DEPLOYED CONTRACT ADDRESSES
# ============================================================================
# Get these after running: npm run deploy:sepolia

VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
VITE_PYUSD_ADDRESS=0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53

# ============================================================================
# NETWORK CONFIGURATION
# ============================================================================
# Options: "sepolia" | "mainnet" | "localhost"

VITE_DEFAULT_CHAIN=sepolia

# ============================================================================
# RPC ENDPOINTS
# ============================================================================
# Get free API keys from https://www.alchemy.com/

VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
VITE_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
VITE_LOCALHOST_RPC_URL=http://localhost:8545

# ============================================================================
# WALLETCONNECT (Optional - for better wallet support)
# ============================================================================
# Get free project ID from https://cloud.walletconnect.com/

VITE_WALLET_CONNECT_PROJECT_ID=

# ============================================================================
# ENVIO INDEXER (After deploying Envio)
# ============================================================================
# GraphQL endpoint for querying blockchain events

VITE_ENVIO_ENDPOINT=https://indexer.envio.dev/YOUR_INDEXER_ID/v1/graphql

# ============================================================================
# BACKEND API (If using backend)
# ============================================================================

VITE_API_URL=https://your-backend.vercel.app
```

---

## 📍 Backend Directory (backend/.env)

For Express.js backend API (optional for MVP):

```env
# ============================================================================
# DATABASE
# ============================================================================
# PostgreSQL connection string
# Get from: Vercel Postgres, Supabase, Railway, or Neon

DATABASE_URL=postgresql://user:password@host:5432/database?schema=public

# ============================================================================
# SERVER CONFIGURATION
# ============================================================================

PORT=3001
NODE_ENV=production
API_URL=https://your-backend.vercel.app

# ============================================================================
# FRONTEND URL (for CORS)
# ============================================================================

FRONTEND_URL=https://your-frontend.vercel.app

# ============================================================================
# JWT AUTHENTICATION
# ============================================================================
# Generate secure random strings (32+ characters)
# Use: openssl rand -base64 32

JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_also_32_chars
REFRESH_TOKEN_EXPIRES_IN=30d

# ============================================================================
# EMAIL SERVICE (Optional - for notifications)
# ============================================================================
# Options: Gmail, Resend.com, SendGrid, etc.

SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=StableRent

# ============================================================================
# BLOCKCHAIN
# ============================================================================

CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
DEFAULT_CHAIN_ID=11155111

# ============================================================================
# ENVIO WEBHOOK
# ============================================================================
# Generate a secure random string for webhook verification

ENVIO_WEBHOOK_SECRET=generate_a_secure_random_string_here

# ============================================================================
# RATE LIMITING (Optional)
# ============================================================================

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🎯 Minimum Required for Hackathon Demo

If you want to deploy quickly with minimal backend complexity:

### Absolutely Required:
1. **Root `.env`**:
   - `SEPOLIA_RPC_URL`
   - `SEPOLIA_PRIVATE_KEY`

2. **Frontend `.env`**:
   - `VITE_CONTRACT_ADDRESS` (after deployment)
   - `VITE_PYUSD_ADDRESS`
   - `VITE_DEFAULT_CHAIN=sepolia`
   - `VITE_SEPOLIA_RPC_URL`

### Optional for MVP:
- Backend (frontend can interact directly with contracts)
- Envio (can display events from Etherscan instead)
- Gelato automation (can trigger payments manually)
- WalletConnect (MetaMask injection works fine)

---

## 🔧 Quick Commands to Generate Secrets

### Generate JWT Secrets (32 bytes base64):
```bash
openssl rand -base64 32
```

### Generate Random Hex (for webhook secrets):
```bash
openssl rand -hex 32
```

### Generate UUID (for general secrets):
```bash
uuidgen
```

---

## 📦 Deployment Platform Environment Variables

### Vercel (Frontend)
1. Go to: Project → Settings → Environment Variables
2. Add all `VITE_*` variables from `frontend/.env`
3. Set Environment: Production
4. Redeploy

### Vercel (Backend)
1. Go to: Project → Settings → Environment Variables
2. Add all variables from `backend/.env`
3. For `DATABASE_URL`, use Vercel Postgres or external DB
4. Set Environment: Production

### Netlify (Frontend)
1. Go to: Site settings → Build & deploy → Environment
2. Add all `VITE_*` variables
3. Click "Clear cache and deploy site"

---

## 🔍 How to Find Values After Deployment

### Contract Address
After running `npm run deploy:sepolia`, look for:
```
✅ StableRentSubscription deployed to: 0xABCD...1234
```

Or check `deployments/sepolia.json`

### Block Number
From Etherscan transaction:
```
https://sepolia.etherscan.io/tx/YOUR_DEPLOYMENT_TX_HASH
```
Look for "Block: XXXXXXX"

### RPC URL Format
Alchemy: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
Infura: `https://sepolia.infura.io/v3/YOUR_API_KEY`

---

## ✅ Environment Setup Checklist

- [ ] Root `.env` created with Sepolia RPC and private key
- [ ] Got Sepolia ETH from faucet (0.05+ ETH)
- [ ] Compiled contracts successfully
- [ ] Deployed contracts to Sepolia
- [ ] Saved contract address
- [ ] Created `frontend/.env` with contract address
- [ ] (Optional) Created `backend/.env` with database URL
- [ ] (Optional) Set up Vercel/Netlify environment variables
- [ ] Tested that all services can communicate

---

## 🐛 Common Issues

### "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### ".env file not being read"
- Check file is named exactly `.env` (not `.env.txt`)
- Check it's in the correct directory
- Try restarting your terminal/IDE

### "Invalid private key"
- Must start with `0x`
- Must be 64 hex characters (66 including 0x)
- No spaces or newlines

### "Network not supported"
- Check chain ID matches (Sepolia = 11155111)
- Check RPC URL is correct
- Try using Alchemy instead of Infura or vice versa

---

## 📚 Quick Links

- **Alchemy**: https://www.alchemy.com/
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Etherscan**: https://sepolia.etherscan.io/
- **WalletConnect Cloud**: https://cloud.walletconnect.com/
- **Vercel**: https://vercel.com/
- **Resend (Email)**: https://resend.com/

---

**Note**: Never commit `.env` files to git! They should always be in `.gitignore`.

