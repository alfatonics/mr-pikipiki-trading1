import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// PostgreSQL connection is handled via connection pool in app.js
// No need for explicit connection here

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
  console.log(`📊 Database: PostgreSQL (Neon)`);
});
