import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const defaultUsers = [
  {
    username: 'admin',
    password: 'admin123',
    fullName: 'Administrator',
    role: 'admin',
    email: 'admin@mrpikipiki.com',
    phone: '+255 123 456 789',
    isActive: true
  },
  {
    username: 'shedrack',
    password: 'sales123',
    fullName: 'Shedrack',
    role: 'sales',
    email: 'shedrack@mrpikipiki.com',
    phone: '+255 123 456 790',
    isActive: true
  },
  {
    username: 'matrida',
    password: 'sales123',
    fullName: 'Matrida',
    role: 'sales',
    email: 'matrida@mrpikipiki.com',
    phone: '+255 123 456 791',
    isActive: true
  },
  {
    username: 'rama',
    password: 'reg123',
    fullName: 'Rama',
    role: 'registration',
    email: 'rama@mrpikipiki.com',
    phone: '+255 123 456 792',
    isActive: true
  },
  {
    username: 'rehema',
    password: 'sec123',
    fullName: 'Rehema',
    role: 'secretary',
    email: 'rehema@mrpikipiki.com',
    phone: '+255 123 456 793',
    isActive: true
  },
  {
    username: 'gidion',
    password: 'trans123',
    fullName: 'Gidion',
    role: 'transport',
    email: 'gidion@mrpikipiki.com',
    phone: '+255 123 456 794',
    isActive: true
  },
  {
    username: 'joshua',
    password: 'trans123',
    fullName: 'Joshua',
    role: 'transport',
    email: 'joshua@mrpikipiki.com',
    phone: '+255 123 456 795',
    isActive: true
  },
  {
    username: 'dito',
    password: 'mech123',
    fullName: 'Dito',
    role: 'mechanic',
    email: 'dito@mrpikipiki.com',
    phone: '+255 123 456 796',
    isActive: true
  },
  {
    username: 'friday',
    password: 'staff123',
    fullName: 'Friday',
    role: 'staff',
    email: 'friday@mrpikipiki.com',
    phone: '+255 123 456 797',
    isActive: true
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if users already exist
    const existingUserCount = await User.countDocuments();
    
    if (existingUserCount > 0) {
      console.log(`\n⚠️  Found ${existingUserCount} existing users.`);
      console.log('Do you want to:');
      console.log('  1. Skip seeding (keep existing users)');
      console.log('  2. Add missing users only');
      console.log('  3. Delete all and recreate');
      console.log('\nPlease run with flag:');
      console.log('  node server/seed.js --skip');
      console.log('  node server/seed.js --add-missing');
      console.log('  node server/seed.js --reset');
      
      const flag = process.argv[2];
      
      if (flag === '--skip') {
        console.log('\n✓ Skipping seed. Existing users kept.');
        process.exit(0);
      } else if (flag === '--reset') {
        console.log('\n⚠️  Deleting all users...');
        await User.deleteMany({});
        console.log('✓ All users deleted.');
      } else if (flag === '--add-missing') {
        console.log('\n✓ Will add only missing users...');
      } else {
        console.log('\n❌ Please specify a flag.');
        process.exit(1);
      }
    }

    // Seed users
    console.log('\n📝 Creating users...\n');
    
    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ username: userData.username });
        
        if (existingUser) {
          console.log(`⏭️  ${userData.fullName} (${userData.username}) - already exists`);
          continue;
        }
        
        const user = new User(userData);
        await user.save();
        console.log(`✅ ${userData.fullName} (${userData.username}) - Role: ${userData.role}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⏭️  ${userData.fullName} (${userData.username}) - already exists`);
        } else {
          console.log(`❌ ${userData.fullName} - Error: ${error.message}`);
        }
      }
    }

    // Display summary
    console.log('\n📊 Summary:');
    const finalCount = await User.countDocuments();
    console.log(`Total users in database: ${finalCount}`);
    
    // Display users by role
    const roles = ['admin', 'sales', 'registration', 'secretary', 'transport', 'mechanic', 'staff'];
    console.log('\nUsers by role:');
    for (const role of roles) {
      const count = await User.countDocuments({ role });
      console.log(`  ${role}: ${count}`);
    }
    
    // List mechanic users specifically
    const mechanics = await User.find({ role: 'mechanic' }).select('username fullName');
    console.log('\n🔧 Mechanic Users:');
    if (mechanics.length === 0) {
      console.log('  ⚠️  No mechanics found!');
    } else {
      mechanics.forEach(m => {
        console.log(`  - ${m.fullName} (${m.username})`);
      });
    }
    
    console.log('\n✅ Seed completed successfully!\n');
    console.log('📌 Default Passwords:');
    console.log('   Admin: admin123');
    console.log('   Sales: sales123');
    console.log('   Registration: reg123');
    console.log('   Secretary: sec123');
    console.log('   Transport: trans123');
    console.log('   Mechanic: mech123');
    console.log('   Staff: staff123');
    console.log('\n⚠️  Please change passwords after first login!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

seedUsers();

