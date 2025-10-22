import { ethers } from 'ethers';
import { env } from '../config/env';

/**
 * Setup script for Sepolia automation
 * 
 * This script helps verify your Sepolia configuration
 */
async function setupSepolia() {
  console.log('🔧 Setting up Sepolia Automation...\n');

  try {
    // Check environment variables
    console.log('1. Checking environment variables...');
    const requiredVars = {
      'CONTRACT_ADDRESS_SEPOLIA': env.CONTRACT_ADDRESS_SEPOLIA,
      'DEFAULT_CHAIN_ID': env.DEFAULT_CHAIN_ID,
      'SEPOLIA_RPC_URL': env.SEPOLIA_RPC_URL,
      'PROCESSOR_PRIVATE_KEY': env.PROCESSOR_PRIVATE_KEY ? '***configured***' : 'NOT SET'
    };

    console.log('   Environment Status:');
    Object.entries(requiredVars).forEach(([key, value]) => {
      const status = value && value !== 'NOT SET' ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${value}`);
    });

    // Test blockchain connection
    console.log('\n2. Testing blockchain connection...');
    if (env.SEPOLIA_RPC_URL) {
      try {
        const provider = new ethers.JsonRpcProvider(env.SEPOLIA_RPC_URL);
        const network = await provider.getNetwork();
        console.log(`   ✅ Connected to: ${network.name} (Chain ID: ${network.chainId})`);
        
        if (network.chainId !== 11155111n) {
          console.log('   ⚠️  Warning: Expected Sepolia (11155111), got different network');
        }
      } catch (error) {
        console.log(`   ❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('   ⚠️  SEPOLIA_RPC_URL not configured');
    }

    // Test contract deployment
    console.log('\n3. Testing contract deployment...');
    if (env.CONTRACT_ADDRESS_SEPOLIA && env.SEPOLIA_RPC_URL) {
      try {
        const provider = new ethers.JsonRpcProvider(env.SEPOLIA_RPC_URL);
        const code = await provider.getCode(env.CONTRACT_ADDRESS_SEPOLIA);
        
        if (code === '0x') {
          console.log('   ❌ Contract has no code - address might be wrong');
        } else {
          console.log('   ✅ Contract is deployed and has code');
          console.log(`   📍 Contract Address: ${env.CONTRACT_ADDRESS_SEPOLIA}`);
          console.log(`   🔗 Explorer: https://sepolia.etherscan.io/address/${env.CONTRACT_ADDRESS_SEPOLIA}`);
        }
      } catch (error) {
        console.log(`   ❌ Contract check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('   ⚠️  Missing CONTRACT_ADDRESS_SEPOLIA or SEPOLIA_RPC_URL');
    }

    // Test automation wallet
    console.log('\n4. Testing automation wallet...');
    if (env.PROCESSOR_PRIVATE_KEY) {
      try {
        const provider = new ethers.JsonRpcProvider(env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID');
        const wallet = new ethers.Wallet(env.PROCESSOR_PRIVATE_KEY, provider);
        const address = wallet.address;
        const balance = await provider.getBalance(address);
        
        console.log(`   ✅ Wallet Address: ${address}`);
        console.log(`   💰 Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (balance === 0n) {
          console.log('   ⚠️  Warning: Wallet has no ETH - fund it for gas fees');
          console.log('   💡 Get Sepolia ETH from: https://sepoliafaucet.com/');
        } else {
          console.log('   ✅ Wallet has sufficient ETH for gas');
        }
      } catch (error) {
        console.log(`   ❌ Wallet test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('   ⚠️  PROCESSOR_PRIVATE_KEY not configured');
    }

    // Summary
    console.log('\n📋 Setup Summary:');
    console.log('   Contract: StableRentSubscription');
    console.log('   Network: Sepolia Testnet');
    console.log('   Chain ID: 11155111');
    console.log('   PYUSD Token: 0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Set up your .env file with the required variables');
    console.log('   2. Get Sepolia ETH for your automation wallet');
    console.log('   3. Test with: npm run test:automation');
    console.log('   4. Start the backend: npm run dev');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupSepolia().then(() => {
  console.log('\n🏁 Setup check completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Setup crashed:', error);
  process.exit(1);
});
