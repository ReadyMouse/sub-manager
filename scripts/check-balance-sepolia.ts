import { ethers } from "hardhat";

async function main() {
  const PYUSD_ADDRESS = "0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53";
  const YOUR_ADDRESS = "0xbA2994967b75c22DBF9833fFD0A749BD66e7F0F3";
  
  console.log("🔍 Checking PYUSD Balance on Sepolia\n");
  console.log("Your Address:", YOUR_ADDRESS);
  console.log("PYUSD Token:", PYUSD_ADDRESS);
  console.log("");
  
  try {
    // Get the PYUSD contract
    const PyusdContract = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      PYUSD_ADDRESS
    );
    
    // Check balance
    const balance = await PyusdContract.balanceOf(YOUR_ADDRESS);
    console.log("✅ PYUSD Balance (raw):", balance.toString());
    console.log("✅ PYUSD Balance (formatted):", ethers.formatUnits(balance, 6), "PYUSD");
    console.log("");
    
    // Check if it's actually a valid contract
    const code = await ethers.provider.getCode(PYUSD_ADDRESS);
    if (code === "0x") {
      console.log("⚠️  WARNING: No contract found at PYUSD address!");
      console.log("   This might not be the correct PYUSD token on Sepolia");
    } else {
      console.log("✅ PYUSD contract exists at this address");
    }
    
  } catch (error: any) {
    console.log("❌ Error checking balance:", error.message);
    console.log("");
    console.log("This could mean:");
    console.log("  1. The PYUSD address is incorrect for Sepolia");
    console.log("  2. The token contract doesn't exist yet on Sepolia");
    console.log("  3. There's a network connectivity issue");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

