/**
 * Check subscriptions in production database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

(async () => {
  try {
    console.log('\n📋 Checking Production Subscriptions\n');
    
    // Get all subscriptions
    const subscriptions = await prisma.subscription.findMany({
      include: {
        sender: {
          select: {
            displayName: true,
            email: true,
          }
        },
        recipient: {
          select: {
            displayName: true,
            email: true,
          }
        }
      }
    });
    
    console.log(`Found ${subscriptions.length} subscription(s):\n`);
    
    subscriptions.forEach((sub, i) => {
      console.log(`${i + 1}. ${sub.serviceName}`);
      console.log(`   Subscription ID: ${sub.id}`);
      console.log(`   On-Chain ID: ${sub.onChainId}`);
      console.log(`   Chain ID: ${sub.chainId}`);
      console.log(`   Sender Wallet: ${sub.senderWalletAddress || 'N/A'}`);
      console.log(`   Recipient Wallet: ${sub.recipientWalletAddress || 'N/A'}`);
      console.log(`   Amount: ${sub.amount}`);
      console.log(`   Active: ${sub.isActive}`);
      console.log(`   Created: ${sub.createdAt}`);
      console.log('');
    });
    
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        connectedWallets: true,
      }
    });
    
    console.log(`\nUsers (${users.length}):\n`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.displayName} (${user.email || 'wallet-only'})`);
      console.log(`   User ID: ${user.id}`);
      user.connectedWallets.forEach(w => {
        console.log(`   - Wallet: ${w.walletAddress}`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

