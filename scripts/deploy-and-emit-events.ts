/**
 * Deploy contract and emit test events for Envio indexer
 * This is a simplified version for local testing that doesn't require PYUSD
 * 
 * Run with: npx hardhat run scripts/deploy-and-emit-events.ts --network localhost
 */

import { ethers } from 'hardhat';
import { PrismaClient } from '../backend/node_modules/@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load backend environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env.local') });
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const prisma = new PrismaClient();

// Helper function to convert UUID to uint256
function uuidToUint256(uuid: string): bigint {
  // Remove dashes and take first 64 characters (32 bytes)
  const hex = uuid.replace(/-/g, '').substring(0, 64);
  return BigInt('0x' + hex);
}

interface DeploymentInfo {
  contractAddress: string;
  pyusdAddress: string;
  chainId: number;
  deployer: string;
}

async function deployContract(): Promise<DeploymentInfo> {
  console.log('📦 Deploying contracts...');
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Chain ID: ${network.chainId}`);
  
  // First, deploy MockPYUSD token for local testing
  console.log(`   Deploying MockPYUSD token...`);
  const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
  const pyusdToken = await MockPYUSD.deploy();
  await pyusdToken.waitForDeployment();
  const pyusdAddress = await pyusdToken.getAddress();
  console.log(`   ✅ MockPYUSD deployed to: ${pyusdAddress}`);
  
  // Deploy the StableRentSubscription contract
  console.log(`   Deploying StableRentSubscription...`);
  const StableRentSubscription = await ethers.getContractFactory('StableRentSubscription');
  
  // Constructor needs: (initialOwner, _pyusdTokenAddress)
  const contract = await StableRentSubscription.deploy(deployer.address, pyusdAddress);
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  
  console.log(`   ✅ Contract deployed to: ${contractAddress}`);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    pyusdAddress,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };
  
  const deploymentsDir = path.join(process.cwd(), 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, 'localhost.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`   ✅ Deployment info saved to: deployments/localhost.json`);
  
  return {
    contractAddress,
    pyusdAddress,
    chainId: Number(network.chainId),
    deployer: deployer.address
  };
}

async function emitTestEvents(contractAddress: string, pyusdAddress: string) {
  console.log('\n🎭 Emitting test SubscriptionCreated events...');
  
  // Get subscriptions from database
  const subscriptions = await prisma.subscription.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`   Found ${subscriptions.length} subscriptions in database`);
  
  if (subscriptions.length === 0) {
    console.log('   ⚠️  No subscriptions found. Run generate-fake-subscriptions.ts first.');
    return;
  }
  
  const contract = await ethers.getContractAt('StableRentSubscription', contractAddress);
  const pyusdToken = await ethers.getContractAt('MockPYUSD', pyusdAddress);
  const [deployer] = await ethers.getSigners();
  
  // Mint PYUSD to deployer and approve contract
  console.log(`   💰 Minting test PYUSD tokens...`);
  const mintAmount = ethers.parseUnits('1000000', 6); // 1 million PYUSD
  await pyusdToken.mint(deployer.address, mintAmount);
  await pyusdToken.approve(contractAddress, ethers.MaxUint256);
  console.log(`   ✅ Minted and approved PYUSD for deployer`);
  
  let eventsEmitted = 0;
  
  for (const sub of subscriptions) {
    try {
      console.log(`\n   📝 Processing: ${sub.serviceName} (DB ID: ${sub.id})`);
      
      // Database already stores amounts in base units (multiplied by 10^6)
      // So we just convert to BigInt, no need to use parseUnits
      const amountInUnits = BigInt(sub.amount);
      const processorFeeInUnits = sub.processorFee ? BigInt(sub.processorFee) : 0n;
      
      // Get payment address
      const paymentAddress = await prisma.paymentAddress.findFirst({
        where: { userId: sub.recipientId }
      });
      
      if (!paymentAddress) {
        console.log(`      ⚠️  No payment address found for recipient ${sub.recipientId}`);
        continue;
      }
      
      // Calculate nextPaymentDue and endDate as Unix timestamps
      // Use the latest block timestamp instead of Date.now() to avoid "start date in the past" errors
      const latestBlock = await ethers.provider.getBlock('latest');
      const blockTimestamp = latestBlock ? Number(latestBlock.timestamp) : Math.floor(Date.now() / 1000);
      const startDate = blockTimestamp + 120; // Add 120 seconds buffer
      const nextPaymentDue = startDate + sub.interval;
      const endDate = sub.endDate && sub.endDate.getTime() > Date.now() ? Math.floor(sub.endDate.getTime() / 1000) : 0;
      
      console.log(`      Amount: ${sub.amount} PYUSD (${amountInUnits} units)`);
      console.log(`      Interval: ${sub.interval} seconds`);
      console.log(`      Recipient: ${paymentAddress.address}`);
      
      // Convert UUIDs to uint256
      const senderIdUint = uuidToUint256(sub.senderId);
      const recipientIdUint = uuidToUint256(sub.recipientId);
      const processorFeeIDUint = sub.processorFeeID ? uuidToUint256(sub.processorFeeID.toString()) : 1n;
      
      // Create subscription on-chain (this will emit SubscriptionCreated event)
      const tx = await contract.createSubscription(
        senderIdUint,
        recipientIdUint,
        amountInUnits,
        sub.interval,
        sub.serviceName,
        startDate,
        endDate,
        sub.maxPayments || 0,
        paymentAddress.address,
        sub.senderCurrency || 'PYUSD',
        sub.recipientCurrency || 'PYUSD',
        processorFeeInUnits,
        sub.processorFeeAddress || deployer.address,
        sub.processorFeeCurrency || 'PYUSD',
        processorFeeIDUint
      );
      
      const receipt = await tx.wait();
      
      console.log(`      ✅ Event emitted! Block: ${receipt?.blockNumber}, TxHash: ${receipt?.hash}`);
      eventsEmitted++;
      
    } catch (error: any) {
      console.log(`      ❌ Failed: ${error.message}`);
      // Continue with next subscription
    }
  }
  
  console.log(`\n   ✅ Successfully emitted ${eventsEmitted} events out of ${subscriptions.length} subscriptions`);
}

async function updateEnvioConfig(contractAddress: string) {
  console.log('\n⚙️  Updating Envio local config...');
  
  const configPath = path.join(process.cwd(), 'envio/config.local.yaml');
  
  if (!fs.existsSync(configPath)) {
    console.log('   ⚠️  config.local.yaml not found, skipping config update');
    return;
  }
  
  let config = fs.readFileSync(configPath, 'utf-8');
  
  // Update the contract address in the config
  config = config.replace(
    /address:\s*\n\s*-\s*0x[a-fA-F0-9]{40}/,
    `address:\n    - ${contractAddress}`
  );
  
  fs.writeFileSync(configPath, config);
  
  console.log(`   ✅ Updated config.local.yaml with contract address: ${contractAddress}`);
}

async function main() {
  console.log('🚀 Deploying contract and emitting events for Envio testing\n');
  
  try {
    // Deploy contract
    const { contractAddress, pyusdAddress, chainId } = await deployContract();
    
    // Emit test events
    await emitTestEvents(contractAddress, pyusdAddress);
    
    // Update Envio config
    await updateEnvioConfig(contractAddress);
    
    console.log('\n✅ DEPLOYMENT AND EVENT EMISSION COMPLETE!\n');
    console.log('📋 SUMMARY:');
    console.log(`   Contract Address: ${contractAddress}`);
    console.log(`   Chain ID: ${chainId}`);
    console.log(`   Network: Hardhat Local`);
    console.log('\n🔍 NEXT STEPS:');
    console.log('   1. Envio should now index the events');
    console.log('   2. Check Envio logs for event processing');
    console.log('   3. Query GraphQL: http://localhost:8080/v1/graphql');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

