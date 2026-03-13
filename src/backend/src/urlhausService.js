const axios = require("axios")
const csv = require("csv-parser")
const { Readable } = require("stream")
const { extractEntities } = require("./entityExtractor")

const URLHAUS_FEED = process.env.URLHAUS_URL


const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function upsertUrl(record) {
  console.log("upsertUrl: ", record.url.substring(0, 200));

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    const url = record.url
    const tags = record.tags ? record.tags.split(",") : []
    const detection = { URLhaus: record.threat }

    let baseId

    // -----------------------------
    // URL ENTITY
    // -----------------------------
    const existingUrl = await client.query(
      `SELECT id FROM ti_urls WHERE url_full = $1`,
      [url]
    )

    if (existingUrl.rows.length > 0) {

      baseId = existingUrl.rows[0].id

      await client.query(
        `
        UPDATE ti_base
        SET last_seen = NOW(),
            query_count = query_count + 1,
            tags = ARRAY(SELECT DISTINCT UNNEST(tags || $1)),
            detections = detections || $2::jsonb
        WHERE id = $3
        `,
        [tags, detection, baseId]
      )

    } else {

      const baseInsert = await client.query(
        `
        INSERT INTO ti_base (detections, tags)
        VALUES ($1, $2)
        RETURNING id
        `,
        [detection, tags]
      )

      baseId = baseInsert.rows[0].id

      await client.query(
        `
        INSERT INTO ti_urls (id, url_full)
        VALUES ($1, $2)
        `,
        [baseId, url]
      )
    }

    // -----------------------------
    // Extract domain/ip
    // -----------------------------
    const { ip, domain } = extractEntities(url)

    // -----------------------------
    // DOMAIN ENTITY
    // -----------------------------
    if (domain) {

      const existingDomain = await client.query(
        `
        SELECT id FROM ti_domains
        WHERE domain_name = $1
        `,
        [domain]
      )

      if (existingDomain.rows.length > 0) {

        const domainBaseId = existingDomain.rows[0].id

        await client.query(
          `
          UPDATE ti_base
          SET last_seen = NOW(),
              query_count = query_count + 1
          WHERE id = $1
          `,
          [domainBaseId]
        )

      } else {

        const domainBase = await client.query(
          `
          INSERT INTO ti_base DEFAULT VALUES
          RETURNING id
          `
        )

        const domainBaseId = domainBase.rows[0].id

        await client.query(
          `
          INSERT INTO ti_domains (id, domain_name)
          VALUES ($1, $2)
          `,
          [domainBaseId, domain]
        )
      }
    }

    // -----------------------------
    // IP ENTITY
    // -----------------------------
    if (ip) {

      const existingIp = await client.query(
        `
        SELECT id FROM ti_ips
        WHERE ip_address = $1
        `,
        [ip]
      )

      if (existingIp.rows.length > 0) {

        const ipBaseId = existingIp.rows[0].id

        await client.query(
          `
          UPDATE ti_base
          SET last_seen = NOW(),
              query_count = query_count + 1
          WHERE id = $1
          `,
          [ipBaseId]
        )

      } else {

        const ipBase = await client.query(
          `
          INSERT INTO ti_base DEFAULT VALUES
          RETURNING id
          `
        )

        const ipBaseId = ipBase.rows[0].id

        await client.query(
          `
          INSERT INTO ti_ips (id, ip_address)
          VALUES ($1, $2)
          `,
          [ipBaseId, ip]
        )
      }
    }

    await client.query("COMMIT")

  } catch (err) {

    await client.query("ROLLBACK")
    throw err

  } finally {

    client.release()

  }
}

async function updateURLhaus() {
  console.log("Starting URLhaus sync...");

  try {
    const response = await axios.get(URLHAUS_FEED);
    
    // Create the stream from the response string
    const stream = Readable.from(response.data);
    const parser = stream.pipe(csv({ skipLines: 8 }));

    let count = 0;
    let errorCount = 0;

    console.log("Stream initialized. Starting processing...");

    // The magic: This loop waits for each 'await' before moving to the next row
    for await (const row of parser) {
      // 1. Log the first row to verify keys match your DB schema
      if (count === 0) {
        console.log("First row detected:", JSON.stringify(row, null, 2));
      }

      // 2. Critical Check: Does 'row.url' actually exist? 
      // Sometimes CSV headers have hidden spaces or different casing.
      if (!row.url) {
        errorCount++;
        if (errorCount === 1) console.error("Missing 'url' key in row. Check headers!");
        continue;
      }

      try {
        await upsertUrl({
          url: row.url,
          threat: row.threat,
          tags: row.tags
        });

        count++;
        if (count % 100 === 0) console.log(`Processed ${count}`);
      } catch (err) {
        console.error(`   URL: ${row.url}`);
        console.error(`   Error Message: ${err.message}`);
        if (err.code) console.error(`   Error Code: ${err.code}`);
        errorCount++;
        if (errorCount < 5) console.error(`Row ${count} error:`, err.message);
      }
    }

    console.log(`\n--- Sync Summary ---`);
    console.log(`Total Successfully Saved: ${count}`);
    console.log(`Total Errors/Skipped: ${errorCount}`);
    console.log(`--------------------\n`);

  } catch (err) {
    console.error("Fatal Sync Error:", err.message);
  }
}

module.exports = { updateURLhaus }
