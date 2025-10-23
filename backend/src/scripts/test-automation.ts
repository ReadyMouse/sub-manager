import { ethers } from 'ethers';
import { env } from '../config/env';
import AutomationService from '../services/automationService';

/**
 * Test script for automation service
 * 
 * This script helps test the automation service locally
 */
async function testAutomation() {
  console.log('🧪 Testing Automation Service...\n');

  try {
    // Initialize automation service
    const automationService = new AutomationService();

    // Test 1: Get due subscriptions
    console.log('1. Checking for due subscriptions...');
    const dueSubscriptions = await automationService.getDueSubscriptions();
    console.log(`   Found ${dueSubscriptions.length} subscriptions due for payment\n`);

    if (dueSubscriptions.length > 0) {
      console.log('   Due subscriptions:');
      dueSubscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. Subscription ${sub.id}`);
        console.log(`      Service: ${sub.serviceName}`);
        console.log(`      Amount: ${sub.amount} PYUSD`);
        console.log(`      Next Payment Due: ${sub.nextPaymentDue}`);
        console.log(`      Sender: ${sub.sender?.displayName || 'Wallet-only'} (${sub.senderWalletAddress})`);
        console.log(`      Recipient: ${sub.recipient?.displayName || 'Wallet-only'} (${sub.recipientWalletAddress})`);
        console.log('');
      });
    }

    // Test 2: Check environment variables
    console.log('2. Checking environment variables...');
    const requiredEnvVars = [
      'CONTRACT_ADDRESS_SEPOLIA',
      'PROCESSOR_PRIVATE_KEY',
      'SEPOLIA_RPC_URL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`   ⚠️  Missing environment variables: ${missingVars.join(', ')}`);
      console.log('   These are required for full automation functionality');
      console.log('   Please set these in your .env file\n');
    } else {
      console.log('   ✅ All required environment variables are set\n');
    }

    // Test 3: Test smart contract connection
    console.log('3. Testing smart contract connection...');
    try {
      if (!env.SEPOLIA_RPC_URL) {
        console.log('   ⚠️  SEPOLIA_RPC_URL not configured - skipping blockchain test');
      } else {
        const provider = new ethers.JsonRpcProvider(env.SEPOLIA_RPC_URL);
        const network = await provider.getNetwork();
        console.log(`   ✅ Connected to network: ${network.name} (${network.chainId})`);
        
        // Test contract address
        if (env.CONTRACT_ADDRESS_SEPOLIA) {
          const code = await provider.getCode(env.CONTRACT_ADDRESS_SEPOLIA);
          if (code === '0x') {
            console.log('   ⚠️  Contract address has no code (might be wrong address)');
          } else {
            console.log('   ✅ Contract address has code');
          }
        } else {
          console.log('   ⚠️  CONTRACT_ADDRESS_SEPOLIA not configured');
        }
      }
    } catch (error) {
      console.log(`   ❌ Failed to connect to blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n4. Testing automation service methods...');
    
    // Test getting status
    try {
      await automationService.getStatus();
      console.log('   ✅ Automation service status check passed');
    } catch (error) {
      console.log(`   ❌ Automation service status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n✅ Automation service test completed!');
    console.log('\nTo manually trigger payment processing, run:');
    console.log('curl -X POST http://localhost:3001/api/automation/trigger');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAutomation().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});
