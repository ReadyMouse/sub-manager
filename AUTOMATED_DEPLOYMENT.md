# StableRent - Quick Start Guide

🚀 **Get StableRent running in minutes with our automated deployment system!**

This guide will help you clone the repository, configure your environment, and deploy the entire StableRent platform with minimal manual intervention.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Automated)](#quick-start-automated)
3. [Manual Setup](#manual-setup)
4. [Configuration Guide](#configuration-guide)
5. [Deployment Options](#deployment-options)
6. [Troubleshooting](#troubleshooting)
7. [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **npm** >= 9.x (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Optional (but recommended)

- **PostgreSQL** >= 14.x ([Download](https://www.postgresql.org/)) - or use a cloud database
- **jq** - JSON processor for enhanced script functionality
  - macOS: `brew install jq`
  - Linux: `apt-get install jq`

### Required Accounts/Services

1. **Alchemy or Infura** - For blockchain RPC access
   - [Alchemy](https://www.alchemy.com/) (recommended - 300M compute units/month free)
   - [Infura](https://www.infura.io/) (100k requests/day free)

2. **Database** (choose one):
   - Local PostgreSQL installation
   - [Railway](https://railway.app/) (free tier available)
   - [Render](https://render.com/) (free tier available)
   - [Supabase](https://supabase.com/) (free tier available)

3. **Ethereum Wallet** with Sepolia testnet ETH
   - Get testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

4. **Etherscan API Key** (optional, for contract verification)
   - [Get API Key](https://etherscan.io/apis)

---

## Quick Start (Automated)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/sub-manager.git
cd sub-manager
```

### Step 2: Run the Deployment Script

The deployment script will guide you through the entire setup process:

```bash
chmod +x deploy.sh
./deploy.sh
```

This automated script will:

1. ✅ Check prerequisites (Node.js, npm, etc.)
2. ✅ Install all dependencies (root, backend, frontend)
3. ✅ Guide you through environment configuration
4. ✅ Set up the database (Prisma migrations)
5. ✅ Compile and deploy smart contracts
6. ✅ Start the backend server
7. ✅ Start the frontend development server
8. ✅ Run health checks

### Step 3: Access the Application

Once deployment is complete, you can access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Hardhat Node**: http://localhost:8545

### Step 4: Stop Services

When you're done, stop all services:

```bash
./scripts/stop-services.sh
```

---

## Manual Setup

If you prefer to set up each component manually:

### 1. Install Dependencies

```bash
# Install root dependencies (Hardhat, smart contracts)
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables

#### Configure Root Environment

Create `.env` in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add:

```env
# Blockchain RPC URLs
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Deployment Private Keys (KEEP THESE SECRET!)
SEPOLIA_PRIVATE_KEY=your_private_key_here

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### Configure Backend Environment

```bash
cd backend
cp env.example .env
```

Edit `backend/.env`:

```env
# Database (example: PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/stablerent?schema=public

# Server
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# JWT Authentication (use strong secrets!)
JWT_SECRET=your-very-long-random-secret-key-here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=another-very-long-random-secret-key
REFRESH_TOKEN_EXPIRES_IN=30d

# Email Service (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Contract Address (will be filled after deployment)
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

#### Configure Frontend Environment

```bash
cd ../frontend
```

Create `frontend/.env.local`:

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# Contract Configuration (will be updated after deployment)
VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Chain Configuration (31337 = localhost, 11155111 = Sepolia)
VITE_CHAIN_ID=31337

# Environment
VITE_ENVIRONMENT=development
```

### 3. Set Up Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
cd ..
```

### 4. Compile and Deploy Smart Contracts

```bash
# Compile contracts
npm run compile

# For local development
npm run deploy:localhost

# For Sepolia testnet
npm run deploy:sepolia
```

### 5. Start Services

Open three terminal windows:

**Terminal 1 - Hardhat Node (local only):**
```bash
npx hardhat node
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## Configuration Guide

### Interactive Configuration Wizard

Run the configuration wizard for guided setup:

```bash
./scripts/configure-env.sh
```

This wizard will:
- Guide you through RPC provider setup
- Help configure database connection
- Generate secure JWT secrets
- Set up email (optional)
- Configure frontend environment

### Generate Secure Secrets

For JWT secrets, use:

```bash
# Generate a secure random secret
openssl rand -base64 64
```

### Database Options

#### Local PostgreSQL

```bash
# Install PostgreSQL
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb stablerent

# Connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/stablerent?schema=public
```

#### Railway (Cloud)

1. Create account at [Railway](https://railway.app/)
2. Create new PostgreSQL instance
3. Copy connection string to `DATABASE_URL`

#### Supabase (Cloud)

1. Create account at [Supabase](https://supabase.com/)
2. Create new project
3. Go to Settings > Database
4. Copy connection string (Transaction Pooler)
5. Update `DATABASE_URL`

---

## Deployment Options

### Local Development

```bash
./deploy.sh --env=local
```

Features:
- Deploys to local Hardhat network
- Uses test accounts with pre-funded ETH
- Hot reloading for frontend/backend
- Ideal for development and testing

### Testnet Deployment (Sepolia)

```bash
./deploy.sh --env=testnet
```

Requirements:
- `SEPOLIA_PRIVATE_KEY` in `.env`
- Sepolia ETH in wallet
- `SEPOLIA_RPC_URL` configured

### Production Deployment

For production deployment, see [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)

---

## Troubleshooting

### Common Issues

#### "Node.js version too old"

**Solution**: Install Node.js >= 18.x from [nodejs.org](https://nodejs.org/)

```bash
# Check version
node --version

# Should be v18.x or higher
```

#### "DATABASE_URL not set"

**Solution**: Ensure `backend/.env` exists and has valid `DATABASE_URL`

```bash
cd backend
cp env.example .env
# Edit .env with your database connection
```

#### "Failed to compile smart contracts"

**Solution**: Ensure you have a valid RPC URL

```bash
# Check .env has MAINNET_RPC_URL set
cat .env | grep MAINNET_RPC_URL
```

#### "Port already in use"

**Solution**: Stop existing services or change ports

```bash
# Stop all services
./scripts/stop-services.sh

# Or kill specific port
lsof -ti:3001 | xargs kill
lsof -ti:5173 | xargs kill
```

#### "Insufficient funds for deployment"

**Solution**: Get testnet ETH from faucet

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

#### "Cannot connect to database"

**Solution**: Verify database is running and connection string is correct

```bash
# For local PostgreSQL
pg_isready

# Test connection string
psql "postgresql://user:password@localhost:5432/stablerent"
```

### Advanced Troubleshooting

#### View Logs

```bash
# Deployment log
tail -f logs/deployment_YYYYMMDD_HHMMSS.log

# Backend log
tail -f logs/backend.log

# Frontend log
tail -f logs/frontend.log

# Hardhat node log
tail -f logs/hardhat-node.log
```

#### Reset Everything

```bash
# Stop all services
./scripts/stop-services.sh

# Clean build artifacts
npm run clean
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Reinstall
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

#### Database Issues

```bash
# Reset database
cd backend
npx prisma migrate reset
npx prisma generate
npx prisma migrate dev
cd ..
```

---

## Next Steps

After successful deployment:

### 1. Configure MetaMask

**For Local Development:**
- Network Name: Localhost
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency Symbol: ETH

**For Sepolia Testnet:**
- Network Name: Sepolia
- RPC URL: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
- Chain ID: 11155111
- Currency Symbol: ETH

### 2. Import Test Accounts

Hardhat provides test accounts with pre-funded ETH. Import the first account:

```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 3. Set Up Gelato Automation (Optional)

For automated subscription processing:

```bash
# Deploy Gelato automation contracts
npm run deploy:gelato:sepolia

# Configure Gelato task
npm run gelato:config:sepolia
```

See [GELATO_AUTOMATION_SUMMARY.md](./GELATO_AUTOMATION_SUMMARY.md) for details.

### 4. Explore the Platform

1. **Register an Account**
   - Navigate to http://localhost:5173
   - Click "Register" and create account

2. **Connect Wallet**
   - Click "Connect Wallet"
   - Approve MetaMask connection

3. **Create Subscription**
   - Browse services
   - Click "Subscribe"
   - Approve token allowance
   - Confirm subscription creation

4. **Manage Subscriptions**
   - View active subscriptions
   - Cancel subscriptions
   - Track payment history

### 5. Test Payment Processing

```bash
# Run test suite
npm test

# Run specific test
npm run test:real
```

---

## Additional Resources

### Documentation

- 📚 [README.md](./README.md) - Project overview
- 📚 [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) - Deployment guide
- 📚 [GELATO_AUTOMATION_SUMMARY.md](./GELATO_AUTOMATION_SUMMARY.md) - Automation setup
- 📚 [backend/README.md](./backend/README.md) - Backend API documentation
- 📚 [SEPOLIA_DEPLOYMENT_GUIDE.md](./SEPOLIA_DEPLOYMENT_GUIDE.md) - Testnet deployment

### Scripts Reference

```bash
# Deployment
./deploy.sh                    # Full deployment (local)
./deploy.sh --env=testnet      # Deploy to testnet
./deploy.sh --skip-deps        # Skip dependency installation
./deploy.sh --skip-contracts   # Skip contract deployment

# Configuration
./scripts/configure-env.sh     # Interactive environment setup

# Service Management
./scripts/stop-services.sh     # Stop all services

# Smart Contracts
npm run compile                # Compile contracts
npm run deploy:localhost       # Deploy to localhost
npm run deploy:sepolia         # Deploy to Sepolia
npm test                       # Run tests

# Backend
cd backend
npm run dev                    # Start development server
npm run build                  # Build for production
npm run prisma:studio          # Open Prisma Studio
npm run prisma:migrate         # Run migrations

# Frontend
cd frontend
npm run dev                    # Start development server
npm run build                  # Build for production
```

---

## Support

### Community

- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas

### Getting Help

1. Check [Troubleshooting](#troubleshooting) section
2. Review logs in `logs/` directory
3. Search existing GitHub issues
4. Create new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version)
   - Relevant logs

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit `.env` files** - They contain sensitive data
2. **Never share private keys** - Keep them secure
3. **Use app passwords** for email services (not your main password)
4. **Enable 2FA** on all service accounts
5. **Use environment variables** for all secrets
6. **Regularly rotate** JWT secrets in production
7. **Use strong, unique passwords** for database

---

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

**Happy Building! 🚀**

If you encounter any issues, please check the troubleshooting section or create an issue on GitHub.

