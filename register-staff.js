import User from "./server/models/User.js";
import { closePool } from "./server/config/database.js";

const staffMembers = [
  {
    username: "shedrack",
    password: "shedrack123",
    fullName: "Shedrack",
    role: "sales",
    email: "shedrack@mrpikipiki.com",
    phone: "+255 712 345 001",
    isActive: true,
  },
  {
    username: "matrida",
    password: "matrida123",
    fullName: "Matrida",
    role: "sales",
    email: "matrida@mrpikipiki.com",
    phone: "+255 712 345 002",
    isActive: true,
  },
  {
    username: "rama",
    password: "rama123",
    fullName: "Rama",
    role: "registration",
    email: "rama@mrpikipiki.com",
    phone: "+255 712 345 003",
    isActive: true,
  },
  {
    username: "rehema",
    password: "rehema123",
    fullName: "Rehema",
    role: "secretary",
    email: "rehema@mrpikipiki.com",
    phone: "+255 712 345 004",
    isActive: true,
  },
  {
    username: "gidion",
    password: "gidion123",
    fullName: "Gidion",
    role: "transport",
    email: "gidion@mrpikipiki.com",
    phone: "+255 712 345 005",
    isActive: true,
  },
  {
    username: "joshua",
    password: "joshua123",
    fullName: "Joshua",
    role: "transport",
    email: "joshua@mrpikipiki.com",
    phone: "+255 712 345 006",
    isActive: true,
  },
  {
    username: "dito",
    password: "dito123",
    fullName: "Dito",
    role: "mechanic",
    email: "dito@mrpikipiki.com",
    phone: "+255 712 345 007",
    isActive: true,
  },
  {
    username: "friday",
    password: "friday123",
    fullName: "Friday",
    role: "staff",
    email: "friday@mrpikipiki.com",
    phone: "+255 712 345 008",
    isActive: true,
  },
];

async function registerStaff() {
  console.log("🌱 Starting staff registration...\n");

  try {
    for (const member of staffMembers) {
      // Check if user already exists
      const existingUser = await User.findByUsername(member.username);

      if (existingUser) {
        console.log(`ℹ️  User "${member.username}" already exists - skipping`);
        continue;
      }

      // Create new user
      await User.create(member);
      console.log(
        `✅ Created user: ${member.username} (${member.fullName}) - Role: ${member.role}`
      );
    }

    console.log("\n✅ Staff registration complete!");
    console.log("\n📝 Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    staffMembers.forEach((member) => {
      console.log(
        `   ${member.fullName.padEnd(15)} - Username: ${member.username.padEnd(
          12
        )} Password: ${member.password}`
      );
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANT: Change these passwords in production!\n");
  } catch (error) {
    console.error("❌ Error registering staff:", error);
    throw error;
  } finally {
    await closePool();
  }
}

// Run the registration
registerStaff()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Registration failed:", error);
    process.exit(1);
  });
