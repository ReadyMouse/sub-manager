import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a new wallet for the payment processor
 * This wallet will be used to call processPayment() on the smart contract
 */
async function generateProcessorWallet() {
  console.log('🔐 Generating New Processor Wallet...\n');

  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log('✅ New Wallet Generated!');
  console.log('\n📋 IMPORTANT - Save These Securely:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Address:      ${wallet.address}`);
  console.log(`Private Key:  ${wallet.privateKey}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📝 Next Steps:\n');
  console.log('1. Fund this address with Sepolia ETH for gas fees');
  console.log('   → Get free Sepolia ETH: https://sepoliafaucet.com/');
  console.log(`   → Send to: ${wallet.address}`);
  console.log('   → Recommended: 0.1 ETH (enough for ~1000+ transactions)\n');
  
  console.log('2. Update your .env files:');
  console.log(`   PROCESSOR_PRIVATE_KEY=${wallet.privateKey}\n`);
  
  console.log('3. Update Railway environment variables:');
  console.log(`   Variable: PROCESSOR_PRIVATE_KEY`);
  console.log(`   Value: ${wallet.privateKey}\n`);
  
  console.log('4. (Optional) Grant this wallet any necessary permissions on the contract');
  console.log(`   Address: ${wallet.address}\n`);

  console.log('⚠️  SECURITY NOTES:');
  console.log('   • Never commit this private key to git');
  console.log('   • Only fund with what you need for gas fees');
  console.log('   • This wallet only needs ETH for gas, not PYUSD');
  console.log('   • Keep backups of the private key in a secure location');
  console.log('   • Rotate this key periodically for security\n');

  // Optionally save to a secure file (DO NOT COMMIT THIS)
  const outputPath = path.join(__dirname, '..', 'processor-wallet.txt');
  const output = `
PROCESSOR WALLET CREDENTIALS
Generated: ${new Date().toISOString()}

Address:     ${wallet.address}
Private Key: ${wallet.privateKey}

⚠️  DELETE THIS FILE AFTER SECURELY STORING THE CREDENTIALS
⚠️  NEVER COMMIT THIS FILE TO GIT
`;

  fs.writeFileSync(outputPath, output);
  console.log(`💾 Credentials saved to: ${outputPath}`);
  console.log('   ⚠️  DELETE this file after copying the credentials!\n');
}

generateProcessorWallet().catch(console.error);

