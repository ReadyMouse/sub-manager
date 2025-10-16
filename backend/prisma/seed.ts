import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const passwordHash = await bcrypt.hash('password123', 12);

  // Create a landlord user
  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@example.com' },
    update: {},
    create: {
      email: 'landlord@example.com',
      passwordHash,
      displayName: 'John Landlord',
      firstName: 'John',
      lastName: 'Landlord',
      userType: 'REGULAR',
      emailVerified: true,
      isActive: true,
      preferences: {
        create: {
          emailNotifications: true,
          paymentReminders: true,
        },
      },
    },
  });

  // Add payment address for landlord
  await prisma.paymentAddress.upsert({
    where: {
      userId_address_currency: {
        userId: landlord.id,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        currency: 'PYUSD',
      },
    },
    update: {},
    create: {
      userId: landlord.id,
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      currency: 'PYUSD',
      label: 'PayPal PYUSD Address',
      addressType: 'CUSTODIAL',
      isDefault: true,
      isVerified: true,
    },
  });

  // Create a tenant user
  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@example.com' },
    update: {},
    create: {
      email: 'tenant@example.com',
      passwordHash,
      displayName: 'Alice Tenant',
      firstName: 'Alice',
      lastName: 'Tenant',
      userType: 'REGULAR',
      emailVerified: true,
      isActive: true,
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      walletConnectedAt: new Date(),
      preferences: {
        create: {
          emailNotifications: true,
          paymentReminders: true,
        },
      },
    },
  });

  // Create an admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      displayName: 'Admin User',
      userType: 'ADMIN',
      emailVerified: true,
      isActive: true,
      preferences: {
        create: {
          emailNotifications: true,
          paymentReminders: false,
        },
      },
    },
  });

  console.log('✅ Seed completed!');
  console.log('\nTest Users Created:');
  console.log('-------------------');
  console.log(`Landlord: ${landlord.email} (ID: ${landlord.id})`);
  console.log(`Tenant: ${tenant.email} (ID: ${tenant.id})`);
  console.log(`Admin: ${admin.email} (ID: ${admin.id})`);
  console.log('\nPassword for all: password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

