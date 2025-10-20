import { ethers } from "hardhat";

async function main() {
  const YOUR_ADDRESS = "0xbA2994967b75c22DBF9833fFD0A749BD66e7F0F3";
  
  console.log("🔍 Token Balance Checker\n");
  console.log("Checking address:", YOUR_ADDRESS);
  console.log("");
  
  // Ask user to paste their token address
  const tokenAddress = process.env.TOKEN_ADDRESS;
  
  if (!tokenAddress) {
    console.log("❌ Please provide token address:");
    console.log("   TOKEN_ADDRESS=0xYourTokenAddress npx hardhat run scripts/check-custom-token.ts --network sepolia");
    process.exit(1);
  }
  
  console.log("Token contract:", tokenAddress);
  console.log("");
  
  try {
    // Check if contract exists
    const code = await ethers.provider.getCode(tokenAddress);
    if (code === "0x") {
      console.log("❌ No contract found at this address!");
      process.exit(1);
    }
    
    // Try to read token info
    const TokenContract = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      tokenAddress
    );
    
    const balance = await TokenContract.balanceOf(YOUR_ADDRESS);
    console.log("✅ Raw Balance:", balance.toString());
    
    // Try different decimal places
    console.log("Formatted with 6 decimals:", ethers.formatUnits(balance, 6));
    console.log("Formatted with 18 decimals:", ethers.formatUnits(balance, 18));
    
    // Try to get token details (might fail if not a standard ERC20)
    try {
      const TokenWithMetadata = await ethers.getContractAt(
        "contracts/Interfaces.sol:IERC20Metadata",
        tokenAddress
      );
      const name = await TokenWithMetadata.name();
      const symbol = await TokenWithMetadata.symbol();
      const decimals = await TokenWithMetadata.decimals();
      console.log("");
      console.log("Token Name:", name);
      console.log("Token Symbol:", symbol);
      console.log("Token Decimals:", decimals);
      console.log("Your Balance:", ethers.formatUnits(balance, decimals), symbol);
    } catch (e) {
      console.log("");
      console.log("⚠️  Could not read token metadata (name, symbol, decimals)");
    }
    
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

