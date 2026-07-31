# Redis Leaderboard Caching

## Why Redis was added

The leaderboard is a read-heavy endpoint that recomputes the same ranked list of
user performance aggregates on every request. Redis is used as a **read cache**
to serve that list without hitting PostgreSQL each time.

Caching is deliberately scoped to the leaderboard only. No other endpoint or
service is cached.

## Architecture

```
Controller → Service → Prisma (PostgreSQL)
                  │
                  └→ Redis (cache layer only)
```

- `server/src/lib/redis/client.js` — ioredis singleton. Reads `REDIS_URL`
  (falls back to `redis://127.0.0.1:6379` for local development).
- `server/src/lib/redis/cache.js` — thin, safe wrapper: `getJSON`, `setJSON`,
  `del`. Every method catches Redis errors and never throws.
- `server/src/services/leaderboardService.js` — the only service that reads the
  cache.
- `server/src/services/performanceService.js` — invalidates the cache when a
  user's performance changes.

## Request flow (`GET /leaderboard`)

1. Check Redis key `leaderboard:global`.
2. **Cache hit** → return the cached payload immediately.
3. **Cache miss** → query PostgreSQL, build the ranked list, store it in Redis
   with a TTL of 300 seconds, then return it.

Development-only logging prints `CACHE HIT leaderboard:global` /
`CACHE MISS leaderboard:global`. Nothing is logged in production.

## Cache invalidation flow

When a user's performance changes (`performanceService.recordAnswer`), the cache
is **not** updated. Instead the key is deleted:

```
recordAnswer → UPDATE userPerformanceAggregate (PostgreSQL)
             → DEL leaderboard:global (Redis)
```

The next `GET /leaderboard` misses, rebuilds from PostgreSQL, and re-populates
the cache. Invalidation is guarded so a Redis failure can never break the
answer-write path.

## TTL choice

`300` seconds (5 minutes) balances freshness against load:

- Long enough that repeated reads are served from memory.
- Short enough that the leaderboard never goes stale for long even if an
  invalidation is somehow missed.

PostgreSQL remains authoritative — TTL is only a freshness safety net.

## PostgreSQL is the single source of truth

- Redis never writes data; it only mirrors the leaderboard response.
- If Redis is unavailable, `cache.js` returns `null`/`false` on every call and
  the app transparently reads from PostgreSQL. A cache failure is treated as a
  miss, never as an error.
- Redis configuration (`enableOfflineQueue: false`, bounded retries) makes
  commands fail fast while disconnected so requests never hang on a dead cache.

## Configuration

| Variable    | Description                      | Example                       |
|-------------|----------------------------------|-------------------------------|
| `REDIS_URL` | Redis connection string (optional) | `redis://127.0.0.1:6379`    |

If `REDIS_URL` is missing, the app still runs — it just reads from PostgreSQL.

## Docker

There is no `docker-compose.yml` yet, so no Redis service was added. When Docker
is introduced, add a `redis:7` service and point `REDIS_URL` at it (e.g.
`redis://redis:6379`). No code changes are required.

## Tests

Unit tests mock Redis (no real server needed):

```
cd server && npm test
```

- `src/lib/redis/__tests__/cache.test.js` — cache hit, cache miss, Redis
  unavailable, malformed payloads.
- `src/services/__tests__/performanceService.test.js` — cache invalidation on
  performance updates.
