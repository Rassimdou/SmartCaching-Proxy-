import * as http from 'http';
import { MemoryCache } from '../cache/LRU_cache';
import { CachedResponse } from '../cache/InMemoryCache';
import {createCacheKey} from '../utils/CacheKeyGen'

interface BackendResponse {
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: Buffer;
}

export class CacheMiddleware {
    private cache: MemoryCache;
  
    constructor(cache: MemoryCache) {
        this.cache = cache;
    }

    
     //Check if request exists in cache
    checkCache(req: http.IncomingMessage): CachedResponse | null {
       
        const cacheKey = createCacheKey(req.method!, req.url!, req.headers);
        const cachedResponse = this.cache.get(cacheKey);

        if (cachedResponse) {
            console.log(`Cache HIT for : ${cacheKey}`);
            return cachedResponse;
        }

        console.log(`Cache MISS for: ${cacheKey}`);
        return null;
    }

    
      //Store response in cache 
    storeInCache(req: http.IncomingMessage, response: BackendResponse): void {
        
        if (req.method === 'GET' && response.statusCode === 200) {
            const cacheKey = createCacheKey(req.method!, req.url!, req.headers);

            
            const cacheEntry: CachedResponse = {
                statusCode: response.statusCode,
                headers: response.headers,
                body: response.body,
                timestamp: Date.now(),
                ttl: 300000000  // Your TTL value
            };

            this.cache.set(cacheKey, cacheEntry);
            console.log(`Stored in cache: ${cacheKey}`);
            console.log(`Cache stats:`, this.cache.getStats());
        }
    }

    
      //Get cache statistics
     
    getStats() {
        return this.cache.getStats();
    }

    
      //Clear cache
     
    clearCache(): void {
        this.cache.clear();
    }
}