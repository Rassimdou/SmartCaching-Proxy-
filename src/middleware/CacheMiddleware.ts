import * as http from 'http';
import { MemoryCache } from '../cache/LRU_cache';
import { CachedResponse } from '../cache/InMemoryCache';
import { createCacheKey } from '../utils/CacheKeyGen';
import { RequestHandler } from '../proxy/requestHandler';  

interface BackendResponse {
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: Buffer;
}

export class CacheMiddleware {
    private cache: MemoryCache;
    private requestHandler: RequestHandler;  // Add RequestHandler
    private pendingRequests: Map<string, {
        promise: Promise<CachedResponse>;
        timestamp: number;  
        waitCount: number;
    }>;
    private coalescingEnabled: boolean = false;  

    constructor(cache: MemoryCache, requestHandler: RequestHandler) { 
        this.cache = cache;
        this.requestHandler = requestHandler;  // Store RequestHandler
        this.pendingRequests = new Map();
    }

    
    enableCoalescing(): void {
        this.coalescingEnabled = true;
        console.log("Coalescing method is active now");
    }

    disableCoalescing(): void {
        this.coalescingEnabled = false;
        this.pendingRequests.clear();
        console.log("Coalescing method is inactive");
    }

    
    async coalescingMethod(req: http.IncomingMessage): Promise<CachedResponse | null> {
        if (!this.coalescingEnabled) {
            return this.checkCache(req);
        }

        const cacheKey = createCacheKey(req.method!, req.url!, req.headers);
        
        // Normal cache check
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log(` Cache HIT: ${cacheKey}`);
            return cached;
        }
        
        // Coalescing check
        if (this.pendingRequests.has(cacheKey)) {
            const pending = this.pendingRequests.get(cacheKey)!;
            pending.waitCount++;
            console.log(` Coalescing requests: ${cacheKey} (${pending.waitCount} waiting)`);
            return await pending.promise;
        }

        // Create backend request
        console.log(` New backend request: ${cacheKey}`);
        const fetchPromise = this.createBackendPromise(req, cacheKey);
        
        this.pendingRequests.set(cacheKey, {
            promise: fetchPromise,
            timestamp: Date.now(),  
            waitCount: 0
        });

        try {
            const result = await fetchPromise;
            return result;
        } catch (error) {
            //Re-throw so all waiting requests get the error
            throw error;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

        //creater backend promise 
    private async createBackendPromise(req: http.IncomingMessage, cacheKey: string): Promise<CachedResponse> {
        try {
            const { backendRes, body } = await this.requestHandler.forwardPromise(req);
            
            // Create BackendResponse
            const backendResponse: BackendResponse = {
                statusCode: backendRes.statusCode || 500,
                headers: backendRes.headers,
                body: body
            };

            // Store in cache (only successful GET requests)
            if (req.method === 'GET' && backendRes.statusCode === 200) {
                this.storeInCache(req, backendResponse);
            }

            // Convert to CachedResponse
            const cachedResponse: CachedResponse = {
                statusCode: backendResponse.statusCode,
                headers: backendResponse.headers,
                body: backendResponse.body,
                timestamp: Date.now(),
                ttl: 300000000
            };

            return cachedResponse;
        } catch (error) {
            console.error(` Backend promise error for ${cacheKey}:`, error);
            throw error; // Re-throw for coalescing
        }
    }

    checkCache(req: http.IncomingMessage): CachedResponse | null {
        const cacheKey = createCacheKey(req.method!, req.url!, req.headers);
        const cachedResponse = this.cache.get(cacheKey);

        if (cachedResponse) {
            console.log(`Cache HIT for: ${cacheKey}`);
            return cachedResponse;
        }

        console.log(`Cache MISS for: ${cacheKey}`);
        return null;
    }

    storeInCache(req: http.IncomingMessage, response: BackendResponse): void {
        if (req.method === 'GET' && response.statusCode === 200) {
            const cacheKey = createCacheKey(req.method!, req.url!, req.headers);
            const cacheEntry: CachedResponse = {
                statusCode: response.statusCode,
                headers: response.headers,
                body: response.body,
                timestamp: Date.now(),
                ttl: 300000000
            };

            this.cache.set(cacheKey, cacheEntry);
            console.log(` Stored in cache: ${cacheKey}`);
            console.log(` Cache stats:`, this.cache.getStats());
        }
    }

    getStats() {
        return this.cache.getStats();
    }

    clearCache(): void {
        this.cache.clear();
    }
}