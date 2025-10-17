#!/bin/bash

# ============================================================================
# StableRent Launch Script
# ============================================================================
# This script launches StableRent services:
# - Backend API (user management & database)
# - Local Hardhat blockchain (optional)
# - Frontend application
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

# Trap Ctrl+C and cleanup
trap cleanup INT TERM

cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down services...${NC}"
    
    # Kill all background jobs
    jobs -p | xargs -r kill 2>/dev/null || true
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# ============================================================================
# Display Banner
# ============================================================================
clear
echo ""
echo "============================================================================"
echo "🚀 StableRent Service Launcher"
echo "============================================================================"
echo ""
echo "This script will start the following services:"
echo "  1. Backend API (user management & database)"
echo "  2. Local Hardhat blockchain (optional)"
echo "  3. Frontend application"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================================================"
echo ""

# ============================================================================
# Configuration
# ============================================================================

# Ask user what to start
echo -e "${CYAN}What would you like to start?${NC}"
echo ""
echo "  1) Everything (Backend + Hardhat + Frontend)"
echo "  2) Backend + Frontend (development mode)"
echo "  3) Frontend only (connects to existing backend/network)"
echo "  4) Backend only (API server)"
echo "  5) Hardhat only (for testing)"
echo ""
read -p "Enter choice [1-5]: " CHOICE
echo ""

START_BACKEND=false
START_HARDHAT=false
START_FRONTEND=false

case $CHOICE in
    1)
        START_BACKEND=true
        START_HARDHAT=true
        START_FRONTEND=true
        ;;
    2)
        START_BACKEND=true
        START_FRONTEND=true
        ;;
    3)
        START_FRONTEND=true
        ;;
    4)
        START_BACKEND=true
        ;;
    5)
        START_HARDHAT=true
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# ============================================================================
# Start Services
# ============================================================================

echo "============================================================================"
echo -e "${GREEN}🚀 Starting Services...${NC}"
echo "============================================================================"
echo ""

# Create log directory
mkdir -p logs

# ============================================================================
# 1. Start Backend API
# ============================================================================
if [ "$START_BACKEND" = true ]; then
    echo -e "${BLUE}[1/3] Starting Backend API...${NC}"
    echo -e "${YELLOW}       Logs: logs/backend.log${NC}"
    
    # Check if PostgreSQL is running
    if ! pgrep -x "postgres" > /dev/null; then
        echo -e "${YELLOW}       PostgreSQL not running, starting it...${NC}"
        brew services start postgresql@14
        sleep 2
    fi
    
    cd backend
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo -n "       Waiting for backend to start"
    sleep 3
    for i in {1..15}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}       ✅ Backend API running (PID: $BACKEND_PID)${NC}"
            echo -e "${CYAN}       📍 http://localhost:3001${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    echo ""
fi

# ============================================================================
# 2. Start Hardhat Blockchain (Optional)
# ============================================================================
if [ "$START_HARDHAT" = true ]; then
    if [ "$START_BACKEND" = true ]; then
        echo -e "${BLUE}[2/3] Starting Hardhat local blockchain...${NC}"
    else
        echo -e "${BLUE}[1/2] Starting Hardhat local blockchain...${NC}"
    fi
    echo -e "${YELLOW}       Logs: logs/hardhat.log${NC}"
    
    npx hardhat node > logs/hardhat.log 2>&1 &
    HARDHAT_PID=$!
    
    # Wait for Hardhat to start
    echo -n "       Waiting for Hardhat to start"
    sleep 3
    for i in {1..10}; do
        if grep -q "Started HTTP and WebSocket JSON-RPC server" logs/hardhat.log 2>/dev/null; then
            echo ""
            echo -e "${GREEN}       ✅ Hardhat blockchain running (PID: $HARDHAT_PID)${NC}"
            echo -e "${CYAN}       📍 http://localhost:8545${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    
    # Show available accounts
    echo -e "${CYAN}       Available test accounts:${NC}"
    grep "Account #" logs/hardhat.log | head -3 2>/dev/null || echo "       (check logs/hardhat.log)"
    echo ""
    
    # Deploy contracts automatically
    echo -e "${BLUE}       Deploying contracts to local network...${NC}"
    sleep 2  # Give Hardhat a moment to fully initialize
    
    if npx hardhat run scripts/deploy.ts --network localhost > logs/deployment.log 2>&1; then
        echo -e "${GREEN}       ✅ Contracts deployed successfully${NC}"
        
        # Extract contract address from deployment log
        CONTRACT_ADDRESS=$(grep "VITE_CONTRACT_ADDRESS=" logs/deployment.log | cut -d'=' -f2)
        
        if [ -n "$CONTRACT_ADDRESS" ]; then
            echo -e "${CYAN}       📍 StableRent Contract: $CONTRACT_ADDRESS${NC}"
            
            # Update frontend .env if it exists, otherwise create it
            if [ -f "frontend/.env" ]; then
                # Remove old contract address if exists
                grep -v "VITE_CONTRACT_ADDRESS=" frontend/.env > frontend/.env.tmp
                mv frontend/.env.tmp frontend/.env
            fi
            
            # Append new contract address
            echo "VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> frontend/.env
            echo -e "${GREEN}       ✅ Frontend .env updated with contract address${NC}"
        fi
    else
        echo -e "${YELLOW}       ⚠️  Contract deployment failed - check logs/deployment.log${NC}"
    fi
    echo ""
fi

# ============================================================================
# 3. Start Frontend
# ============================================================================
if [ "$START_FRONTEND" = true ]; then
    if [ -d "frontend" ]; then
        # Determine step number
        STEP_NUM="1/1"
        if [ "$START_BACKEND" = true ] && [ "$START_HARDHAT" = true ]; then
            STEP_NUM="3/3"
        elif [ "$START_BACKEND" = true ] || [ "$START_HARDHAT" = true ]; then
            STEP_NUM="2/2"
        fi
        
        echo -e "${BLUE}[$STEP_NUM] Starting frontend...${NC}"
        echo -e "${YELLOW}       Logs: logs/frontend.log${NC}"
        
        cd frontend
        npm run dev > ../logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        cd ..
        
        # Wait for frontend to start
        echo -n "       Waiting for frontend to start"
        sleep 3
        for i in {1..15}; do
            if grep -qE "ready|Local:" logs/frontend.log 2>/dev/null; then
                echo ""
                echo -e "${GREEN}       ✅ Frontend running (PID: $FRONTEND_PID)${NC}"
                
                # Extract port from Vite logs (default 5173)
                FRONTEND_PORT=$(grep "Local:" logs/frontend.log | grep -o "localhost:[0-9]*" | grep -o "[0-9]*" || echo "5173")
                echo -e "${CYAN}       📍 http://localhost:${FRONTEND_PORT}${NC}"
                break
            fi
            echo -n "."
            sleep 1
        done
        echo ""
    else
        echo -e "${YELLOW}[2/2] Frontend directory not found - skipping${NC}"
    fi
    echo ""
fi

# ============================================================================
# Service Status Summary
# ============================================================================
echo "============================================================================"
echo -e "${GREEN}✅ Services Started Successfully!${NC}"
echo "============================================================================"
echo ""

if [ "$START_BACKEND" = true ]; then
    echo -e "${MAGENTA}🔧 Backend API:${NC}"
    echo -e "   URL: http://localhost:3001"
    echo -e "   Health: http://localhost:3001/health"
    echo -e "   API Docs: http://localhost:3001/api"
    echo -e "   Logs: logs/backend.log"
    echo -e "   PID: $BACKEND_PID"
    echo ""
    echo -e "   ${CYAN}Database:${NC}"
    echo -e "   • PostgreSQL: localhost:5432"
    echo -e "   • Database: stablerent"
    echo -e "   • View DB: cd backend && npx prisma studio"
    echo ""
fi

if [ "$START_HARDHAT" = true ]; then
    echo -e "${MAGENTA}🔗 Hardhat Blockchain:${NC}"
    echo -e "   URL: http://localhost:8545"
    echo -e "   Chain ID: 31337"
    echo -e "   Logs: logs/hardhat.log"
    echo -e "   Deployment: logs/deployment.log"
    echo -e "   PID: $HARDHAT_PID"
    echo ""
    
    if [ -f "deployments/localhost.json" ]; then
        echo -e "   ${CYAN}Deployed Contracts:${NC}"
        CONTRACT_ADDR=$(cat deployments/localhost.json | grep -o '"StableRentSubscription": "[^"]*"' | cut -d'"' -f4)
        if [ -n "$CONTRACT_ADDR" ]; then
            echo -e "   • StableRent: $CONTRACT_ADDR"
        fi
        echo ""
    fi
fi

if [ "$START_FRONTEND" = true ] && [ -d "frontend" ]; then
    echo -e "${MAGENTA}🎨 Frontend Dashboard:${NC}"
    echo -e "   URL: http://localhost:${FRONTEND_PORT:-5173}"
    echo -e "   Logs: logs/frontend.log"
    echo -e "   PID: $FRONTEND_PID"
    echo ""
    echo -e "   ${CYAN}Features:${NC}"
    echo -e "   • 🛒 Create Subscription - Set up recurring payments"
    echo -e "   • 📋 My Subscriptions - Manage your subscriptions"
    echo -e "   • 💰 Payment History - View transactions"
    echo -e "   • ⚙️ Settings - Configure wallet & view automation"
    echo ""
fi

# ============================================================================
# Useful Commands
# ============================================================================
echo "============================================================================"
echo -e "${CYAN}📋 Useful Commands:${NC}"
echo "============================================================================"
echo ""

if [ "$START_HARDHAT" = true ]; then
    echo -e "${BLUE}Connect MetaMask to local network:${NC}"
    echo "  Network Name: Hardhat Local"
    echo "  RPC URL: http://localhost:8545"
    echo "  Chain ID: 31337"
    echo "  Import Account #0 private key (see logs/hardhat.log)"
    echo ""
    
    echo -e "${BLUE}Run tests:${NC}"
    echo "  npm test"
    echo ""
    
    echo -e "${BLUE}Explore PYUSD:${NC}"
    echo "  npm run explore"
    echo ""
    
    echo -e "${BLUE}Redeploy contracts (if needed):${NC}"
    echo "  npx hardhat run scripts/deploy.ts --network localhost"
    echo ""
fi

echo -e "${BLUE}View logs:${NC}"
if [ "$START_BACKEND" = true ]; then
    echo "  tail -f logs/backend.log      # Backend API"
fi
if [ "$START_HARDHAT" = true ]; then
    echo "  tail -f logs/hardhat.log      # Hardhat blockchain"
    echo "  tail -f logs/deployment.log   # Contract deployment"
fi
if [ "$START_FRONTEND" = true ]; then
    echo "  tail -f logs/frontend.log     # Frontend"
fi
echo ""

if [ "$START_BACKEND" = true ]; then
    echo -e "${BLUE}Database management:${NC}"
    echo "  cd backend && npx prisma studio  # Open database GUI"
    echo ""
fi

echo "============================================================================"
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop all services${NC}"
echo "============================================================================"
echo ""

# ============================================================================
# Tail Logs (Follow Mode)
# ============================================================================

echo -e "${BLUE}Following logs (Ctrl+C to stop all services)...${NC}"
echo ""

# Wait a moment for logs to be created
sleep 1

# Tail all available log files
if ls logs/*.log 1> /dev/null 2>&1; then
    tail -f logs/*.log 2>/dev/null
else
    echo -e "${YELLOW}No log files found yet. Services are starting...${NC}"
    sleep infinity
fi
