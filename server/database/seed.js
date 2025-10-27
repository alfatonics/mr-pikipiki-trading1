import User from "../models/User.js";
import Supplier from "../models/Supplier.js";
import Customer from "../models/Customer.js";
import { closePool } from "../config/database.js";

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create Admin User
    console.log("Creating admin user...");
    const adminExists = await User.findByUsername("admin");

    if (!adminExists) {
      await User.create({
        username: "admin",
        password: "admin123",
        fullName: "System Administrator",
        role: "admin",
        email: "admin@mrpikipiki.com",
        phone: "+255 123 456 789",
        isActive: true,
      });
      console.log(
        "✅ Admin user created (username: admin, password: admin123)"
      );
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Create Sales User
    console.log("Creating sales user...");
    const salesExists = await User.findByUsername("sales");

    if (!salesExists) {
      await User.create({
        username: "sales",
        password: "sales123",
        fullName: "Sales Manager",
        role: "sales",
        email: "sales@mrpikipiki.com",
        phone: "+255 123 456 780",
        isActive: true,
      });
      console.log(
        "✅ Sales user created (username: sales, password: sales123)"
      );
    } else {
      console.log("ℹ️  Sales user already exists");
    }

    // Create Mechanic User
    console.log("Creating mechanic user...");
    const mechanicExists = await User.findByUsername("mechanic");

    if (!mechanicExists) {
      await User.create({
        username: "mechanic",
        password: "mechanic123",
        fullName: "Chief Mechanic",
        role: "mechanic",
        email: "mechanic@mrpikipiki.com",
        phone: "+255 123 456 781",
        isActive: true,
      });
      console.log(
        "✅ Mechanic user created (username: mechanic, password: mechanic123)"
      );
    } else {
      console.log("ℹ️  Mechanic user already exists");
    }

    // Create Transport User
    console.log("Creating transport user...");
    const transportExists = await User.findByUsername("transport");

    if (!transportExists) {
      await User.create({
        username: "transport",
        password: "transport123",
        fullName: "Transport Manager",
        role: "transport",
        email: "transport@mrpikipiki.com",
        phone: "+255 123 456 782",
        isActive: true,
      });
      console.log(
        "✅ Transport user created (username: transport, password: transport123)"
      );
    } else {
      console.log("ℹ️  Transport user already exists");
    }

    // Create Sample Suppliers
    console.log("Creating sample suppliers...");
    const supplierCount = await Supplier.count();

    if (supplierCount === 0) {
      await Supplier.create({
        name: "John Mwangi",
        company: "Mwangi Motors Ltd",
        phone: "+255 712 345 678",
        email: "john@mwangimotors.com",
        address: "Plot 123, Nyerere Road",
        city: "Dar es Salaam",
        country: "Tanzania",
        taxId: "TIN-123456789",
        bankName: "CRDB Bank",
        accountNumber: "0150123456789",
        accountName: "Mwangi Motors Ltd",
        rating: 5,
        isActive: true,
        notes: "Reliable supplier with quality motorcycles",
      });

      await Supplier.create({
        name: "Abdul Hassan",
        company: "Coast Motorcycle Traders",
        phone: "+255 713 456 789",
        email: "abdul@coastmotors.co.tz",
        address: "Mwenge, Kinondoni",
        city: "Dar es Salaam",
        country: "Tanzania",
        rating: 4,
        isActive: true,
      });

      console.log("✅ Sample suppliers created");
    } else {
      console.log("ℹ️  Suppliers already exist");
    }

    // Create Sample Customers
    console.log("Creating sample customers...");
    const customerCount = await Customer.count();

    if (customerCount === 0) {
      await Customer.create({
        fullName: "Mary Kikwete",
        phone: "+255 754 123 456",
        email: "mary.k@email.com",
        idType: "NIDA",
        idNumber: "19850512-12345-12345-12",
        address: "Mbezi Beach, House No. 45",
        city: "Dar es Salaam",
        region: "Dar es Salaam",
        occupation: "Business Owner",
        budgetRange: "1m-2m",
        preferredCurrency: "TZS",
        paymentTerms: "cash",
      });

      await Customer.create({
        fullName: "James Moshi",
        phone: "+255 765 234 567",
        email: "james.moshi@gmail.com",
        idType: "Driving License",
        idNumber: "DL-TZ-2020-123456",
        address: "Mikocheni, Plot 234",
        city: "Dar es Salaam",
        region: "Dar es Salaam",
        occupation: "Engineer",
        budgetRange: "2m-5m",
        preferredCurrency: "TZS",
        paymentTerms: "installment",
      });

      console.log("✅ Sample customers created");
    } else {
      console.log("ℹ️  Customers already exist");
    }

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📝 Default User Credentials:");
    console.log("   Admin: username=admin, password=admin123");
    console.log("   Sales: username=sales, password=sales123");
    console.log("   Mechanic: username=mechanic, password=mechanic123");
    console.log("   Transport: username=transport, password=transport123");
    console.log("\n⚠️  Please change these passwords in production!\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    // Close database connection
    await closePool();
  }
}

// Run seed if executed directly
if (process.argv[1].includes("seed.js")) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seed;
