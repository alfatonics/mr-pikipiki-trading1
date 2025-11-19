import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool, { query } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log("🔄 Initializing database...");

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("📄 Executing schema.sql...");

    // Execute the schema
    await query(schema);

    console.log("✅ Database schema created successfully!");
    console.log("✅ All tables, indexes, and triggers have been set up.");

    return true;
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

// Run if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => {
      console.log("✅ Database initialization complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Database initialization failed:", error);
      process.exit(1);
    });
}

export default initializeDatabase;
