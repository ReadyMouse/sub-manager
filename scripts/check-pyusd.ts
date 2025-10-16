// ========================================
// IMPORTS
// ========================================

// Import ethers from hardhat to interact with the blockchain
import { ethers } from "hardhat";

/**
 * ============================================================
 * PYUSD EXPLORATION SCRIPT
 * ============================================================
 * 
 * PURPOSE:
 * This script demonstrates how to interact with the real PYUSD
 * contract on a forked Ethereum mainnet. It's a simple way to
 * explore the token before writing tests or contracts.
 * 
 * HOW TO RUN:
 * npx hardhat run scripts/check-pyusd.ts
 * 
 * WHAT IT DOES:
 * 1. Connects to the PYUSD contract on forked mainnet
 * 2. Reads token metadata (name, symbol, decimals, supply)
 * 3. Checks balances of known whale addresses
 * 4. Displays network information
 * 
 * WHEN TO USE:
 * - First time exploring PYUSD
 * - Finding whale addresses for testing
 * - Verifying your fork is working correctly
 * - Understanding PYUSD's current state on mainnet
 */

async function main() {
  // ========================================
  // CONFIGURATION
  // ========================================
  
  // PYUSD contract address on Ethereum mainnet
  // This is the official PayPal USD stablecoin deployed by PayPal/Paxos
  // Verify on Etherscan: https://etherscan.io/token/0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
  const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";
  
  console.log("🔍 Exploring PYUSD on Forked Ethereum Mainnet\n");
  
  // ========================================
  // CONNECT TO PYUSD CONTRACT
  // ========================================
  
  // Create a JavaScript object representing the PYUSD contract
  // "IERC20Metadata" tells ethers which interface to use (includes name, symbol, decimals)
  // All ERC20 tokens implement the same standard functions
  const pyusd = await ethers.getContractAt("IERC20Metadata", PYUSD_ADDRESS);
  
  // ========================================
  // READ TOKEN METADATA
  // ========================================
  
  // Call view functions to get information about the token
  // These are free to call (no gas cost) because they just read data
  
  // name(): Returns the full token name
  const name = await pyusd.name();
  
  // symbol(): Returns the ticker symbol
  const symbol = await pyusd.symbol();
  
  // decimals(): Returns how many decimal places the token uses
  // PYUSD uses 6 decimals (like USDC), not 18 like ETH
  // This means 1 PYUSD = 1,000,000 smallest units
  const decimals = await pyusd.decimals();
  
  // totalSupply(): Returns total amount of tokens in existence
  const totalSupply = await pyusd.totalSupply();
  
  // Display the token information
  console.log("📊 Token Information:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals);
  
  // formatUnits() converts raw token units to human-readable format
  // Example: 1000000 (raw) with 6 decimals = "1.0" PYUSD
  console.log("  Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("  Contract Address:", PYUSD_ADDRESS);
  
  // ========================================
  // CHECK WHALE BALANCES
  // ========================================
  
  console.log("\n💰 Sample Holder Balances:");
  
  // Array of addresses that hold PYUSD
  // You can find more whale addresses on Etherscan by looking at the token holders page:
  // https://etherscan.io/token/0x6c3ea9036406852006290770BEdFcAbA0e23A0e8#balances
  // 
  // WHY THIS MATTERS:
  // For testing, you'll want to impersonate these addresses to get test PYUSD
  const holders = [
    "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD contract deployer
    "0x55fe002aeff02f77364de339a1292923a15844b8", // Circle Treasury
    "0x4D73AdB72bC3DD368966edD0f0b2148401A178E2", // Curve PYUSD/USDC pool
    "0xF977814e90dA44bFA03b6295A0616a897441aceC", // Binance cold wallet (has 27.63 PYUSD)
    "0x28C6c06298d514Db089934071355E5743bf21d60", // Binance 14
    "0xCFFAd3200574698b78f32232aa9D63eABD290703", // Potential holder
    "0x5041ed759Dd4aFc3a72b8192C143F72f4724081A", // Potential holder
    "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", // Potential holder
    "0x2FAF487A4414Fe77e2327F0bf4AE2a264a776AD2", // FTX US (might have PYUSD)
    "0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296", // Jumptrading
  ];
  
  // Loop through each holder and check their balance
  for (const holder of holders) {
    try {
      // balanceOf() returns how many tokens an address holds
      const balance = await pyusd.balanceOf(holder);
      
      // Display the balance in human-readable format
      console.log(`  ${holder}: ${ethers.formatUnits(balance, decimals)} PYUSD`);
    } catch (error) {
      // If something goes wrong (unlikely), display an error
      console.log(`  ${holder}: Error fetching balance`);
    }
  }
  
  // ========================================
  // DISPLAY NETWORK INFORMATION
  // ========================================
  
  // Get information about which network we're connected to
  // This should show Chain ID 1 (Ethereum mainnet) because we're forking
  const network = await ethers.provider.getNetwork();
  
  // Get the current block number
  // This shows which block our fork is at (should be recent if not pinned)
  const blockNumber = await ethers.provider.getBlockNumber();
  
  console.log("\n🌐 Network Information:");
  console.log("  Chain ID:", network.chainId);  // Should be 1 for mainnet
  console.log("  Block Number:", blockNumber);   // Should be a recent block
  
  console.log("\n✅ Exploration complete!");
  console.log("\n💡 NEXT STEPS:");
  console.log("  1. Run tests with: npx hardhat test");
  console.log("  2. Deploy your own contract: npx hardhat run scripts/deploy.ts");
  console.log("  3. For StableRent: Study the approve + transferFrom pattern in tests!");
}

// ========================================
// MAIN EXECUTION
// ========================================

// Execute the main function
// .then() and .catch() handle success and errors
main()
  .then(() => {
    // If successful, exit with code 0 (success)
    process.exit(0);
  })
  .catch((error) => {
    // If there's an error, log it and exit with code 1 (failure)
    console.error(error);
    process.exit(1);
  });

