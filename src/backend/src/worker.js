const { Pool } = require('pg');
// Reuse your existing DB connection logic
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function crawl() {
  console.log("Starting TI database update...");
  try {
    // 1. Fetch from external sources (e.g., AlienVault, URLHaus)
    // 2. Parse data
    // 3. UPSERT into your PostgreSQL
    console.log("Crawl completed successfully.");
    process.exit(0); // Success
  } catch (err) {
    console.error("Crawl failed:", err);
    process.exit(1); // Failure (K8s will see this and potentially retry)
  }
}

crawl();
