import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { FileRecord } from '../models/File';
import { AuditLog } from '../models/AuditLog';
import { AuthService } from '../services/auth/authService';

export async function resetAndSeedUsers() {
  console.log('>>> [SEED] Connecting to database to configure 3 primary accounts...');
  await connectDatabase();

  console.log('>>> [SEED] Removing unwanted legacy and test accounts...');
  await User.deleteMany({});
  await FileRecord.deleteMany({});
  await AuditLog.deleteMany({});

  console.log('>>> [SEED] Registering Account 1: laksh@gmail.com (Sender)...');
  const user1 = await AuthService.register({
    name: 'Laksh Suthar',
    email: 'laksh@gmail.com',
    password: 'Password123!',
    role: 'USER'
  });
  console.log(`✓ Created Laksh (ID: ${user1.user.id}, Public Key generated)`);

  console.log('>>> [SEED] Registering Account 2: paritosh@gmail.com (Receiver)...');
  const user2 = await AuthService.register({
    name: 'Paritosh Nilmani',
    email: 'paritosh@gmail.com',
    password: 'Password123!',
    role: 'USER'
  });
  console.log(`✓ Created Paritosh (ID: ${user2.user.id}, Public Key generated)`);

  console.log('>>> [SEED] Registering Account 3: admin@gmail.com (Admin)...');
  const user3 = await AuthService.register({
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: 'Password123!',
    role: 'ADMIN'
  });
  console.log(`✓ Created Admin (ID: ${user3.user.id}, Public Key generated)`);

  console.log('\n======================================================');
  console.log('✅ DATABASE SUCCESSFULLY RESET WITH EXACTLY 3 ACCOUNTS:');
  console.log('1. laksh@gmail.com     | Password123! | Role: USER');
  console.log('2. paritosh@gmail.com  | Password123! | Role: USER');
  console.log('3. admin@gmail.com     | Password123! | Role: ADMIN');
  console.log('======================================================\n');
}

if (require.main === module) {
  resetAndSeedUsers()
    .then(() => disconnectDatabase())
    .catch((err) => {
      console.error('Error seeding users:', err);
      process.exit(1);
    });
}
