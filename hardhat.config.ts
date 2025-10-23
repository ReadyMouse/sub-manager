// Import the TypeScript type definition for Hardhat configuration
// This gives us autocomplete and type checking for our config
import { HardhatUserConfig } from "hardhat/config";

// Import the Hardhat toolbox - this is a plugin that bundles together:
// - @nomicfoundation/hardhat-ethers (ethers.js integration)
// - @nomicfoundation/hardhat-chai-matchers (testing assertions)
// - hardhat-gas-reporter (gas usage reporting)
// - solidity-coverage (code coverage)
// - @typechain/hardhat (TypeScript bindings for contracts)
import "@nomicfoundation/hardhat-toolbox";

// Import dotenv to load environment variables from .env file
// This allows us to keep sensitive data (like API keys) out of our code
import "dotenv/config";

// Define our Hardhat configuration
const config: HardhatUserConfig = {
  // ========================================
  // PATHS CONFIGURATION
  // ========================================
  paths: {
    sources: "./contracts",
  },
  
  // ========================================
  // SOLIDITY COMPILER SETTINGS
  // ========================================
  solidity: {
    // Specify which version of Solidity to use for compiling contracts
    // 0.8.20 is a recent stable version with good security features
    version: "0.8.20",
    
    settings: {
      // The optimizer tries to reduce gas costs and contract size
      optimizer: {
        // enabled: true means we want to optimize our contracts
        enabled: true,
        
        // runs: 200 is how many times we expect to execute each opcode
        // - Lower number (50): optimizes for deployment cost (smaller bytecode)
        // - Higher number (10000+): optimizes for execution cost (cheaper function calls)
        // - 200 is a good middle ground for most use cases
        runs: 200,
      },
      
      // viaIR: true enables the IR-based code generator
      // This uses an intermediate representation (Yul) which:
      // - Handles "stack too deep" errors better
      // - Produces more optimized code
      // - Slightly slower compilation but better for complex contracts
      viaIR: true,
    },
  },
  
  // ========================================
  // NETWORK CONFIGURATION
  // ========================================
  networks: {
    // "hardhat" is the default local network that Hardhat creates
    // This is where our tests run
    hardhat: {
      // FORKING CONFIGURATION - This is the key feature for learning!
      // Forking creates a local copy of an existing blockchain at a specific point
      ...(process.env.MAINNET_RPC_URL ? {
        forking: {
          // url: The RPC endpoint to connect to the real Ethereum mainnet
          // We read it from environment variable MAINNET_RPC_URL
          // If not set, falls back to a placeholder (you'll need to replace this)
          // 
          // FREE RPC PROVIDERS:
          // - Alchemy: https://www.alchemy.com/ (recommended, 300M compute units/month free)
          // - Infura: https://www.infura.io/ (100k requests/day free)
          // - Public nodes: Less reliable but free (e.g., https://eth.llamarpc.com)
          url: process.env.MAINNET_RPC_URL,
          
          // OPTIONAL: Pin to a specific block number for deterministic tests
          // This ensures your tests always run against the same blockchain state
          // Useful when you want consistent results across test runs
          // Example: blockNumber: 18000000 would fork from that exact block
          // Commented out by default so we fork from the latest block
          // blockNumber: 18000000
        },
      } : {}),
      
      // chainId: The network ID
      // 31337 = Hardhat local network
      // This tells Hardhat to use the local network ID
      // Important for contracts that check which network they're on
      chainId: 31337,
    },
    
    // ========================================
    // SEPOLIA TESTNET - For hackathon demo and testing
    // ========================================
    sepolia: {
      // Sepolia RPC URL from environment variable
      // Get a free API key from Alchemy or Infura
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo",
      
      // accounts: Private key(s) for deployment
      // IMPORTANT: NEVER commit your private key to git!
      // Add SEPOLIA_PRIVATE_KEY to your .env file
      accounts: process.env.SEPOLIA_PRIVATE_KEY 
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : [],
      
      // Chain ID for Sepolia testnet
      chainId: 11155111,
      
      // Gas settings (optional but recommended for testnets)
      gas: "auto",
      gasPrice: "auto",
    },
    
    // ========================================
    // LOCALHOST - For local Hardhat node (without forking)
    // ========================================
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  
  // ========================================
  // TYPECHAIN CONFIGURATION
  // ========================================
  // TypeChain generates TypeScript types for your smart contracts
  // This gives you autocomplete and type safety when interacting with contracts in tests
  typechain: {
    // outDir: Where to save the generated TypeScript files
    outDir: "typechain-types",
    
    // target: Which library we're using to interact with contracts
    // "ethers-v6" means we're using ethers.js version 6
    target: "ethers-v6",
  },

  // ========================================
  // ETHERSCAN VERIFICATION CONFIGURATION
  // ========================================
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY!,
      mainnet: process.env.ETHERSCAN_API_KEY!,
    },
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io"
        }
      }
    ]
  },

  // ========================================
  // SOURCIFY CONFIGURATION
  // ========================================
  sourcify: {
    enabled: true
  },
};

// Export the configuration so Hardhat can use it
export default config;

