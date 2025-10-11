#!/bin/bash
# Hardhat + PYUSD Setup Script
# Usage: ./setup.sh

set -e  # Exit on error

echo "🚀 Setting up Hardhat + PYUSD environment..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "📍 Detected Node.js version: $(node -v)"

if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. You have: $(node -v)"
    echo "   Please upgrade Node.js or use nvm: nvm install 22 && nvm use 22"
    exit 1
elif [ "$NODE_VERSION" -eq 21 ]; then
    echo "⚠️  Node.js v21 may have compatibility issues. Recommend v22 or v20."
fi

echo "✓ Node.js version is compatible"

# Create directories
mkdir -p contracts test scripts

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << 'EOF'
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ACTUAL_API_KEY_HERE
PYUSD_ADDRESS=0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
EOF
    echo "✓ Created .env (add your Alchemy API key!)"
else
    echo "✓ .env exists"
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    cat > .gitignore << 'EOF'
node_modules
.env
coverage
coverage.json
typechain-types
dist
cache
artifacts
.DS_Store
EOF
    echo "✓ Created .gitignore"
fi

# Install dependencies
echo "📦 Installing dependencies..."
echo "   Using Hardhat 2.x (more stable than 3.x)"
npm install --save-dev \
  hardhat@^2.22.0 \
  @nomicfoundation/hardhat-toolbox@^5.0.0 \
  @nomicfoundation/hardhat-network-helpers@^1.0.0 \
  @nomicfoundation/hardhat-chai-matchers@^2.0.0 \
  @nomicfoundation/hardhat-ethers@^3.0.0 \
  @nomicfoundation/hardhat-verify@^2.0.0 \
  @nomicfoundation/hardhat-ignition@^0.15.0 \
  @nomicfoundation/hardhat-ignition-ethers@^0.15.0 \
  @typechain/hardhat@^9.0.0 \
  @typechain/ethers-v6@^0.5.0 \
  typechain@^8.3.0 \
  chai@^4.3.0 \
  @types/chai@^4.3.0 \
  @types/node@^20.0.0 \
  typescript@^5.0.0 \
  ts-node@^10.9.0 \
  ethers@^6.4.0 \
  hardhat-gas-reporter@^1.0.0 \
  solidity-coverage@^0.8.0

npm install @openzeppelin/contracts@^5.4.0 dotenv@^17.2.3

# Compile contracts if any exist
if ls contracts/*.sol 1> /dev/null 2>&1; then
    echo "🔨 Compiling contracts..."
    npm run compile
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Add your Alchemy API key to .env"
echo "   2. Run: npm test"
echo ""
echo "💡 Note: This project uses Hardhat 2.x with Node.js v22"
echo "   If you encounter issues, ensure you're using Node.js 18+, 20, or 22"
