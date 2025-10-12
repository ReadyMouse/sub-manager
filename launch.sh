#!/bin/bash

# ============================================================================
# SubChain Launch Script
# ============================================================================
# This script launches all SubChain services:
# - Local Hardhat blockchain (optional)
# - Backend webhook server (Envio + Coinbase integration)
# - Frontend (when ready)
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
echo "  2. Backend webhook server (Envio + Coinbase)"
echo "  3. Frontend (if available)"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================================================"
echo ""

# ============================================================================
# Configuration
# ============================================================================

# Check if .env files exist (skip check if only starting frontend)
if [ "$START_BACKEND" = true ] && [ ! -f backend/.env ]; then
    echo -e "${RED}❌ backend/.env not found!${NC}"
    echo -e "${YELLOW}   Run ./setup.sh first to create configuration files${NC}"
    exit 1
fi

# Ask user what to start
echo -e "${CYAN}What would you like to start?${NC}"
echo ""
echo "  1) Everything (Hardhat + Backend + Frontend)"
echo "  2) Backend only (connects to existing network)"
echo "  3) Hardhat + Backend (for local development)"
echo "  4) Backend + Frontend (no local blockchain)"
echo "  5) Frontend only (for UI testing)"
echo ""
read -p "Enter choice [1-5]: " CHOICE
echo ""

START_HARDHAT=false
START_BACKEND=false
START_FRONTEND=false

case $CHOICE in
    1)
        START_HARDHAT=true
        START_BACKEND=true
        START_FRONTEND=true
        ;;
    2)
        START_BACKEND=true
        ;;
    3)
        START_HARDHAT=true
        START_BACKEND=true
        ;;
    4)
        START_BACKEND=true
        START_FRONTEND=true
        ;;
    5)
        START_FRONTEND=true
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
    echo -e "${BLUE}[1/3] Starting Hardhat local blockchain...${NC}"
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
# 2. Start Backend Webhook Server (Envio + Coinbase)
# ============================================================================
if [ "$START_BACKEND" = true ]; then
    echo -e "${BLUE}[2/3] Starting backend webhook server...${NC}"
    echo -e "${YELLOW}       Logs: logs/backend.log${NC}"
    
    cd backend
    npm run start > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo -n "       Waiting for backend to start"
    sleep 2
    for i in {1..15}; do
        if grep -q "ENVIO WEBHOOK SERVER LISTENING" logs/backend.log 2>/dev/null; then
            echo ""
            echo -e "${GREEN}       ✅ Backend server running (PID: $BACKEND_PID)${NC}"
            
            # Extract port from backend logs
            PORT=$(grep "Server:" logs/backend.log | grep -o ":[0-9]*" | grep -o "[0-9]*" || echo "3000")
            echo -e "${CYAN}       📍 http://localhost:${PORT}${NC}"
            echo -e "${CYAN}       📍 Health check: http://localhost:${PORT}/health${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    echo ""
fi

# ============================================================================
# 3. Start Frontend (Optional)
# ============================================================================
if [ "$START_FRONTEND" = true ]; then
    if [ -d "frontend" ]; then
        echo -e "${BLUE}[3/3] Starting frontend...${NC}"
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
        echo -e "${YELLOW}[3/3] Frontend directory not found - skipping${NC}"
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

if [ "$START_BACKEND" = true ]; then
    echo -e "${MAGENTA}🔌 Backend Webhook Server:${NC}"
    echo -e "   URL: http://localhost:${PORT:-3000}"
    echo -e "   Health: http://localhost:${PORT:-3000}/health"
    echo -e "   Logs: logs/backend.log"
    echo -e "   PID: $BACKEND_PID"
    echo ""
    echo -e "   ${CYAN}Webhook Endpoints:${NC}"
    echo -e "   • POST /webhook/payment-processed"
    echo -e "   • POST /webhook/payment-failed"
    echo -e "   • POST /webhook/subscription-cancelled"
    echo -e "   • POST /webhook/subscription-created"
    echo ""
fi

if [ "$START_FRONTEND" = true ] && [ -d "frontend" ]; then
    echo -e "${MAGENTA}🎨 Frontend Dashboard:${NC}"
    echo -e "   URL: http://localhost:${FRONTEND_PORT:-5173}"
    echo -e "   Logs: logs/frontend.log"
    echo -e "   PID: $FRONTEND_PID"
    echo ""
    echo -e "   ${CYAN}Features:${NC}"
    echo -e "   • 🛒 Marketplace - Browse subscription services"
    echo -e "   • 📋 My Subscriptions - Manage your subscriptions"
    echo -e "   • 💰 Payment History - View transactions"
    echo -e "   • ⚙️ Settings - Configure wallet & PayPal"
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
fi

if [ "$START_BACKEND" = true ]; then
    echo -e "${BLUE}Test payment flow:${NC}"
    echo "  npm run backend:test"
    echo ""
    
    echo -e "${BLUE}Check backend health:${NC}"
    echo "  curl http://localhost:${PORT:-3000}/health"
    echo ""
    
    echo -e "${BLUE}Expose backend with ngrok (for Envio webhooks):${NC}"
    echo "  ngrok http ${PORT:-3000}"
    echo ""
fi

echo -e "${BLUE}View logs:${NC}"
if [ "$START_HARDHAT" = true ]; then
    echo "  tail -f logs/hardhat.log   # Hardhat blockchain"
fi
if [ "$START_BACKEND" = true ]; then
    echo "  tail -f logs/backend.log   # Backend server"
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
if [ -f logs/*.log ] 2>/dev/null; then
    tail -f logs/*.log 2>/dev/null
else
    echo -e "${YELLOW}No log files found yet. Services are starting...${NC}"
    sleep infinity
fi

