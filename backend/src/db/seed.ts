import { db } from './index';
import { users } from './models/users';

async function seed() {
  // Only seed in development
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Skipping seed data in production');
    return;
  }

  console.log('🌱 Seeding development data...');

  try {
    // Insert test users (ignore if they already exist)
    await db.insert(users).values([
      {
        username: 'member',
        email: 'member@algolounge.com',
        passwordHash: '$2b$10$BXJ841nJrZPtunPwfP.z2uu0arJvQu9NNcvMwcWR//D9.KGtXmzGe',
        roleId: 2,
      },
      {
        username: 'admin',
        email: 'admin@algolounge.com',
        passwordHash: '$2b$10$BDUcC5hgX7az0OdW/sZQnuGji24BM7r5MZ1WkiF5S2lUEO6YkZgJu',
        roleId: 1,
      },
    ]).onConflictDoNothing();

    console.log('✅ Development users seeded:');
    console.log('   - member@algolounge.com / algolounge123');
    console.log('   - admin@algolounge.com / algolounge123');
  } catch (error: any) {
    // If it's a unique constraint error, just log that they already exist
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.log('ℹ️  Development users already exist');
    } else {
      throw error;
    }
  }
}

seed()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
