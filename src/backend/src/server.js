const express = require('express');
const { Pool } = require('pg');
const net = require('net');

// --- LOGGING SETUP ---
const logger = require('pino')({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined
});
const pinoHttp = require('pino-http')({ 
  logger,
  autoLogging: {
    ignore: (req) => ['/health', '/ready'].includes(req.url)
  }
});

const app = express();

// Database connection
const pool = new Pool({
  host: '77security.postgres.database.azure.com',
  user: 'postgresql',
  password: process.env.DATABASE_PASS,
  database: 'omnisense',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

app.use(pinoHttp);
app.use(express.json());

// --- HELPERS: Input Type Detection ---
const isIP = (str) => net.isIP(str) !== 0;
const isHash = (str) => /^[a-fA-F0-0]{32,64}$/.test(str);
const isDomain = (str) => /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(str);

// --- SEARCH API ---
app.get('/api/ti/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Search query 'q' is required" });
  }

  const query = q.trim();
  let result = null;

  try {
    if (isIP(query)) {
      // Search in ti_ips
      const resIps = await pool.query(
        `SELECT b.*, i.* FROM ti_ips i 
         JOIN ti_base b ON i.id = b.id 
         WHERE i.ip_address = $1`, [query]
      );
      if (resIps.rows.length > 0) result = { type: 'ip', data: resIps.rows[0] };

    } else if (isHash(query)) {
      // Search in ti_files (MD5, SHA1, or SHA256)
      const resFiles = await pool.query(
        `SELECT b.*, f.* FROM ti_files f 
         JOIN ti_base b ON f.id = b.id 
         WHERE f.hash_sha256 = $1 OR f.hash_sha1 = $1 OR f.hash_md5 = $1`, [query]
      );
      if (resFiles.rows.length > 0) result = { type: 'file', data: resFiles.rows[0] };

    } else if (isDomain(query)) {
      // Search in ti_domains
      const resDomains = await pool.query(
        `SELECT b.*, d.* FROM ti_domains d 
         JOIN ti_base b ON d.id = b.id 
         WHERE d.domain_name = $1`, [query.toLowerCase()]
      );
      if (resDomains.rows.length > 0) result = { type: 'domain', data: resDomains.rows[0] };

    } else {
      // Fallback: Search in ti_urls
      const resUrls = await pool.query(
        `SELECT b.*, u.* FROM ti_urls u 
         JOIN ti_base b ON u.id = b.id 
         WHERE u.url_full = $1`, [query]
      );
      if (resUrls.rows.length > 0) result = { type: 'url', data: resUrls.rows[0] };
    }

    if (!result) {
      return res.status(404).json({ message: "No threat intelligence found for this indicator" });
    }

    // Update query count asynchronously
    pool.query('UPDATE ti_base SET query_count = query_count + 1, last_seen = CURRENT_TIMESTAMP WHERE id = $1', [result.data.id])
        .catch(e => logger.error({ err: e, id: result.data.id }, "Failed to update query count"));

    res.json(result);

  } catch (err) {
    req.log.error({ err, query }, "Search API failure");
    res.status(500).json({ error: "Internal server error during search" });
  }
});

// Health Probes
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/ready', (req, res) => res.status(200).send('Ready'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => logger.info(`77 Security OmniSense API running on port ${PORT}`));