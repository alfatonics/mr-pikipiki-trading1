import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
        }
      : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 10000, // How long to wait for a connection
});

// Test connection on initialization
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err);
});

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

// Helper function to get a client from the pool for transactions
export const getClient = async () => {
  return await pool.query();
};

// Test database connection
export const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

// Close all connections (useful for graceful shutdown)
export const closePool = async () => {
  await pool.end();
  console.log("Database pool closed");
};

export default pool;
