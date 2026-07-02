const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting JavaScript seed run...');

  // Clean database collections
  await prisma.notification.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.promoCode.deleteMany({});
  await prisma.ride.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driverDocument.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash('password123', salt);

  console.log('Seeding Users...');

  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@uberclone.com',
      passwordHash: hashPassword,
      name: 'Alexander Pierce (Admin)',
      phone: '1111111111',
      role: 'ADMIN',
    },
  });
  await prisma.profile.create({
    data: {
      userId: admin.id,
      referralCode: 'REF-ADMIN',
    },
  });

  // 2. Riders
  const rider1 = await prisma.user.create({
    data: {
      email: 'rider.jane@uberclone.com',
      passwordHash: hashPassword,
      name: 'Jane Doe (Rider)',
      phone: '2222222222',
      role: 'USER',
      rating: 4.8,
    },
  });
  await prisma.profile.create({
    data: {
      userId: rider1.id,
      walletBalance: 250.0,
      referralCode: 'REF-JANE',
    },
  });

  const rider2 = await prisma.user.create({
    data: {
      email: 'rider.bob@uberclone.com',
      passwordHash: hashPassword,
      name: 'Bob Smith (Rider)',
      phone: '3333333333',
      role: 'USER',
      rating: 4.6,
    },
  });
  await prisma.profile.create({
    data: {
      userId: rider2.id,
      walletBalance: 75.5,
      referralCode: 'REF-BOB',
    },
  });

  // 3. Drivers
  const driver1 = await prisma.user.create({
    data: {
      email: 'driver.mike@uberclone.com',
      passwordHash: hashPassword,
      name: 'Michael Hudson (Driver)',
      phone: '4444444444',
      role: 'DRIVER',
      rating: 4.9,
    },
  });
  const driver1Profile = await prisma.profile.create({
    data: {
      userId: driver1.id,
      walletBalance: 120.0,
      referralCode: 'REF-MIKE',
      documentStatus: 'APPROVED',
    },
  });

  await prisma.driverDocument.createMany({
    data: [
      {
        profileId: driver1Profile.id,
        type: 'LICENSE',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v12345/mock_license.png',
        status: 'APPROVED',
        verifiedAt: new Date(),
      },
      {
        profileId: driver1Profile.id,
        type: 'INSURANCE',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v12345/mock_insurance.png',
        status: 'APPROVED',
        verifiedAt: new Date(),
      },
    ],
  });

  await prisma.vehicle.create({
    data: {
      profileId: driver1Profile.id,
      make: 'Tesla',
      model: 'Model Y',
      year: 2024,
      licensePlate: 'TS-77-UBR',
      color: 'Midnight Cherry Red',
      category: 'PREMIUM',
      isActive: true,
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      email: 'driver.sam@uberclone.com',
      passwordHash: hashPassword,
      name: 'Sam Carter (Driver)',
      phone: '5555555555',
      role: 'DRIVER',
      rating: 4.7,
    },
  });
  const driver2Profile = await prisma.profile.create({
    data: {
      userId: driver2.id,
      walletBalance: 0.0,
      referralCode: 'REF-SAM',
      documentStatus: 'APPROVED',
    },
  });

  await prisma.driverDocument.createMany({
    data: [
      {
        profileId: driver2Profile.id,
        type: 'LICENSE',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v12345/mock_license.png',
        status: 'APPROVED',
        verifiedAt: new Date(),
      },
      {
        profileId: driver2Profile.id,
        type: 'INSURANCE',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v12345/mock_insurance.png',
        status: 'APPROVED',
        verifiedAt: new Date(),
      },
    ],
  });

  await prisma.vehicle.create({
    data: {
      profileId: driver2Profile.id,
      make: 'Toyota',
      model: 'Prius Hybrid',
      year: 2022,
      licensePlate: 'TY-44-UBR',
      color: 'Obsidian Black',
      category: 'STANDARD',
      isActive: true,
    },
  });

  console.log('Seeding Promo Codes...');
  
  await prisma.promoCode.createMany({
    data: [
      {
        code: 'WELCOME50',
        discountPercent: 50,
        maxDiscount: 15.00,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'CYBERRIDE',
        discountPercent: 20,
        maxDiscount: 10.00,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'SUPERSURGE',
        discountPercent: 100,
        maxDiscount: 5.00,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ],
  });

  console.log('Seeding Support Tickets...');

  await prisma.supportTicket.create({
    data: {
      userId: rider1.id,
      subject: 'Wallet Recharge Issue',
      message: 'My card was charged by Stripe but my wallet balance did not update. Please review.',
      status: 'OPEN',
    },
  });

  console.log('Seeding completed successfully! 🚀');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
