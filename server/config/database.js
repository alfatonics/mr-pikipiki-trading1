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
  connectionTimeoutMillis: 30000, // How long to wait for a connection (increased from 10s to 30s)
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Test connection on initialization
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err);
});

// Helper function to execute queries with retry logic
export const query = async (text, params, retries = 2) => {
  const start = Date.now();
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log("Executed query", { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      lastError = error;
      console.error(
        `Database query error (attempt ${attempt + 1}/${retries + 1}):`,
        error.message
      );

      // If it's a connection error and we have retries left, wait and retry
      if (
        attempt < retries &&
        (error.code === "ECONNRESET" ||
          error.code === "ETIMEDOUT" ||
          error.message.includes("Connection terminated") ||
          error.message.includes("timeout"))
      ) {
        const waitTime = (attempt + 1) * 1000; // Exponential backoff: 1s, 2s
        console.log(`Retrying query in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's not a connection error or we're out of retries, throw immediately
      throw error;
    }
  }

  // If we exhausted all retries, throw the last error
  throw lastError;
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
