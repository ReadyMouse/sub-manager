/**
 * This script checks what wallet is registered in your PRODUCTION database
 * 
 * Usage:
 * 1. Get your production DATABASE_URL from Railway
 * 2. Run: DATABASE_URL="your-production-url" node check-production-wallet.js
 */

const { PrismaClient } = require('@prisma/client');

// Use production DATABASE_URL from environment variable
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

(async () => {
  try {
    console.log('\n🔍 Checking Production Database\n');
    console.log('Database URL:', process.env.DATABASE_URL ? '✓ Connected' : '✗ Not provided');
    
    if (!process.env.DATABASE_URL) {
      console.error('\n❌ Error: DATABASE_URL environment variable not set');
      console.log('\nUsage:');
      console.log('  DATABASE_URL="postgresql://..." node check-production-wallet.js\n');
      process.exit(1);
    }
    
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        createdAt: true,
      }
    });
    
    console.log(`\nFound ${users.length} user(s):\n`);
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email || '(wallet-only account)'}`);
      console.log(`   Display Name: ${user.displayName}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Check wallets
    const wallets = await prisma.connectedWallet.findMany({
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
          }
        }
      }
    });
    
    console.log(`\nFound ${wallets.length} wallet(s):\n`);
    
    wallets.forEach((wallet, i) => {
      console.log(`${i + 1}. Wallet: ${wallet.walletAddress}`);
      console.log(`   User: ${wallet.user.displayName || '(no name)'}`);
      console.log(`   Email: ${wallet.user.email || '(no email)'}`);
      console.log(`   Is Primary: ${wallet.isPrimary}`);
      console.log(`   Is Active: ${wallet.isActive}`);
      console.log(`   Label: ${wallet.label || '(no label)'}`);
      console.log('');
    });
    
    // Show comparison with known wallets
    console.log('\n📋 Wallet Comparison:\n');
    console.log('Known wallets from your DEMO.md:');
    console.log('  Sender:   0xe193e3d8f2F50fB451A3990c18e7A78E095121e5');
    console.log('  Receiver: 0xe4DDC07abb37Cf651f0c99fCbAf31F3D18a53fa0');
    console.log('  Deployer: 0xbA2994967b75c22DBF9833fFD0A749BD66e7F0F3');
    
    if (wallets.length > 0) {
      const registeredWallet = wallets[0].walletAddress.toLowerCase();
      const sender = '0xe193e3d8f2F50fB451A3990c18e7A78E095121e5'.toLowerCase();
      const receiver = '0xe4DDC07abb37Cf651f0c99fCbAf31F3D18a53fa0'.toLowerCase();
      const deployer = '0xbA2994967b75c22DBF9833fFD0A749BD66e7F0F3'.toLowerCase();
      
      console.log('\n✅ Registered wallet in production:');
      console.log(`  ${wallets[0].walletAddress}`);
      
      if (registeredWallet === sender) {
        console.log('\n  ✅ This is your SENDER wallet (the one that created the subscription)');
      } else if (registeredWallet === receiver) {
        console.log('\n  ✅ This is your RECEIVER wallet');
      } else if (registeredWallet === deployer) {
        console.log('\n  ✅ This is your DEPLOYER wallet');
      } else {
        console.log('\n  ⚠️  This is a different wallet');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('ENOTFOUND') || error.message.includes('connect')) {
      console.log('\nCould not connect to database. Please check your DATABASE_URL.');
    }
  } finally {
    await prisma.$disconnect();
  }
})();

