const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Checking registered wallets...\n');
    
    const wallets = await prisma.connectedWallet.findMany({
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
            isActive: true,
            isSuspended: true,
          }
        }
      }
    });
    
    console.log(`Found ${wallets.length} wallet(s):\n`);
    
    wallets.forEach((wallet, i) => {
      console.log(`${i + 1}. Wallet Address: ${wallet.walletAddress}`);
      console.log(`   User: ${wallet.user.displayName || '(no name)'}`);
      console.log(`   Email: ${wallet.user.email || '(no email)'}`);
      console.log(`   Active: ${wallet.isActive}`);
      console.log(`   User Active: ${wallet.user.isActive}`);
      console.log(`   User Suspended: ${wallet.user.isSuspended}`);
      console.log('');
    });
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        email: true,
        isActive: true,
      }
    });
    
    console.log(`\nTotal users in database: ${users.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

