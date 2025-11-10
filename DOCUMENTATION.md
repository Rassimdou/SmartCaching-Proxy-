# Smart Caching Proxy - Core Concept Documentation

## Overview

The **Smart Caching Proxy** is an HTTP proxy server that sits between clients and backend services, providing intelligent caching and request optimization. It reduces backend load and improves response times through two key mechanisms:

1. **LRU (Least Recently Used) Cache** - Stores responses in memory with automatic eviction
2. **Request Coalescing** - Prevents duplicate backend calls when multiple identical requests arrive simultaneously

---

## Core Architecture

```
Client → Proxy (Port 8080) → CacheMiddleware → LRU Cache → Backend (Port 3000)
```

**Flow:**
1. Request arrives at proxy
2. CacheMiddleware checks cache
3. If cached → return immediately (fast)
4. If not cached → forward to backend, cache response, return to client

---

## Key Components

### 1. LRU Cache (`src/cache/LRU_cache.ts`)

**Purpose:** In-memory cache with capacity limit (default: 10 entries)

**How it works:**
- **Get**: Retrieves entry, moves it to "most recently used" position
- **Set**: Adds entry, evicts least recently used if at capacity
- **Eviction**: When full, removes oldest accessed item (first in Map)

**Key Feature:** Every cache access updates the "recently used" order

### 2. Cache Middleware (`src/middleware/CacheMiddleware.ts`)

**Purpose:** Core logic for caching and request coalescing

**Main Method:** `coalescingMethod(req)`
- Checks cache first
- If cache miss and coalescing enabled → checks for pending identical requests
- If pending → waits for existing backend call
- If not pending → creates new backend call

**Caching Rules:**
- Only caches: GET requests with HTTP 200 status
- Cache key includes: HTTP method + URL + headers hash

### 3. Request Handler (`src/proxy/requestHandler.ts`)

**Purpose:** Forwards requests to backend server

**Two Methods:**
- `forward()` - Callback-based (normal flow)
- `forwardPromise()` - Promise-based (for coalescing)

### 4. Cache Key Generator (`src/utils/CacheKeyGen.ts`)

**Purpose:** Creates unique cache keys

**Format:** `{method}:{url}:{md5HashOfHeaders}`

**Why:** Ensures requests with different headers (e.g., auth tokens) are cached separately

---

## Request Coalescing

### The Problem

When cache expires or is cleared, multiple clients may request the same resource simultaneously, causing:
- Multiple identical backend calls
- Unnecessary load on backend
- Wasted resources

### The Solution

**Request Coalescing** ensures that when multiple identical requests arrive at the same time:
- Only **one** backend call is made
- All other requests **wait** for that same call
- All requests receive the **same response**

**Example:**
```
Without Coalescing:
  10 requests → 10 backend calls → 10 responses

With Coalescing:
  10 requests → 1 backend call → 10 responses (all identical)
```

**Implementation:**
- Maintains a `pendingRequests` Map tracking ongoing backend calls
- Duplicate requests await the same Promise
- When backend responds, all waiting requests get the result

---

## Request Flow Examples

### Flow 1: Cache Hit
```
Client → Proxy → CacheMiddleware → LRU Cache (found) → Response
Time: ~1-5ms
```

### Flow 2: Cache Miss (Normal)
```
Client → Proxy → CacheMiddleware → Cache (miss) → Backend → Cache → Response
Time: ~100-500ms
```

### Flow 3: Cache Miss with Coalescing
```
Request 1: Client → Proxy → Cache (miss) → Backend (starts call)
Request 2: Client → Proxy → Cache (miss) → Waits for Request 1
Request 3: Client → Proxy → Cache (miss) → Waits for Request 1

Backend responds → All 3 requests get same response
Time: ~100ms for all (vs 300ms without coalescing)
```

---

## Cache Strategy

### What Gets Cached?
- ✅ GET requests only
- ✅ HTTP 200 (success) responses only
- ✅ Includes TTL (Time To Live) for expiration

### What Doesn't Get Cached?
- ❌ POST, PUT, PATCH, DELETE requests
- ❌ Error responses (non-200 status codes)
- ❌ Expired entries (auto-removed)

### Cache Entry Structure
```typescript
{
    statusCode: number,
    headers: IncomingHttpHeaders,
    body: Buffer | string,
    timestamp: number,  // When cached
    ttl: number        // Time to live (ms)
}
```

---

## Management API

All endpoints prefixed with `/__proxy/`:

- `GET /__proxy/stats` - View cache statistics
- `POST /__proxy/clear` - Clear all cache
- `POST /__proxy/coalescing/enable` - Enable request coalescing
- `POST /__proxy/coalescing/disable` - Disable request coalescing

---

## Configuration

- **Proxy Port:** 8080
- **Backend URL:** http://localhost:3000
- **Cache Capacity:** 10 entries (configurable)
- **TTL:** 300,000,000ms (≈83 hours)

---

## Key Benefits

1. **Performance:** Cache hits return in milliseconds vs hundreds of milliseconds
2. **Efficiency:** Reduces backend load significantly
3. **Scalability:** Request coalescing handles traffic spikes gracefully
4. **Simplicity:** In-memory cache, no external dependencies

---

## Quick Start

```bash
# Start backend
npx ts-node test-backend/server.ts

# Start proxy
npx ts-node src/proxy/index.ts

# Test
curl http://localhost:8080/api/data
```

---

**Core Concept:** The proxy intelligently caches responses and coalesces duplicate requests to minimize backend load while maximizing response speed.
