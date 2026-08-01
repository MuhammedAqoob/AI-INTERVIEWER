// Simple JSON cache wrapper around ioredis.
//
// All methods are safe – they never throw to callers.
// On any Redis error we log (dev only) and return a neutral value:
//   - getJSON => null
//   - setJSON => false
//   - del     => void (silently ignore)
//
// This ensures the rest of the application can continue using
// PostgreSQL as the single source of truth even when Redis is down.

const client = require('./client');

/**
 * Get a JSON value from Redis.
 * @param {string} key
 * @returns {Promise<any|null>} Parsed JSON or null on miss / error.
 */
async function getJSON(key) {
  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Redis GET error for key ${key}:`, err);
    }
    return null;
  }
}

/**
 * Store a JSON value in Redis with optional TTL.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds - time‑to‑live in seconds. If omitted, key persists.
 * @returns {Promise<boolean>} true if set succeeded, false otherwise.
 */
async function setJSON(key, value, ttlSeconds) {
  try {
    const payload = JSON.stringify(value);
    if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
      await client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await client.set(key, payload);
    }
    return true;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Redis SET error for key ${key}:`, err);
    }
    return false;
  }
}

/**
 * Delete a key from Redis.
 * Errors are logged (dev only) but never propagated.
 * @param {string} key
 */
async function del(key) {
  try {
    await client.del(key);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Redis DEL error for key ${key}:`, err);
    }
    // swallow error
  }
}

/**
 * Delete all keys matching a glob pattern (e.g. 'leaderboard:global:*').
 * Errors are logged (dev only) but never propagated.
 * @param {string} pattern
 */
async function delByPattern(pattern) {
  try {
    const keys = [];
    const stream = client.scanStream({ match: pattern, count: 100 });
    for await (const batch of stream) {
      if (batch.length) keys.push(...batch);
    }
    if (keys.length) await client.del(keys);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Redis DEL-by-pattern error for pattern ${pattern}:`, err);
    }
    // swallow error
  }
}

module.exports = { getJSON, setJSON, del, delByPattern };
