#!/bin/bash

################################################################################
# StableRent - Complete Deployment Orchestrator
################################################################################
# This script automates the entire deployment process:
# 1. Prerequisites validation
# 2. Dependency installation
# 3. Environment setup
# 4. Database initialization
# 5. Smart contract deployment
# 6. Backend setup and startup
# 7. Frontend build and startup
# 8. Health checks and verification
#
# Usage: ./deploy.sh [options]
# Options:
#   --env=<environment>    Deployment environment: local, testnet, or production (default: local)
#   --skip-deps           Skip dependency installation
#   --skip-contracts      Skip contract deployment
#   --skip-db             Skip database setup
#   --help                Show this help message
################################################################################

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
DEPLOYMENT_ENV="local"
SKIP_DEPS=false
SKIP_CONTRACTS=false
SKIP_DB=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
DEPLOYMENT_LOG="$LOG_DIR/deployment_$(date +%Y%m%d_%H%M%S).log"

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --env=*)
      DEPLOYMENT_ENV="${arg#*=}"
      shift
      ;;
    --skip-deps)
      SKIP_DEPS=true
      shift
      ;;
    --skip-contracts)
      SKIP_CONTRACTS=true
      shift
      ;;
    --skip-db)
      SKIP_DB=true
      shift
      ;;
    --help)
      head -n 22 "$0" | tail -n +2 | sed 's/^# //'
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Create logs directory
mkdir -p "$LOG_DIR"

################################################################################
# Utility Functions
################################################################################

log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case $level in
    INFO)
      echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
      ;;
    WARN)
      echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
      ;;
    ERROR)
      echo -e "${RED}[ERROR]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
      ;;
    SUCCESS)
      echo -e "${GREEN}[✓]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
      ;;
    STEP)
      echo -e "\n${CYAN}========================================${NC}" | tee -a "$DEPLOYMENT_LOG"
      echo -e "${CYAN}$message${NC}" | tee -a "$DEPLOYMENT_LOG"
      echo -e "${CYAN}========================================${NC}" | tee -a "$DEPLOYMENT_LOG"
      ;;
  esac
}

check_command() {
  if command -v "$1" &> /dev/null; then
    log SUCCESS "$1 is installed"
    return 0
  else
    log ERROR "$1 is not installed"
    return 1
  fi
}

prompt_user() {
  local prompt_message="$1"
  local variable_name="$2"
  local is_secret="${3:-false}"
  
  if [ "$is_secret" = "true" ]; then
    read -sp "$prompt_message: " user_input
    echo
  else
    read -p "$prompt_message: " user_input
  fi
  
  eval "$variable_name='$user_input'"
}

check_env_file() {
  local env_file="$1"
  local env_example="${env_file}.example"
  
  if [ -f "$env_file" ]; then
    log INFO "Found existing $env_file"
    return 0
  elif [ -f "$env_example" ]; then
    log WARN "$env_file not found, but $env_example exists"
    return 1
  else
    log ERROR "Neither $env_file nor $env_example found"
    return 2
  fi
}

################################################################################
# Step 1: Display Welcome Banner
################################################################################

clear
echo -e "${MAGENTA}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗████████╗ █████╗ ██████╗ ██╗     ███████╗          ║
║   ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║     ██╔════╝          ║
║   ███████╗   ██║   ███████║██████╔╝██║     █████╗            ║
║   ╚════██║   ██║   ██╔══██║██╔══██╗██║     ██╔══╝            ║
║   ███████║   ██║   ██║  ██║██████╔╝███████╗███████╗          ║
║   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝          ║
║                                                               ║
║          Universal Crypto Subscription Manager               ║
║              Automated Deployment Wizard                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log INFO "Starting StableRent deployment process..."
log INFO "Environment: $DEPLOYMENT_ENV"
log INFO "Working directory: $SCRIPT_DIR"
log INFO "Log file: $DEPLOYMENT_LOG"

################################################################################
# Step 2: Prerequisites Check
################################################################################

log STEP "Step 1: Checking Prerequisites"

PREREQ_FAILED=false

# Check Node.js
if check_command node; then
  NODE_VERSION=$(node --version)
  log INFO "Node.js version: $NODE_VERSION"
  
  # Check if version is >= 18
  NODE_MAJOR_VERSION=$(echo "$NODE_VERSION" | sed -E 's/v([0-9]+).*/\1/')
  if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    log ERROR "Node.js version must be >= 18.x (current: $NODE_VERSION)"
    PREREQ_FAILED=true
  fi
else
  log ERROR "Please install Node.js >= 18.x from https://nodejs.org/"
  PREREQ_FAILED=true
fi

# Check npm
if check_command npm; then
  NPM_VERSION=$(npm --version)
  log INFO "npm version: $NPM_VERSION"
else
  log ERROR "npm is not installed (should come with Node.js)"
  PREREQ_FAILED=true
fi

# Check Git
if check_command git; then
  GIT_VERSION=$(git --version)
  log INFO "Git: $GIT_VERSION"
else
  log WARN "Git not found - you may need it for version control"
fi

# Check PostgreSQL (optional for local development)
if check_command psql; then
  PSQL_VERSION=$(psql --version)
  log INFO "PostgreSQL: $PSQL_VERSION"
else
  log WARN "PostgreSQL not found locally - you can use a cloud database instead"
fi

# Check for jq (useful for JSON parsing)
if ! check_command jq; then
  log WARN "jq not found - some advanced features may not work"
  log INFO "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
fi

if [ "$PREREQ_FAILED" = true ]; then
  log ERROR "Prerequisites check failed. Please install missing dependencies and try again."
  exit 1
fi

log SUCCESS "All critical prerequisites are satisfied!"

################################################################################
# Step 3: Environment Configuration
################################################################################

log STEP "Step 2: Environment Configuration"

# Check root .env file
if ! check_env_file ".env"; then
  log INFO "Setting up root .env file..."
  
  if [ "$DEPLOYMENT_ENV" = "local" ]; then
    # Create a basic .env file for local development
    cat > .env << 'EOF'
# Blockchain RPC URLs
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key-here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key-here

# Deployment Private Key (for testnet/mainnet deployment)
# NEVER commit this! Add to .gitignore
SEPOLIA_PRIVATE_KEY=your-private-key-here
MAINNET_PRIVATE_KEY=your-private-key-here

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your-etherscan-api-key-here
EOF
    log SUCCESS "Created .env file with default values"
    log WARN "Please edit .env and add your RPC URLs and private keys"
  fi
fi

# Check backend .env file
if ! check_env_file "backend/.env"; then
  log INFO "Setting up backend .env file..."
  
  if [ -f "backend/env.example" ]; then
    cp backend/env.example backend/.env
    log SUCCESS "Created backend/.env from env.example"
    log WARN "Please edit backend/.env with your configuration"
  fi
fi

# Prompt user to configure environment if in interactive mode
if [ -t 0 ]; then
  echo
  log INFO "Would you like to configure environment variables now? (y/n)"
  read -p "Configure now? [y/N]: " configure_now
  
  if [[ $configure_now =~ ^[Yy]$ ]]; then
    log INFO "Opening environment configuration wizard..."
    
    # Run the interactive configuration script
    if [ -f "$SCRIPT_DIR/scripts/configure-env.sh" ]; then
      bash "$SCRIPT_DIR/scripts/configure-env.sh"
    else
      log WARN "Configuration wizard not found. Please edit .env files manually."
    fi
  else
    log INFO "Skipping environment configuration. Make sure to configure before deploying!"
  fi
fi

################################################################################
# Step 4: Dependency Installation
################################################################################

if [ "$SKIP_DEPS" = false ]; then
  log STEP "Step 3: Installing Dependencies"
  
  # Install root dependencies (Hardhat, smart contracts)
  log INFO "Installing root dependencies..."
  npm install 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
    log ERROR "Failed to install root dependencies"
    exit 1
  }
  log SUCCESS "Root dependencies installed"
  
  # Install backend dependencies
  log INFO "Installing backend dependencies..."
  cd "$SCRIPT_DIR/backend"
  npm install 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
    log ERROR "Failed to install backend dependencies"
    exit 1
  }
  cd "$SCRIPT_DIR"
  log SUCCESS "Backend dependencies installed"
  
  # Install frontend dependencies
  log INFO "Installing frontend dependencies..."
  cd "$SCRIPT_DIR/frontend"
  npm install 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
    log ERROR "Failed to install frontend dependencies"
    exit 1
  }
  cd "$SCRIPT_DIR"
  log SUCCESS "Frontend dependencies installed"
  
  log SUCCESS "All dependencies installed successfully!"
else
  log INFO "Skipping dependency installation (--skip-deps)"
fi

################################################################################
# Step 5: Database Setup
################################################################################

if [ "$SKIP_DB" = false ]; then
  log STEP "Step 4: Database Setup"
  
  # Check if DATABASE_URL is set in backend/.env
  if [ -f "backend/.env" ]; then
    source backend/.env
    
    if [ -z "$DATABASE_URL" ]; then
      log ERROR "DATABASE_URL not set in backend/.env"
      log INFO "Please configure your database connection and try again"
      exit 1
    fi
    
    log INFO "Database URL configured"
    
    # Run Prisma migrations
    log INFO "Running database migrations..."
    cd "$SCRIPT_DIR/backend"
    npm run prisma:generate 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
      log ERROR "Failed to generate Prisma client"
      exit 1
    }
    
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
      npm run prisma:migrate:deploy 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
        log ERROR "Failed to run database migrations"
        exit 1
      }
    else
      npm run prisma:migrate 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
        log WARN "Database migration had issues - you may need to run it manually"
      }
    fi
    
    cd "$SCRIPT_DIR"
    log SUCCESS "Database setup complete"
  else
    log ERROR "backend/.env not found. Cannot set up database."
    exit 1
  fi
else
  log INFO "Skipping database setup (--skip-db)"
fi

################################################################################
# Step 6: Smart Contract Compilation and Deployment
################################################################################

if [ "$SKIP_CONTRACTS" = false ]; then
  log STEP "Step 5: Smart Contract Deployment"
  
  # Compile contracts
  log INFO "Compiling smart contracts..."
  npm run compile 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
    log ERROR "Failed to compile smart contracts"
    exit 1
  }
  log SUCCESS "Smart contracts compiled"
  
  # Deploy based on environment
  case $DEPLOYMENT_ENV in
    local)
      log INFO "Deploying to local Hardhat network..."
      
      # Start Hardhat node in background
      log INFO "Starting Hardhat node..."
      npx hardhat node > "$LOG_DIR/hardhat-node.log" 2>&1 &
      HARDHAT_PID=$!
      echo $HARDHAT_PID > "$LOG_DIR/hardhat.pid"
      
      # Wait for node to start
      sleep 5
      
      log INFO "Deploying contracts to localhost..."
      npm run deploy:localhost 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
        log ERROR "Failed to deploy contracts"
        kill $HARDHAT_PID 2>/dev/null
        exit 1
      }
      
      log SUCCESS "Contracts deployed to local network"
      ;;
      
    testnet)
      log INFO "Deploying to Sepolia testnet..."
      
      # Check if private key is set
      if [ -f ".env" ]; then
        source .env
        if [ -z "$SEPOLIA_PRIVATE_KEY" ]; then
          log ERROR "SEPOLIA_PRIVATE_KEY not set in .env"
          exit 1
        fi
      fi
      
      npm run deploy:sepolia 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
        log ERROR "Failed to deploy contracts to Sepolia"
        exit 1
      }
      
      log SUCCESS "Contracts deployed to Sepolia testnet"
      ;;
      
    production)
      log WARN "Production deployment requires additional confirmation"
      log WARN "Please ensure you have reviewed all settings"
      
      read -p "Are you sure you want to deploy to mainnet? (yes/no): " confirm
      if [ "$confirm" != "yes" ]; then
        log INFO "Deployment cancelled"
        exit 0
      fi
      
      log ERROR "Mainnet deployment not yet configured in this script"
      log INFO "Please deploy manually using appropriate scripts"
      exit 1
      ;;
      
    *)
      log ERROR "Unknown deployment environment: $DEPLOYMENT_ENV"
      exit 1
      ;;
  esac
  
  # Extract contract addresses from deployment
  if [ -f "deployments/${DEPLOYMENT_ENV}.json" ] || [ -f "deployments/localhost.json" ]; then
    DEPLOYMENT_FILE="deployments/${DEPLOYMENT_ENV}.json"
    [ ! -f "$DEPLOYMENT_FILE" ] && DEPLOYMENT_FILE="deployments/localhost.json"
    
    if command -v jq &> /dev/null && [ -f "$DEPLOYMENT_FILE" ]; then
      CONTRACT_ADDRESS=$(jq -r '.contractAddress // .StableRentSubscription // .address' "$DEPLOYMENT_FILE" 2>/dev/null || echo "")
      
      if [ -n "$CONTRACT_ADDRESS" ] && [ "$CONTRACT_ADDRESS" != "null" ]; then
        log SUCCESS "Contract address: $CONTRACT_ADDRESS"
        
        # Update backend .env with contract address
        if [ -f "backend/.env" ]; then
          if grep -q "^CONTRACT_ADDRESS=" backend/.env; then
            sed -i.bak "s|^CONTRACT_ADDRESS=.*|CONTRACT_ADDRESS=$CONTRACT_ADDRESS|" backend/.env
          else
            echo "CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> backend/.env
          fi
          log SUCCESS "Updated CONTRACT_ADDRESS in backend/.env"
        fi
      fi
    fi
  fi
else
  log INFO "Skipping contract deployment (--skip-contracts)"
fi

################################################################################
# Step 7: Backend Setup and Startup
################################################################################

log STEP "Step 6: Backend Setup"

cd "$SCRIPT_DIR/backend"

# Build backend
log INFO "Building backend..."
npm run build 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
  log WARN "Backend build had warnings, but continuing..."
}

# Start backend based on environment
if [ "$DEPLOYMENT_ENV" = "local" ]; then
  log INFO "Starting backend in development mode..."
  npm run dev > "$LOG_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
  echo $BACKEND_PID > "$LOG_DIR/backend.pid"
  
  log SUCCESS "Backend started (PID: $BACKEND_PID)"
  log INFO "Backend logs: $LOG_DIR/backend.log"
else
  log INFO "For production/testnet, start backend with: npm start"
  log INFO "Consider using PM2 or similar process manager"
fi

cd "$SCRIPT_DIR"

################################################################################
# Step 8: Frontend Build and Startup
################################################################################

log STEP "Step 7: Frontend Setup"

cd "$SCRIPT_DIR/frontend"

# Create/update frontend .env if needed
log INFO "Configuring frontend environment..."

BACKEND_URL="http://localhost:3001"
CONTRACT_ADDRESS_FROM_FILE=""

if [ -f "$SCRIPT_DIR/backend/.env" ]; then
  source "$SCRIPT_DIR/backend/.env"
  if [ -n "$API_URL" ]; then
    BACKEND_URL="$API_URL"
  fi
fi

cat > .env.local << EOF
# API Configuration
VITE_API_URL=${BACKEND_URL}

# Contract Configuration (will be updated after deployment)
VITE_CONTRACT_ADDRESS=${CONTRACT_ADDRESS:-0x0000000000000000000000000000000000000000}

# Chain Configuration
VITE_CHAIN_ID=${DEPLOYMENT_ENV = "local" && echo "31337" || echo "11155111"}

# Environment
VITE_ENVIRONMENT=${DEPLOYMENT_ENV}
EOF

log SUCCESS "Frontend environment configured"

# Build or start frontend based on environment
if [ "$DEPLOYMENT_ENV" = "production" ]; then
  log INFO "Building frontend for production..."
  npm run build 2>&1 | tee -a "$DEPLOYMENT_LOG" || {
    log ERROR "Failed to build frontend"
    exit 1
  }
  log SUCCESS "Frontend built successfully"
  log INFO "Frontend build output: $SCRIPT_DIR/frontend/dist"
else
  log INFO "Starting frontend development server..."
  npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"
  
  log SUCCESS "Frontend started (PID: $FRONTEND_PID)"
  log INFO "Frontend logs: $LOG_DIR/frontend.log"
fi

cd "$SCRIPT_DIR"

################################################################################
# Step 9: Health Checks
################################################################################

log STEP "Step 8: Health Checks"

sleep 5  # Give services time to start

# Check backend health
if [ "$DEPLOYMENT_ENV" = "local" ]; then
  log INFO "Checking backend health..."
  
  if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    log SUCCESS "Backend is healthy"
  else
    log WARN "Backend health check failed (may still be starting up)"
  fi
  
  # Check frontend
  log INFO "Checking frontend..."
  
  if curl -s -f http://localhost:5173 > /dev/null 2>&1; then
    log SUCCESS "Frontend is accessible"
  else
    log WARN "Frontend not accessible yet (may still be starting up)"
  fi
fi

################################################################################
# Step 10: Summary and Next Steps
################################################################################

log STEP "Deployment Complete! 🎉"

echo
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}           StableRent Deployment Summary${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo
echo -e "${CYAN}Environment:${NC} $DEPLOYMENT_ENV"
echo

if [ "$DEPLOYMENT_ENV" = "local" ]; then
  echo -e "${CYAN}Services:${NC}"
  echo -e "  🔗 Frontend:  http://localhost:5173"
  echo -e "  🔗 Backend:   http://localhost:3001"
  echo -e "  🔗 Hardhat:   http://localhost:8545"
  echo
  
  if [ -n "$CONTRACT_ADDRESS" ]; then
    echo -e "${CYAN}Contract Address:${NC} $CONTRACT_ADDRESS"
    echo
  fi
  
  echo -e "${CYAN}Process IDs:${NC}"
  [ -f "$LOG_DIR/hardhat.pid" ] && echo -e "  Hardhat Node: $(cat $LOG_DIR/hardhat.pid)"
  [ -f "$LOG_DIR/backend.pid" ] && echo -e "  Backend:      $(cat $LOG_DIR/backend.pid)"
  [ -f "$LOG_DIR/frontend.pid" ] && echo -e "  Frontend:     $(cat $LOG_DIR/frontend.pid)"
  echo
  
  echo -e "${CYAN}Logs:${NC}"
  echo -e "  📝 Deployment: $DEPLOYMENT_LOG"
  echo -e "  📝 Backend:    $LOG_DIR/backend.log"
  echo -e "  📝 Frontend:   $LOG_DIR/frontend.log"
  echo -e "  📝 Hardhat:    $LOG_DIR/hardhat-node.log"
  echo
fi

echo -e "${CYAN}Next Steps:${NC}"
echo
if [ "$DEPLOYMENT_ENV" = "local" ]; then
  echo "  1. Open http://localhost:5173 in your browser"
  echo "  2. Connect your wallet (MetaMask) to localhost:8545"
  echo "  3. Import test accounts from Hardhat for testing"
  echo "  4. Create your first subscription!"
  echo
  echo -e "${YELLOW}To stop all services:${NC}"
  echo "  ./scripts/stop-services.sh"
  echo
else
  echo "  1. Verify all environment variables are correctly set"
  echo "  2. Start the backend: cd backend && npm start"
  echo "  3. Deploy frontend build to your hosting provider"
  echo "  4. Configure DNS and SSL certificates"
  echo "  5. Test the application thoroughly"
  echo
fi

echo -e "${CYAN}Documentation:${NC}"
echo "  📚 README:        ./README.md"
echo "  📚 Deployment:    ./DEPLOYMENT_STATUS.md"
echo "  📚 Gelato Setup:  ./GELATO_AUTOMATION_SUMMARY.md"
echo "  📚 Backend API:   ./backend/README.md"
echo
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo

# Save deployment info
cat > "$SCRIPT_DIR/LAST_DEPLOYMENT.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$DEPLOYMENT_ENV",
  "contractAddress": "${CONTRACT_ADDRESS:-}",
  "logFile": "$DEPLOYMENT_LOG"
}
EOF

log SUCCESS "Deployment information saved to LAST_DEPLOYMENT.json"
log INFO "Deployment completed successfully!"

exit 0

