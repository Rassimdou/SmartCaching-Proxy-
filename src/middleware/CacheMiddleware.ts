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
    private pendingRequests: Map<string , {
        promise: Promise<CachedResponse>;
        timstamp: number;
        waitCount: number;
    }>
    private CoalescingEnabled: boolean = false ;
    constructor(cache: MemoryCache) {
        this.cache = cache;
        this.pendingRequests = new Map();
    }

        enableCoalescing():void {
            this.CoalescingEnabled = true
            console.log("Coalescing method is active now");
        }

        disableCoalescing():void {
            this.CoalescingEnabled = false
            this.pendingRequests.clear(); //clear pending requests 
            console.log("Coalescing method is inactive");
        }

        //coalescing method 
        async CoalescingMethod(req:http.IncomingMessage) : Promise<CachedResponse | null>{
            if(!this.CoalescingEnabled){
                //check it normal way cz the method is disabled
                return this.checkCache(req);
            }
            const cacheKey = createCacheKey(req.method! , req.url! , req.headers);
            
            //normal check
            const cached = this.cache.get(cacheKey);
            if(cached){
                console.log(`cache HIT:${cacheKey}`);
                return cached;
            }
            //coaleching check 
            if(this.pendingRequests.has(cacheKey)){
                const pending = this.pendingRequests.get(cacheKey)!;
                pending.waitCount++;
                console.log(`Coalescing requests: ${cacheKey} (${pending.waitCount} waiting)`);
                return await pending.promise;
            }

            //create backend request
            console.log(`New backend request ${cacheKey}`);
            const fetchPromise = this.createBackendPromise(req , cacheKey);
            this.pendingRequests.set(cacheKey , {
                promise: fetchPromise,
                timstamp:Date.now(),
                waitCount: 0

            });

            try {
                const result = await fetchPromise;
                return result;
            } finally {
                this.pendingRequests.delete(cacheKey)
            }
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