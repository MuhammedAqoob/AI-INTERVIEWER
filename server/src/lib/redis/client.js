// Redis client singleton using ioredis.
// This file exports a single Redis connection that can be reused throughout the app.
// It reads the connection URL from the REDIS_URL env var (e.g., redis://redis:6379).
// If the env var is missing we fallback to the default localhost address –
// this keeps the application runnable in development without a Docker Redis.

const Redis = require('ioredis');

// Redis is only a cache layer. When it is down the application must keep
// serving requests from PostgreSQL. To achieve that:
//   - enableOfflineQueue: false  -> commands fail immediately while disconnected
//     instead of queuing forever and hanging requests.
//   - maxRetriesPerRequest: 2    -> bound the retries for a failing command.
//   - retryStrategy              -> reconnect with backoff instead of spamming.
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const client = new Redis(redisUrl, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

// Listen for connection errors and log them (development only).
// Failures never throw into business logic – cache.js treats them as a miss.
// Logging is throttled to once per 30s so a dead Redis does not spam the console.
if (process.env.NODE_ENV !== 'production') {
  let lastErrorLoggedAt = 0;
  client.on('error', (err) => {
    const now = Date.now();
    if (now - lastErrorLoggedAt < 30000) return;
    lastErrorLoggedAt = now;
    console.error('Redis client error:', err);
  });
}

module.exports = client;
