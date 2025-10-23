const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        isSuspended: true,
        createdAt: true,
        connectedWallets: true,
      }
    });
    
    console.log('Users in database:\n');
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email || '(no email)'}`);
      console.log(`   Display Name: ${user.displayName}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Wallets: ${user.connectedWallets.length}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

