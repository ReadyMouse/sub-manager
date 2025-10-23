const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Links a wallet address to an existing user account
 * This is useful when you want to add wallet login to an existing email/password account
 */

const WALLET_ADDRESS = '0xe193e3d8f2F50fB451A3990c18e7A78E095121e5';
const USER_EMAIL = 'test@gmail.com';

(async () => {
  try {
    console.log('\n🔗 Linking Wallet to Account\n');
    console.log(`Wallet: ${WALLET_ADDRESS}`);
    console.log(`Account: ${USER_EMAIL}\n`);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: USER_EMAIL },
      include: { connectedWallets: true },
    });
    
    if (!user) {
      console.error(`❌ Error: User ${USER_EMAIL} not found`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.displayName} (ID: ${user.id})`);
    
    // Check if wallet already exists
    const existingWallet = await prisma.connectedWallet.findFirst({
      where: { walletAddress: WALLET_ADDRESS.toLowerCase() },
    });
    
    if (existingWallet) {
      console.error(`❌ Error: Wallet ${WALLET_ADDRESS} is already registered`);
      process.exit(1);
    }
    
    // Create wallet entry
    const wallet = await prisma.connectedWallet.create({
      data: {
        userId: user.id,
        walletAddress: WALLET_ADDRESS.toLowerCase(),
        label: 'Primary Wallet',
        isVerified: true,
        verificationSignature: 'manually-linked',
        verificationMessage: 'Manually linked via script',
        verifiedAt: new Date(),
        isPrimary: user.connectedWallets.length === 0, // Set as primary if it's the first wallet
        isActive: true,
      },
    });
    
    console.log(`\n✅ Wallet linked successfully!`);
    console.log(`   Wallet ID: ${wallet.id}`);
    console.log(`   Is Primary: ${wallet.isPrimary}`);
    
    // Set as primary wallet if it's the first one
    if (wallet.isPrimary && !user.primaryWalletId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { primaryWalletId: wallet.id },
      });
      console.log(`   Set as primary wallet for user`);
    }
    
    console.log(`\n🎉 Done! You can now log in with either:`);
    console.log(`   - Email: ${USER_EMAIL}`);
    console.log(`   - Wallet: ${WALLET_ADDRESS}\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
})();

