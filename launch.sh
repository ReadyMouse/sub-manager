#!/bin/bash

# ============================================================================
# SubChain Launch Script
# ============================================================================
# This script launches SubChain services:
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
echo "🚀 SubChain Service Launcher"
echo "============================================================================"
echo ""
echo "This script will start the following services:"
echo "  1. Local Hardhat blockchain (optional)"
echo "  2. Frontend application"
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
echo "  1) Everything (Hardhat + Frontend)"
echo "  2) Frontend only (connects to existing network)"
echo "  3) Hardhat only (for testing)"
echo ""
read -p "Enter choice [1-3]: " CHOICE
echo ""

START_HARDHAT=false
START_FRONTEND=false

case $CHOICE in
    1)
        START_HARDHAT=true
        START_FRONTEND=true
        ;;
    2)
        START_FRONTEND=true
        ;;
    3)
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
# 1. Start Hardhat Blockchain (Optional)
# ============================================================================
if [ "$START_HARDHAT" = true ]; then
    echo -e "${BLUE}[1/2] Starting Hardhat local blockchain...${NC}"
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
    echo ""
    
    # Show available accounts
    echo -e "${CYAN}       Available test accounts:${NC}"
    grep "Account #" logs/hardhat.log | head -5 || true
    echo ""
fi

# ============================================================================
# 2. Start Frontend
# ============================================================================
if [ "$START_FRONTEND" = true ]; then
    if [ -d "frontend" ]; then
        echo -e "${BLUE}[2/2] Starting frontend...${NC}"
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

if [ "$START_HARDHAT" = true ]; then
    echo -e "${MAGENTA}🔗 Hardhat Blockchain:${NC}"
    echo -e "   URL: http://localhost:8545"
    echo -e "   Logs: logs/hardhat.log"
    echo -e "   PID: $HARDHAT_PID"
    echo ""
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
    echo -e "${BLUE}Deploy contracts to local network:${NC}"
    echo "  npx hardhat run scripts/deploy.ts --network localhost"
    echo ""
    
    echo -e "${BLUE}Run tests:${NC}"
    echo "  npm test"
    echo ""
    
    echo -e "${BLUE}Explore PYUSD:${NC}"
    echo "  npm run explore"
    echo ""
fi

echo -e "${BLUE}View logs:${NC}"
if [ "$START_HARDHAT" = true ]; then
    echo "  tail -f logs/hardhat.log   # Hardhat blockchain"
fi
if [ "$START_FRONTEND" = true ]; then
    echo "  tail -f logs/frontend.log  # Frontend"
fi
echo ""

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
