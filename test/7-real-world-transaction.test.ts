import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { StableRentSubscription, IERC20Metadata } from "../typechain-types";
import { PYUSD_WHALE, fundAccountWithPyusd } from "./helpers/setup";
import "dotenv/config";

/**
 * REAL WORLD TRANSACTION TEST
 * 
 * This test is designed to run on a forked mainnet using actual addresses
 * from your .env file. It simulates a complete rent payment flow:
 * 
 * 1. Renter creates a subscription to pay Landlord
 * 2. Processor processes the payment
 * 3. Funds flow: Renter -> Landlord (rent) + Processor (fee)
 * 
 * SETUP REQUIRED IN .env:
 * - RENTER_ADDRESS: The tenant's wallet address (will pay rent)
 * - LANDLORD_ADDRESS: The landlord's wallet address (receives rent)
 * - PROCESSOR_ADDRESS: The wallet that executes payment transactions (needs ETH for gas)
 * - PROCESSOR_FEE_ADDRESS: (Optional) The wallet that receives processor fees (gets PYUSD)
 *   If not set, defaults to PROCESSOR_ADDRESS
 * - MAINNET_RPC_URL: Your Alchemy/Infura RPC URL for Ethereum mainnet fork
 * 
 * NO PRIVATE KEYS NEEDED! 🎉
 * This test uses Hardhat's account impersonation feature, so you can test
 * with ANY address without needing their private keys. The test will:
 * - Fork mainnet to get real PYUSD balances
 * - Impersonate accounts to sign transactions
 * - Give accounts ETH for gas (all simulated locally)
 * 
 * IMPORTANT: The RENTER_ADDRESS should have PYUSD tokens on mainnet
 * (the fork will copy the real balance)
 * 
 * To run this test only:
 * npx hardhat test test/7-real-world-transaction.test.ts
 */

describe("🏠 Real World Transaction: Rent Payment Flow", function () {
  // Contract instances
  let stableRentContract: StableRentSubscription;
  let pyusdContract: IERC20Metadata;
  
  // Real addresses from .env
  let renterAddress: string;
  let landlordAddress: string;
  let processorAddress: string;        // Executes transactions (needs ETH for gas)
  let processorFeeAddress: string;     // Receives processor fees (gets PYUSD)
  
  // Signers (wallets that can sign transactions)
  let renterSigner: Signer;
  let processorSigner: Signer;
  
  // Contract address (deployed or existing)
  let contractAddress: string;
  
  // Real PYUSD contract on Ethereum mainnet
  const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";
  
  // Test parameters - adjust these to match your real scenario
  const MONTHLY_RENT = ethers.parseUnits("1", 6); // $1month in PYUSD (6 decimals)
  const PROCESSOR_FEE = ethers.parseUnits("0.50", 6); // $1.00 processor fee
  const ONE_MONTH = 30 * 24 * 60 * 60; // 30 days in seconds
  
  // Off-chain database IDs (can be any number for testing)
  const RENTER_ID = 1001;
  const LANDLORD_ID = 2001;
  const PROCESSOR_FEE_ID = 1;
  
  before(async function () {
    console.log("\n🚀 Setting up Real World Transaction Test...\n");
    
    // ========================================
    // LOAD ADDRESSES FROM .env
    // ========================================
    
    renterAddress = process.env.RENTER_ADDRESS!;
    landlordAddress = process.env.LANDLORD_ADDRESS!;
    processorAddress = process.env.PROCESSOR_ADDRESS!;
    
    // Processor fee address can be different from processor address
    // If not set, defaults to same as processor address
    processorFeeAddress = process.env.PROCESSOR_FEE_ADDRESS || processorAddress;
    
    // Validate all required addresses are set
    if (!renterAddress || !landlordAddress || !processorAddress) {
      throw new Error("❌ Missing addresses in .env file! Please set RENTER_ADDRESS, LANDLORD_ADDRESS, and PROCESSOR_ADDRESS");
    }
    
    console.log("📋 Real World Addresses:");
    console.log("  Renter:", renterAddress);
    console.log("  Landlord:", landlordAddress);
    console.log("  Processor (executes txs):", processorAddress);
    console.log("  Processor Fee Recipient:", processorFeeAddress, processorFeeAddress === processorAddress ? "(same as processor)" : "(different)");
    
    // ========================================
    // IMPERSONATE ACCOUNTS (No Private Keys Needed!)
    // ========================================
    
    console.log("\n🎭 Impersonating accounts (no private keys needed)...");
    
    // Impersonate the renter account - this allows us to send transactions as them
    await ethers.provider.send("hardhat_impersonateAccount", [renterAddress]);
    renterSigner = await ethers.getSigner(renterAddress);
    
    // Impersonate the processor account
    await ethers.provider.send("hardhat_impersonateAccount", [processorAddress]);
    processorSigner = await ethers.getSigner(processorAddress);
    
    console.log("  ✅ Renter account impersonated");
    console.log("  ✅ Processor account impersonated");
    
    // Give both accounts ETH for gas fees (since we're on a fork, this is free!)
    const [deployer] = await ethers.getSigners();
    await deployer.sendTransaction({
      to: renterAddress,
      value: ethers.parseEther("1.0") // Send 1 ETH for gas
    });
    await deployer.sendTransaction({
      to: processorAddress,
      value: ethers.parseEther("1.0") // Send 1 ETH for gas
    });
    console.log("  ✅ Sent 1 ETH to renter for gas fees");
    console.log("  ✅ Sent 1 ETH to processor for gas fees");
    
    // ========================================
    // CONNECT TO PYUSD CONTRACT
    // ========================================
    
    pyusdContract = await ethers.getContractAt("IERC20Metadata", PYUSD_ADDRESS);
    console.log("\n💰 Connected to PYUSD:", PYUSD_ADDRESS);
    
    // Check renter's PYUSD balance
    let renterBalance = await pyusdContract.balanceOf(renterAddress);
    console.log("  Renter PYUSD balance:", ethers.formatUnits(renterBalance, 6), "PYUSD");
    
    // If renter doesn't have enough PYUSD, we'll give them some on the fork
    const requiredAmount = (MONTHLY_RENT + PROCESSOR_FEE) * 12n; // 12 months worth
    
    if (renterBalance < requiredAmount) {
      console.log("\n💸 Renter needs more PYUSD. Funding account on fork...");
      console.log("  Required:", ethers.formatUnits(requiredAmount, 6), "PYUSD");
      console.log("  Using whale:", PYUSD_WHALE);
      
      // Fund the renter with PYUSD using the whale helper
      const transferAmount = ethers.parseUnits("10000", 6); // Give them $10,000 PYUSD
      await fundAccountWithPyusd(renterAddress, transferAmount);
      
      // Check new balance
      renterBalance = await pyusdContract.balanceOf(renterAddress);
      console.log("  ✅ Funded! New balance:", ethers.formatUnits(renterBalance, 6), "PYUSD");
    }
    
    // ========================================
    // DEPLOY OR CONNECT TO CONTRACT
    // ========================================
    
    // Check if contract address is in .env
    const existingContractAddress = process.env.STABLERENT_CONTRACT_ADDRESS;
    
    if (existingContractAddress) {
      // Connect to existing contract
      contractAddress = existingContractAddress;
      stableRentContract = await ethers.getContractAt("StableRentSubscription", contractAddress);
      console.log("\n📝 Connected to existing StableRentSubscription:", contractAddress);
    } else {
      // Deploy new contract
      const [deployer] = await ethers.getSigners();
      console.log("\n📝 Deploying new StableRentSubscription...");
      console.log("  Deployer:", deployer.address);
      
      const StableRentSubscription = await ethers.getContractFactory("StableRentSubscription");
      stableRentContract = await StableRentSubscription.deploy(deployer.address, PYUSD_ADDRESS);
      await stableRentContract.waitForDeployment();
      
      contractAddress = await stableRentContract.getAddress();
      console.log("  ✅ Deployed at:", contractAddress);
      console.log("\n💡 TIP: Add this to your .env file:");
      console.log(`  STABLERENT_CONTRACT_ADDRESS=${contractAddress}`);
    }
    
    // ========================================
    // CHECK APPROVALS
    // ========================================
    
    const currentAllowance = await pyusdContract.allowance(renterAddress, contractAddress);
    console.log("\n🔐 Current PYUSD allowance:", ethers.formatUnits(currentAllowance, 6), "PYUSD");
    
    const requiredAllowance = (MONTHLY_RENT + PROCESSOR_FEE) * 12n; // 12 months worth
    
    if (currentAllowance < requiredAllowance) {
      console.log("  ⚠️  Insufficient allowance. Approving contract...");
      
      const approveTx = await pyusdContract.connect(renterSigner).approve(
        contractAddress,
        requiredAllowance
      );
      await approveTx.wait();
      
      console.log("  ✅ Approved:", ethers.formatUnits(requiredAllowance, 6), "PYUSD");
    }
    
    console.log("\n✅ Setup complete!\n");
  });
  
  describe("📝 Create Subscription", function () {
    let subscriptionId: bigint;
    
    it("Should create a rent payment subscription", async function () {
      console.log("\n🏠 Creating monthly rent subscription...");
      console.log("  Amount: $" + ethers.formatUnits(MONTHLY_RENT, 6));
      console.log("  Interval: 30 days");
      console.log("  Processor Fee: $" + ethers.formatUnits(PROCESSOR_FEE, 6));
      
      // Create subscription
      const tx = await stableRentContract.connect(renterSigner).createSubscription(
        RENTER_ID,              // senderId
        LANDLORD_ID,            // recipientId
        MONTHLY_RENT,           // amount
        ONE_MONTH,              // interval (30 days)
        "Monthly Rent Payment", // serviceName
        0,                      // endDate (0 = unlimited)
        0,                      // maxPayments (0 = unlimited)
        landlordAddress,        // recipientAddress
        "PYUSD",               // senderCurrency
        "PYUSD",               // recipientCurrency
        PROCESSOR_FEE,         // processorFee
        processorFeeAddress,    // processorFeeAddress (where fees are sent)
        "PYUSD",               // processorFeeCurrency
        PROCESSOR_FEE_ID       // processorFeeID
      );
      
      const receipt = await tx.wait();
      
      // Get subscription ID from event
      const event = receipt?.logs.find(
        (log: any) => {
          try {
            const parsed = stableRentContract.interface.parseLog(log);
            return parsed?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        }
      );
      
      if (!event) {
        throw new Error("SubscriptionCreated event not found");
      }
      
      const parsedEvent = stableRentContract.interface.parseLog(event);
      subscriptionId = parsedEvent!.args[0];
      
      console.log("  ✅ Subscription created! ID:", subscriptionId.toString());
      
      // Verify subscription details
      const subscription = await stableRentContract.getSubscription(subscriptionId);
      
      expect(subscription.senderAddress.toLowerCase()).to.equal(renterAddress.toLowerCase());
      expect(subscription.recipientAddress.toLowerCase()).to.equal(landlordAddress.toLowerCase());
      expect(subscription.amount).to.equal(MONTHLY_RENT);
      expect(subscription.processorFee).to.equal(PROCESSOR_FEE);
      expect(subscription.processorFeeAddress.toLowerCase()).to.equal(processorFeeAddress.toLowerCase());
      expect(subscription.isActive).to.be.true;
      
      console.log("\n  📊 Subscription Details:");
      console.log("    Renter:", subscription.senderAddress);
      console.log("    Landlord:", subscription.recipientAddress);
      console.log("    Amount:", ethers.formatUnits(subscription.amount, 6), "PYUSD");
      console.log("    Interval:", subscription.interval.toString(), "seconds");
      console.log("    Next Payment Due:", new Date(Number(subscription.nextPaymentDue) * 1000).toLocaleString());
      console.log("    Status:", subscription.isActive ? "Active ✅" : "Inactive ❌");
    });
    
    it("Should be retrievable via getUserSubscriptions", async function () {
      const userSubs = await stableRentContract.getUserSubscriptions(renterAddress);
      
      expect(userSubs.length).to.be.greaterThan(0);
      console.log("\n  📋 Renter has", userSubs.length.toString(), "subscription(s)");
    });
  });
  
  describe("💳 Process Payment", function () {
    let subscriptionId: bigint;
    
    before(async function () {
      // Get the latest subscription for this renter
      const userSubs = await stableRentContract.getUserSubscriptions(renterAddress);
      subscriptionId = userSubs[userSubs.length - 1];
    });
    
    it("Should wait until payment is due", async function () {
      const subscription = await stableRentContract.getSubscription(subscriptionId);
      const nextPaymentDue = subscription.nextPaymentDue;
      
      // Get current blockchain time (not JavaScript time!)
      const latestBlock = await ethers.provider.getBlock("latest");
      const currentTime = BigInt(latestBlock!.timestamp);
      
      console.log("\n⏰ Current blockchain time:", currentTime.toString());
      console.log("  Payment due at:", nextPaymentDue.toString());
      
      if (currentTime < nextPaymentDue) {
        const timeUntilDue = nextPaymentDue - currentTime;
        console.log("  Payment not due yet. Need to advance:", timeUntilDue.toString(), "seconds");
        console.log("  Due at:", new Date(Number(nextPaymentDue) * 1000).toLocaleString());
        
        // Fast-forward time in hardhat network
        console.log("  ⏩ Fast-forwarding time...");
        await ethers.provider.send("evm_increaseTime", [Number(timeUntilDue) + 1]);
        await ethers.provider.send("evm_mine", []);
        
        // Verify time has advanced
        const newBlock = await ethers.provider.getBlock("latest");
        console.log("  ✅ Time advanced to:", newBlock!.timestamp.toString());
      } else {
        console.log("  ✅ Payment is already due!");
      }
    });
    
    it("Should show subscription in getPaymentsDue", async function () {
      const duePayments = await stableRentContract.getPaymentsDue();
      
      console.log("\n  📊 Payments Due:", duePayments.length.toString());
      
      const isDue = duePayments.some(id => id === subscriptionId);
      expect(isDue).to.be.true;
      
      console.log("  ✅ Subscription", subscriptionId.toString(), "is in the due list");
    });
    
    it("Should process rent payment successfully", async function () {
      // Get balances before payment
      const renterBalanceBefore = await pyusdContract.balanceOf(renterAddress);
      const landlordBalanceBefore = await pyusdContract.balanceOf(landlordAddress);
      const processorFeeBalanceBefore = await pyusdContract.balanceOf(processorFeeAddress);
      
      console.log("\n  💰 Balances Before Payment:");
      console.log("    Renter:", ethers.formatUnits(renterBalanceBefore, 6), "PYUSD");
      console.log("    Landlord:", ethers.formatUnits(landlordBalanceBefore, 6), "PYUSD");
      console.log("    Processor Fee Recipient:", ethers.formatUnits(processorFeeBalanceBefore, 6), "PYUSD");
      
      // Process payment (executed by processorAddress, but fee goes to processorFeeAddress)
      console.log("\n  🔄 Processing payment...");
      console.log("    Executed by:", processorAddress);
      console.log("    Fee will go to:", processorFeeAddress);
      const tx = await stableRentContract.connect(processorSigner).processPayment(subscriptionId);
      const receipt = await tx.wait();
      
      console.log("  ✅ Payment processed!");
      console.log("    Gas used:", receipt?.gasUsed.toString());
      
      // Get balances after payment
      const renterBalanceAfter = await pyusdContract.balanceOf(renterAddress);
      const landlordBalanceAfter = await pyusdContract.balanceOf(landlordAddress);
      const processorFeeBalanceAfter = await pyusdContract.balanceOf(processorFeeAddress);
      
      console.log("\n  💰 Balances After Payment:");
      console.log("    Renter:", ethers.formatUnits(renterBalanceAfter, 6), "PYUSD");
      console.log("    Landlord:", ethers.formatUnits(landlordBalanceAfter, 6), "PYUSD");
      console.log("    Processor Fee Recipient:", ethers.formatUnits(processorFeeBalanceAfter, 6), "PYUSD");
      
      // Verify amounts
      const renterPaid = renterBalanceBefore - renterBalanceAfter;
      const landlordReceived = landlordBalanceAfter - landlordBalanceBefore;
      const processorFeeReceived = processorFeeBalanceAfter - processorFeeBalanceBefore;
      
      console.log("\n  📊 Transaction Breakdown:");
      console.log("    Renter paid:", ethers.formatUnits(renterPaid, 6), "PYUSD");
      console.log("    Landlord received:", ethers.formatUnits(landlordReceived, 6), "PYUSD");
      console.log("    Processor fee received:", ethers.formatUnits(processorFeeReceived, 6), "PYUSD");
      
      expect(renterPaid).to.equal(MONTHLY_RENT + PROCESSOR_FEE);
      expect(landlordReceived).to.equal(MONTHLY_RENT);
      expect(processorFeeReceived).to.equal(PROCESSOR_FEE);
      
      // Verify subscription state
      const subscription = await stableRentContract.getSubscription(subscriptionId);
      expect(subscription.paymentCount).to.equal(1);
      expect(subscription.isActive).to.be.true;
      
      console.log("\n  ✅ All balances verified!");
      console.log("    Payment count:", subscription.paymentCount.toString());
    });
  });
  
  describe("❌ Cancel Subscription", function () {
    let subscriptionId: bigint;
    
    before(async function () {
      // Get the latest subscription for this renter
      const userSubs = await stableRentContract.getUserSubscriptions(renterAddress);
      subscriptionId = userSubs[userSubs.length - 1];
    });
    
    it("Should allow renter to cancel subscription", async function () {
      console.log("\n  🛑 Canceling subscription", subscriptionId.toString(), "...");
      
      const tx = await stableRentContract.connect(renterSigner).cancelSubscription(subscriptionId);
      await tx.wait();
      
      console.log("  ✅ Subscription cancelled!");
      
      // Verify cancellation
      const subscription = await stableRentContract.getSubscription(subscriptionId);
      expect(subscription.isActive).to.be.false;
      
      console.log("  📊 Status: Inactive ❌");
    });
    
    it("Should not appear in getPaymentsDue after cancellation", async function () {
      const duePayments = await stableRentContract.getPaymentsDue();
      
      const isDue = duePayments.some(id => id === subscriptionId);
      expect(isDue).to.be.false;
      
      console.log("\n  ✅ Subscription removed from due payments list");
    });
  });
  
  describe("📊 Summary", function () {
    it("Should display complete test summary", async function () {
      console.log("\n");
      console.log("╔════════════════════════════════════════════════════════════╗");
      console.log("║           REAL WORLD TRANSACTION TEST COMPLETE             ║");
      console.log("╚════════════════════════════════════════════════════════════╝");
      console.log("");
      console.log("✅ Successfully tested complete rent payment flow:");
      console.log("  1. Created subscription");
      console.log("  2. Processed payment (Renter → Landlord + Processor fee)");
      console.log("  3. Verified all balances");
      console.log("  4. Cancelled subscription");
      console.log("");
      console.log("💡 NEXT STEPS:");
      console.log("  - To run on real Sepolia testnet:");
      console.log("    1. Get Sepolia ETH from faucet");
      console.log("    2. Get Sepolia PYUSD (if available)");
      console.log("    3. Update hardhat.config.ts with sepolia network");
      console.log("    4. Deploy contract: npx hardhat run scripts/deploy.ts --network sepolia");
      console.log("    5. Run test: npx hardhat test --network sepolia");
      console.log("");
      console.log("  - To run on mainnet (CAUTION - REAL MONEY!):");
      console.log("    1. Ensure RENTER has real PYUSD tokens");
      console.log("    2. Update hardhat.config.ts with mainnet network");
      console.log("    3. Run test: npx hardhat test --network mainnet");
      console.log("");
      console.log("🔐 SECURITY REMINDERS:");
      console.log("  - Never commit .env file to git");
      console.log("  - Never share private keys");
      console.log("  - Always test on testnet first");
      console.log("  - Audit contract before mainnet deployment");
      console.log("");
    });
  });
});

