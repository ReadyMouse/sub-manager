#!/bin/bash

# ============================================================================
# StableRent Deployment Script
# ============================================================================
# This script deploys StableRent to production:
# - Smart contracts to Sepolia testnet
# - Backend API to Railway
# - Updates environment configurations
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "============================================================================"
echo "🚀 StableRent Production Deployment"
echo "============================================================================"
echo ""
echo "This script will deploy:"
echo "  1. Smart contracts to Sepolia testnet"
echo "  2. Backend API to Railway"
echo "  3. Update environment configurations"
echo ""
echo "============================================================================"
echo ""

# ============================================================================
# 1. Check Prerequisites
# ============================================================================
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file with:${NC}"
    echo "  SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
    echo "  SEPOLIA_PRIVATE_KEY=your_deployer_wallet_private_key"
    echo "  ETHERSCAN_API_KEY=your_etherscan_api_key (optional)"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found!${NC}"
    echo -e "${YELLOW}Please install Railway CLI:${NC}"
    echo "  npm install -g @railway/cli"
    echo "  railway login"
    echo "  railway link"
    exit 1
fi

# Check if Railway project is linked
if ! railway status &> /dev/null; then
    echo -e "${RED}❌ Railway project not linked!${NC}"
    echo -e "${YELLOW}Please link your Railway project:${NC}"
    echo "  railway link"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# ============================================================================
# 2. Deployment Options
# ============================================================================
echo -e "${CYAN}What would you like to deploy?${NC}"
echo ""
echo "  1) Full deployment (Smart contracts + Railway backend)"
echo "  2) Smart contracts only (Sepolia testnet)"
echo "  3) Railway backend only (update with existing contract)"
echo "  4) Verify existing contract on Etherscan"
echo ""
read -p "Enter choice [1-4]: " CHOICE
echo ""

case $CHOICE in
    1)
        DEPLOY_CONTRACTS=true
        DEPLOY_RAILWAY=true
        VERIFY_CONTRACT=true
        ;;
    2)
        DEPLOY_CONTRACTS=true
        DEPLOY_RAILWAY=false
        VERIFY_CONTRACT=true
        ;;
    3)
        DEPLOY_CONTRACTS=false
        DEPLOY_RAILWAY=true
        VERIFY_CONTRACT=false
        ;;
    4)
        DEPLOY_CONTRACTS=false
        DEPLOY_RAILWAY=false
        VERIFY_CONTRACT=true
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# ============================================================================
# 3. Smart Contract Deployment
# ============================================================================
if [ "$DEPLOY_CONTRACTS" = true ]; then
    echo "============================================================================"
    echo -e "${BLUE}📦 PHASE 1: Smart Contract Deployment${NC}"
    echo "============================================================================"
    echo ""
    
    # Check deployer balance
    echo -e "${YELLOW}Checking deployer balance...${NC}"
    npm run deploy:sepolia
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Smart contracts deployed successfully${NC}"
        
        # Extract contract address from deployment
        if [ -f "deployments/sepolia.json" ]; then
            CONTRACT_ADDRESS=$(grep -o '"StableRentSubscription": "[^"]*"' deployments/sepolia.json | cut -d'"' -f4)
            echo -e "${CYAN}📍 Contract Address: $CONTRACT_ADDRESS${NC}"
            echo -e "${CYAN}🔍 Explorer: https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS${NC}"
        fi
    else
        echo -e "${RED}❌ Smart contract deployment failed${NC}"
        exit 1
    fi
    echo ""
fi

# ============================================================================
# 4. Railway Backend Deployment
# ============================================================================
if [ "$DEPLOY_RAILWAY" = true ]; then
    echo "============================================================================"
    echo -e "${BLUE}🚂 PHASE 2: Railway Backend Deployment${NC}"
    echo "============================================================================"
    echo ""
    
    # Get contract address
    if [ -f "deployments/sepolia.json" ]; then
        CONTRACT_ADDRESS=$(grep -o '"StableRentSubscription": "[^"]*"' deployments/sepolia.json | cut -d'"' -f4)
        if [ -n "$CONTRACT_ADDRESS" ]; then
            echo -e "${YELLOW}Updating Railway environment variables...${NC}"
            echo -e "  CONTRACT_ADDRESS_SEPOLIA=$CONTRACT_ADDRESS"
            
            # Update Railway environment variables
            railway variables set CONTRACT_ADDRESS_SEPOLIA="$CONTRACT_ADDRESS"
            railway variables set DEFAULT_CHAIN_ID="11155111"
            railway variables set NODE_ENV="production"
            railway variables set LAST_DEPLOYMENT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
            
            echo -e "${GREEN}✅ Railway environment variables updated${NC}"
            
            # Deploy to Railway
            echo -e "${YELLOW}Deploying to Railway...${NC}"
            railway up
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Railway deployment successful${NC}"
                echo -e "${CYAN}📍 Monitor deployment: https://railway.app/dashboard${NC}"
            else
                echo -e "${RED}❌ Railway deployment failed${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Could not find contract address in deployment info${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ No deployment info found. Please deploy contracts first.${NC}"
        exit 1
    fi
    echo ""
fi

# ============================================================================
# 5. Contract Verification
# ============================================================================
if [ "$VERIFY_CONTRACT" = true ]; then
    echo "============================================================================"
    echo -e "${BLUE}🔍 PHASE 3: Contract Verification${NC}"
    echo "============================================================================"
    echo ""
    
    if [ -f "deployments/sepolia.json" ]; then
        CONTRACT_ADDRESS=$(grep -o '"StableRentSubscription": "[^"]*"' deployments/sepolia.json | cut -d'"' -f4)
        DEPLOYER_ADDRESS=$(grep -o '"deployer": "[^"]*"' deployments/sepolia.json | cut -d'"' -f4)
        PYUSD_ADDRESS=$(grep -o '"PYUSD": "[^"]*"' deployments/sepolia.json | cut -d'"' -f4)
        
        if [ -n "$CONTRACT_ADDRESS" ] && [ -n "$DEPLOYER_ADDRESS" ] && [ -n "$PYUSD_ADDRESS" ]; then
            echo -e "${YELLOW}Verifying contract on Etherscan...${NC}"
            echo -e "  Contract: $CONTRACT_ADDRESS"
            echo -e "  Owner: $DEPLOYER_ADDRESS"
            echo -e "  PYUSD: $PYUSD_ADDRESS"
            
            npx hardhat verify --network sepolia "$CONTRACT_ADDRESS" "$DEPLOYER_ADDRESS" "$PYUSD_ADDRESS"
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Contract verified on Etherscan${NC}"
                echo -e "${CYAN}📍 View verified contract: https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS${NC}"
            else
                echo -e "${YELLOW}⚠️  Contract verification failed (may already be verified)${NC}"
            fi
        else
            echo -e "${RED}❌ Missing deployment information for verification${NC}"
        fi
    else
        echo -e "${RED}❌ No deployment info found for verification${NC}"
    fi
    echo ""
fi

# ============================================================================
# 6. Update Local Configuration
# ============================================================================
echo "============================================================================"
echo -e "${BLUE}📝 PHASE 4: Local Configuration Update${NC}"
echo "============================================================================"
echo ""

if [ -f "deployments/sepolia.json" ]; then
    CONTRACT_ADDRESS=$(grep -o '"StableRentSubscription": "[^"]*"' deployments/sepolia.json | cut -d'"' -f4)
    PYUSD_ADDRESS=$(grep -o '"PYUSD": "[^"]*"' deployments/sepolia.json | cut -d'"' -f4)
    
    if [ -n "$CONTRACT_ADDRESS" ]; then
        echo -e "${YELLOW}Updating local configuration files...${NC}"
        
        # Update backend env.example
        if [ -f "backend/env.example" ]; then
            sed -i.bak "s/CONTRACT_ADDRESS_SEPOLIA=.*/CONTRACT_ADDRESS_SEPOLIA=$CONTRACT_ADDRESS/" backend/env.example
            echo -e "  ✅ Updated backend/env.example"
        fi
        
        # Update frontend env.example
        if [ -f "frontend/.env.example" ]; then
            sed -i.bak "s/VITE_CONTRACT_ADDRESS=.*/VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" frontend/.env.example
            if [ -n "$PYUSD_ADDRESS" ]; then
                sed -i.bak "s/VITE_PYUSD_ADDRESS=.*/VITE_PYUSD_ADDRESS=$PYUSD_ADDRESS/" frontend/.env.example
            fi
            echo -e "  ✅ Updated frontend/.env.example"
        fi
        
        echo -e "${GREEN}✅ Local configuration files updated${NC}"
    fi
fi
echo ""

# ============================================================================
# 7. Deployment Summary
# ============================================================================
echo "============================================================================"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "============================================================================"
echo ""

if [ -f "deployments/sepolia.json" ]; then
    CONTRACT_ADDRESS=$(grep -o '"StableRentSubscription": "[^"]*"' deployments/sepolia.json | cut -d'"' -f4)
    DEPLOYER_ADDRESS=$(grep -o '"deployer": "[^"]*"' deployments/sepolia.json | cut -d'"' -f4)
    TIMESTAMP=$(grep -o '"timestamp": "[^"]*"' deployments/sepolia.json | cut -d'"' -f4)
    
    echo -e "${MAGENTA}📦 Smart Contract:${NC}"
    echo -e "  Address: $CONTRACT_ADDRESS"
    echo -e "  Network: Sepolia Testnet"
    echo -e "  Deployer: $DEPLOYER_ADDRESS"
    echo -e "  Deployed: $TIMESTAMP"
    echo -e "  Explorer: https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS"
    echo ""
fi

if [ "$DEPLOY_RAILWAY" = true ]; then
    echo -e "${MAGENTA}🚂 Railway Backend:${NC}"
    echo -e "  Status: Deployed"
    echo -e "  Environment: Production"
    echo -e "  Dashboard: https://railway.app/dashboard"
    echo ""
fi

echo -e "${CYAN}📋 Next Steps:${NC}"
echo ""
echo "1. ✅ Verify deployment on Etherscan"
echo "2. ✅ Test Railway backend endpoints"
echo "3. ✅ Update frontend with new contract address"
echo "4. ✅ Test full application flow"
echo "5. ✅ Monitor Railway logs and metrics"
echo ""

echo -e "${CYAN}🔗 Useful Links:${NC}"
if [ -n "$CONTRACT_ADDRESS" ]; then
    echo -e "  Contract: https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS"
fi
echo -e "  Railway: https://railway.app/dashboard"
echo -e "  Deployment Info: deployments/sepolia.json"
echo ""

echo "============================================================================"
echo -e "${GREEN}✅ Deployment process completed successfully!${NC}"
echo "============================================================================"
echo ""
