#!/usr/bin/env tsx

/**
 * ============================================================
 * BACK-PROPAGATION SCRIPT
 * ============================================================
 * 
 * PURPOSE:
 * Takes fake subscription data from the database and creates corresponding
 * blockchain events in Hardhat's simulated blockchain for Envio indexer testing
 * 
 * HOW TO RUN:
 * npx tsx scripts/back-propagate-to-blockchain.ts
 * 
 * WHAT IT DOES:
 * 1. Reads fake subscription events from JSON file
 * 2. Deploys/connects to StableRentSubscription contract
 * 3. Creates blockchain events by calling contract functions
 * 4. Generates payment events for existing subscriptions
 * 5. Tests Envio indexer with the created events
 */

import { ethers } from 'hardhat';
import { PrismaClient } from '../backend/node_modules/@prisma/client';
import fs from 'fs';
import path from 'path';

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  // Contract deployment (will use existing if available)
  contractAddress: null as string | null,
  
  // PYUSD token address (mainnet address for forking)
  pyusdAddress: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
  
  // Processor fee configuration
  processorFeePercent: 0.01, // 1%
  processorFeeAddress: '0x17A4bAf74aC19ab1254fc24D7DcED2ad7639451b',
  
  // Event generation settings
  generatePaymentEvents: true,
  paymentEventCount: { min: 1, max: 3 }, // Number of payment events per subscription
};

interface BlockchainEvent {
  subscriptionId: number;
  senderAddress: string;
  senderId: number;
  recipientId: number;
  amount: string;
  interval: number;
  nextPaymentDue: number;
  endDate: number;
  maxPayments: number;
  serviceName: string;
  recipientAddress: string;
  senderCurrency: string;
  recipientCurrency: string;
  processorFee: string;
  processorFeeAddress: string;
  processorFeeCurrency: string;
  processorFeeID: number;
  timestamp: number;
}

async function getOrDeployContract() {
  console.log('🔍 Checking for existing contract deployment...');
  
  // Check if contract is already deployed
  const deploymentFile = path.join(__dirname, '../deployments/localhost.json');
  if (fs.existsSync(deploymentFile)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    if (deployment.contracts?.StableRentSubscription) {
      CONFIG.contractAddress = deployment.contracts.StableRentSubscription;
      console.log(`   ✅ Found existing contract: ${CONFIG.contractAddress}`);
    }
  }
  
  if (!CONFIG.contractAddress) {
    console.log('📦 Deploying new contract...');
    
    const [deployer] = await ethers.getSigners();
    console.log(`   📝 Deploying with account: ${deployer.address}`);
    
    const StableRentSubscription = await ethers.getContractFactory('StableRentSubscription');
    const contract = await StableRentSubscription.deploy(
      deployer.address, // initialOwner
      CONFIG.pyusdAddress // PYUSD token address
    );
    
    await contract.waitForDeployment();
    CONFIG.contractAddress = await contract.getAddress();
    
    console.log(`   ✅ Contract deployed to: ${CONFIG.contractAddress}`);
    
    // Save deployment info
    const deploymentInfo = {
      network: 'localhost',
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      contracts: {
        StableRentSubscription: CONFIG.contractAddress,
        PYUSD: CONFIG.pyusdAddress
      },
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    };
    
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`   💾 Deployment info saved to: ${deploymentFile}`);
  }
  
  return await ethers.getContractAt('StableRentSubscription', CONFIG.contractAddress);
}

async function impersonatePYUSDWhale() {
  console.log('🐋 Setting up PYUSD for testing...');
  
  // For local testing without forking, we skip PYUSD whale impersonation
  // The contract doesn't actually need PYUSD since we're just emitting events
  console.log(`   ℹ️  Running on local Hardhat without forking - skipping PYUSD setup`);
  console.log(`   ℹ️  Contract will emit events without actual token transfers`);
  
  return { whaleSigner: null, pyusdContract: null };
}

async function distributePYUSDToTestAccounts(whaleSigner: any, pyusdContract: any, testAccounts: string[]) {
  // Skip PYUSD distribution for local testing
  console.log('💰 Skipping PYUSD distribution (local testing mode)...');
  console.log(`   ℹ️  ${testAccounts.length} test accounts ready`);
}

async function createSubscriptionEvents(contract: any, events: BlockchainEvent[]) {
  console.log('📋 Creating subscription events on blockchain...');
  
  const [deployer] = await ethers.getSigners();
  const testAccounts = [deployer.address];
  
  // Get unique sender addresses
  const uniqueSenders = [...new Set(events.map(e => e.senderAddress))];
  testAccounts.push(...uniqueSenders);
  
  // Setup PYUSD (skip for local testing)
  const { whaleSigner, pyusdContract } = await impersonatePYUSDWhale();
  await distributePYUSDToTestAccounts(whaleSigner, pyusdContract, testAccounts);
  
  // Skip PYUSD approval for local testing
  console.log('🔐 Skipping PYUSD approvals (local testing mode)...');
  console.log(`   ℹ️  Will use contract createSubscription without actual token transfers`);

  
  // Create subscription events
  for (const event of events) {
    try {
      const signer = await ethers.getSigner(event.senderAddress);
      
      // Calculate amounts
      const subscriptionAmount = BigInt(event.amount);
      const processorFee = BigInt(event.processorFee);
      
      console.log(`   📝 Creating subscription: ${event.serviceName} (ID: ${event.subscriptionId})`);
      
      // Create subscription (this will emit the SubscriptionCreated event)
      const tx = await contract.connect(signer).createSubscription(
        event.senderId,
        event.recipientId,
        subscriptionAmount,
        event.interval,
        event.serviceName,
        event.timestamp, // startDate
        event.endDate,
        event.maxPayments,
        event.recipientAddress,
        event.senderCurrency,
        event.recipientCurrency,
        processorFee,
        event.processorFeeAddress,
        event.processorFeeCurrency,
        event.processorFeeID
      );
      
      await tx.wait();
      console.log(`   ✅ Created subscription ${event.subscriptionId}: ${event.serviceName}`);
      
    } catch (error) {
      console.log(`   ❌ Failed to create subscription ${event.subscriptionId}: ${error.message}`);
    }
  }
}

async function createPaymentEvents(contract: any, events: BlockchainEvent[]) {
  if (!CONFIG.generatePaymentEvents) {
    console.log('⏭️  Skipping payment events generation...');
    return;
  }
  
  console.log('💰 Creating payment events on blockchain...');
  
  for (const event of events) {
    const paymentCount = Math.floor(Math.random() * (CONFIG.paymentEventCount.max - CONFIG.paymentEventCount.min + 1)) + CONFIG.paymentEventCount.min;
    
    for (let i = 0; i < paymentCount; i++) {
      try {
        // Process payment (anyone can call this function)
        const tx = await contract.processPayment(event.subscriptionId);
        await tx.wait();
        console.log(`   ✅ Processed payment ${i + 1}/${paymentCount} for subscription ${event.subscriptionId}`);
        
        // Wait a bit between payments to simulate real timing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Failed to process payment for subscription ${event.subscriptionId}: ${error.message}`);
        break; // Stop trying to process more payments for this subscription
      }
    }
  }
}

async function testEnvioIndexer() {
  console.log('🔍 Testing Envio indexer...');
  
  try {
    // Check if Envio is running
    const envioResponse = await fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            stableRentSubscription_SubscriptionCreateds(first: 5) {
              id
              subscriptionId
              serviceName
              amount
              senderAddress
              recipientAddress
            }
          }
        `
      })
    });
    
    if (envioResponse.ok) {
      const data = await envioResponse.json();
      console.log('   ✅ Envio indexer is running and responding');
      console.log(`   📊 Found ${data.data?.stableRentSubscription_SubscriptionCreateds?.length || 0} subscription events`);
    } else {
      console.log('   ⚠️  Envio indexer is not responding (this is normal if not started)');
    }
    
  } catch (error) {
    console.log('   ⚠️  Envio indexer is not running (this is normal if not started)');
  }
}

async function main() {
  console.log('🔄 Starting back-propagation to blockchain...\n');
  
  try {
    // Load fake subscription events
    const eventsFile = path.join(__dirname, '../fake-subscription-events.json');
    if (!fs.existsSync(eventsFile)) {
      throw new Error('Fake subscription events file not found. Run generate-fake-subscriptions.ts first.');
    }
    
    const events: BlockchainEvent[] = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
    console.log(`📋 Loaded ${events.length} fake subscription events\n`);
    
    // Get or deploy contract
    const contract = await getOrDeployContract();
    console.log('');
    
    // Create subscription events
    await createSubscriptionEvents(contract, events);
    console.log('');
    
    // Create payment events
    await createPaymentEvents(contract, events);
    console.log('');
    
    // Test Envio indexer
    await testEnvioIndexer();
    console.log('');
    
    // Summary
    console.log('🎉 Back-propagation complete!');
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   📋 Subscription Events: ${events.length}`);
    console.log(`   💰 Payment Events: ${events.length * CONFIG.paymentEventCount.max} (estimated)`);
    console.log(`   🔗 Contract Address: ${CONFIG.contractAddress}`);
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('   1. Start the Envio indexer: cd envio && npm run dev');
    console.log('   2. Check the Envio GraphQL endpoint: http://localhost:8080/graphql');
    console.log('   3. Test your frontend with the indexed data');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error during back-propagation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('✅ Back-propagation script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Back-propagation script failed:', error);
    process.exit(1);
  });
