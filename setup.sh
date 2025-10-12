#!/bin/bash

# ============================================================================
# SubChain Setup Script
# ============================================================================
# This script sets up the complete development environment including:
# - Node.js dependencies (root + backend)
# - Environment configuration files
# - Smart contract compilation
# - TypeChain type generation
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "============================================================================"
echo "🚀 SubChain Development Environment Setup"
echo "============================================================================"
echo ""

# ============================================================================
# 1. Check Prerequisites
# ============================================================================
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18+ first.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm ${NPM_VERSION}${NC}"

echo ""

# ============================================================================
# 2. Install Root Dependencies
# ============================================================================
echo -e "${BLUE}📦 Installing root project dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Root dependencies installed${NC}"
echo ""

# ============================================================================
# 3. Install Backend Dependencies
# ============================================================================
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
if [ -d "backend" ]; then
    cd backend
    npm install
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Backend directory not found - skipping${NC}"
fi
echo ""

# ============================================================================
# 4. Setup Environment Files
# ============================================================================
echo -e "${BLUE}⚙️  Setting up environment files...${NC}"

# Root .env (if needed for Hardhat)
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating root .env file...${NC}"
    cat > .env << 'EOF'
# SubChain Root Configuration
# Used by Hardhat for deployment

# Alchemy/Infura API Key for mainnet/testnet access
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PYUSD_ADDRESS=0x6c3ea9036406852006290770BEdFcAbA0e23A0e8

# Private key for deployment (DO NOT COMMIT THIS)
PRIVATE_KEY=your_private_key_here

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
EOF
    echo -e "${GREEN}✅ Created .env - Please update with your keys${NC}"
else
    echo -e "${GREEN}✅ .env already exists${NC}"
fi

# Backend .env
if [ -f "backend/.env.example" ] && [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend/.env file...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Created backend/.env - Please update with your keys${NC}"
elif [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

echo ""

# ============================================================================
# 5. Compile Smart Contracts
# ============================================================================
echo -e "${BLUE}🔨 Compiling smart contracts...${NC}"
npm run compile
echo -e "${GREEN}✅ Contracts compiled${NC}"
echo ""

# ============================================================================
# 6. Generate TypeChain Types
# ============================================================================
echo -e "${BLUE}📝 Generating TypeChain types...${NC}"
# TypeChain is generated automatically during compile
if [ -d "typechain-types" ]; then
    echo -e "${GREEN}✅ TypeChain types generated in typechain-types/${NC}"
else
    echo -e "${YELLOW}⚠️  typechain-types directory not found${NC}"
fi
echo ""

# ============================================================================
# 7. Optional: Install Envio CLI
# ============================================================================
echo -e "${BLUE}🔧 Checking for Envio CLI...${NC}"
if ! command -v envio &> /dev/null; then
    echo -e "${YELLOW}⚠️  Envio CLI not installed${NC}"
    echo -e "${YELLOW}   To install: npm install -g envio${NC}"
    echo -e "${YELLOW}   (Optional but recommended for deploying indexer)${NC}"
else
    ENVIO_VERSION=$(envio --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ Envio CLI installed: ${ENVIO_VERSION}${NC}"
fi
echo ""

# ============================================================================
# 8. Optional: Install ngrok for webhook testing
# ============================================================================
echo -e "${BLUE}🔧 Checking for ngrok...${NC}"
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}⚠️  ngrok not installed${NC}"
    echo -e "${YELLOW}   To install: brew install ngrok (macOS)${NC}"
    echo -e "${YELLOW}   (Optional but useful for local webhook testing)${NC}"
else
    echo -e "${GREEN}✅ ngrok installed${NC}"
fi
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "============================================================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "============================================================================"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. Update configuration files:"
echo "   - Edit .env with your Alchemy API key and private key"
echo "   - Edit backend/.env with your Coinbase and Envio credentials"
echo ""
echo "2. Run tests:"
echo "   npm test"
echo ""
echo "3. Deploy contracts (local):"
echo "   npx hardhat node           # Terminal 1"
echo "   npx hardhat run scripts/deploy.ts --network localhost"
echo ""
echo "4. Start services:"
echo "   ./launch.sh               # Starts all services"
echo ""
echo "5. Deploy Envio indexer:"
echo "   envio init"
echo "   envio deploy"
echo ""
echo "============================================================================"
echo -e "${YELLOW}⚠️  Remember to update .env files with your actual credentials!${NC}"
echo "============================================================================"
echo ""
