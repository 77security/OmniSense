const express = require('express');

// --- LOGGING SETUP ---
const logger = require('pino')({
  level: process.env.LOG_LEVEL || 'info',
  // In K8s, we want raw JSON. Locally, use pino-pretty.
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined
});
const pinoHttp = require('pino-http')({ 
  logger,
  // This skips logging for health and ready checks
  autoLogging: {
    ignore: (req) => ['/health', '/ready'].includes(req.url)
  }
});

const app = express();

// Use the logger middleware early to track all requests
app.use(pinoHttp);
app.use(express.json());

// Health Probes (Keep these quiet unless they fail)
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/ready', (req, res) => res.status(200).send('Ready'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => logger.info(`77 Security OmniSense API running on port ${PORT}`));
