# 🚀 StableRent Deployment Guide

This guide covers deploying both the smart contracts and Railway backend for the StableRent application.

## 📋 Prerequisites

### 1. Railway CLI Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link your project (run from project root)
railway link
```

### 2. Environment Variables
Ensure your `.env` file contains:
```bash
# Sepolia Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_PRIVATE_KEY=your-deployer-wallet-private-key

# Optional: Etherscan verification
ETHERSCAN_API_KEY=your-etherscan-api-key
```

### 3. Railway Environment Variables
Set these in your Railway dashboard:
```bash
# Database (auto-set by Railway)
DATABASE_URL=postgresql://...

# Server Configuration
NODE_ENV=production
PORT=3001
API_URL=https://your-railway-app.up.railway.app

# Authentication
JWT_SECRET=your-32-char-secret
REFRESH_TOKEN_SECRET=your-32-char-secret

# CORS
FRONTEND_URL=https://your-frontend.vercel.app

# Envio Integration
ENVIO_WEBHOOK_SECRET=your-webhook-secret

# Blockchain Configuration (will be updated by deployment script)
CONTRACT_ADDRESS_SEPOLIA=0x...
DEFAULT_CHAIN_ID=11155111
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PROCESSOR_PRIVATE_KEY=your-automation-wallet-private-key

# Processor Fee Configuration (loaded from .env file)
PROCESSOR_FEE_ADDRESS=0x17A4bAf74aC19ab1254fc24D7DcED2ad7639451b
PROCESSOR_FEE_PERCENT=0.05
PROCESSOR_FEE_CURRENCY=PYUSD
PROCESSOR_FEE_ID=1

# Email (optional)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_api_key
FROM_EMAIL=noreply@stablerent.app
```

## 🚀 Deployment Options

### Option 1: Full Stack Deployment (Recommended)
Deploy smart contracts AND update Railway backend in one command:

```bash
npm run deploy:full
```

**What this does:**
1. ✅ Deploys StableRentSubscription contract to Sepolia
2. ✅ Updates Railway environment variables with new contract address
3. ✅ Triggers Railway redeployment
4. ✅ Updates local configuration files
5. ✅ Provides deployment summary

### Option 2: Smart Contract Only
Deploy only the smart contracts:

```bash
npm run deploy:sepolia
```

### Option 3: Railway Backend Only
Update Railway backend with existing contract address:

```bash
npm run deploy:railway
```

## 📊 Deployment Process

### Step 1: Smart Contract Deployment
The script will:
- Check your wallet balance
- Verify you're connected to Sepolia
- Deploy the StableRentSubscription contract
- Save deployment info to `deployments/sepolia.json`
- Verify the deployment

### Step 2: Railway Backend Update
The script will:
- Read the new contract address from deployment info
- Update Railway environment variables
- Trigger Railway redeployment
- Monitor deployment status

### Step 3: Configuration Update
The script will:
- Update `backend/env.example` with new contract address
- Update `frontend/.env.example` with new addresses
- Provide configuration commands for manual setup

## 🔍 Verification

### Smart Contract Verification
After deployment, verify your contract on Etherscan:

```bash
# Get verification command from deployment output
npx hardhat verify --network sepolia CONTRACT_ADDRESS "OWNER_ADDRESS" "PYUSD_ADDRESS"
```

### Backend Verification
Check Railway deployment:
1. Visit [Railway Dashboard](https://railway.app/dashboard)
2. Check deployment logs
3. Verify environment variables are updated
4. Test API endpoints

## 🐛 Troubleshooting

### Common Issues

#### Railway CLI Not Found
```bash
npm install -g @railway/cli
railway login
railway link
```

#### Low Sepolia ETH Balance
Get testnet ETH from:
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

#### Railway Deployment Fails
Manually trigger from Railway dashboard:
1. Go to your Railway project
2. Click "Deploy" or run `railway up`
3. Monitor logs for errors

#### Environment Variables Not Updated
Manually set in Railway dashboard:
```bash
CONTRACT_ADDRESS_SEPOLIA=0x...
DEFAULT_CHAIN_ID=11155111
```

### Deployment Logs
Check deployment logs:
```bash
# Railway logs
railway logs --follow

# Local deployment logs
tail -f logs/deployment.log
```

## 📝 Manual Configuration

If automated deployment fails, manually update:

### Backend Environment
```bash
# Update backend/.env
CONTRACT_ADDRESS_SEPOLIA=0x...
DEFAULT_CHAIN_ID=11155111
```

### Frontend Environment
```bash
# Update frontend/.env
VITE_CONTRACT_ADDRESS=0x...
VITE_PYUSD_ADDRESS=0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53
VITE_DEFAULT_CHAIN=sepolia
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

## 🎯 Next Steps After Deployment

1. ✅ **Verify Contract**: Check on Etherscan
2. ✅ **Test Backend**: Verify API endpoints work
3. ✅ **Test Frontend**: Ensure contract integration works
4. ✅ **Monitor**: Check Railway logs and metrics
5. ✅ **Test Full Flow**: Create test subscriptions and payments

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Etherscan Verification](https://docs.etherscan.io/tutorials/verifying-contracts-programmatically)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review deployment logs
3. Verify all prerequisites are met
4. Check Railway dashboard for backend issues
5. Verify smart contract deployment on Etherscan
