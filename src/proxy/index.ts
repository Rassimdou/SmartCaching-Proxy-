import * as http from 'http';
import { MemoryCache } from '../cache/LRU_cache';
import { CacheMiddleware } from '../middleware/CacheMiddleware';
import { RequestHandler } from './requestHandler';
import { ResponseHandler } from './responseHandler';


const memoryCache = new MemoryCache(10); // Add capacity
const requestHandler = new RequestHandler('http://localhost:3000');
const cacheMiddleware = new CacheMiddleware(memoryCache, requestHandler); 

const PROXY_PORT = 8080;
const backendURL = 'http://localhost:3000';


const proxyServer = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const startTime = Date.now();

    console.log(`Proxy received: ${req.method} from ${req.url}`);

    try {
        // Cache management endpoints
        if (req.url === '/__proxy/stats') {
            const stats = cacheMiddleware.getStats();
            return ResponseHandler.sendJSON(res, stats);
        }

        //  clearing cache
        if (req.url === '/__proxy/clear' && req.method === 'POST') {
            cacheMiddleware.clearCache();
            return ResponseHandler.sendJSON(res, { message: 'Cache cleared' });
        }

        // Coalescing control endpoints
        if (req.url === '/__proxy/coalescing/enable' && req.method === 'POST') {
            cacheMiddleware.enableCoalescing();
            return ResponseHandler.sendJSON(res, { 
                message: 'Coalescing enabled',
                note: 'Duplicate requests will now wait for existing backend calls'
            });
        }

        if (req.url === '/__proxy/coalescing/disable' && req.method === 'POST') {
            cacheMiddleware.disableCoalescing();
            return ResponseHandler.sendJSON(res, { 
                message: 'Coalescing disabled', 
                note: 'All requests will check cache independently'
            });
        }

        if (req.url === '/__proxy/coalescing/status' && req.method === 'GET') {
            return ResponseHandler.sendJSON(res, { 
                message: 'Coalescing status endpoint - add detailed status in CacheMiddleware'
            });
        }

        //  Use coalescingMethod instead of checkCache
        const cachedResponse = await cacheMiddleware.coalescingMethod(req);

        if (cachedResponse) {
            // Cache HIT or coalesced response
            console.log(` Response time: ${Date.now() - startTime}ms`);
            ResponseHandler.sendCached(res, cachedResponse);
            return;
        }

        //  If coalescing is disabled and cache miss, use normal flow
        console.log(`Forwarding to backend (normal flow)`);
        requestHandler.forward(
            req,
            res,
            // Success callback
            (backendRes, body) => {
                // Store in cache
                cacheMiddleware.storeInCache(req, {
                    statusCode: backendRes.statusCode ?? 500,
                    headers: backendRes.headers,
                    body: body
                });

                // Send response to client
                ResponseHandler.sendFresh(res, {
                    statusCode: backendRes.statusCode ?? 500,
                    headers: backendRes.headers,
                    body: body
                });
            },
            // Error callback
            (err) => {
                console.error('Proxy error:', err);
                ResponseHandler.sendError(res, err);
            }
        );

    } catch (error) {
        console.error('Proxy error:', error);
        ResponseHandler.sendError(res, error);
    }
});

proxyServer.listen(PROXY_PORT, () => {
    console.log('='.repeat(50));
    console.log(` SMART CACHING PROXY RUNNING`);
    console.log(` Port: http://localhost:${PROXY_PORT}`);
    console.log(` Backend: ${backendURL}`);
    console.log(` Cache: LRU (10 items)`);
    console.log(` Coalescing: Disabled by default`);
    console.log(` Enable: POST /__proxy/coalescing/enable`);
    console.log(` Disable: POST /__proxy/coalescing/disable`);
    console.log(` Stats: GET /__proxy/stats`);
    console.log('='.repeat(50));
});

process.on('SIGINT', () => {
    console.log('\n Shutting down proxy...');
    proxyServer.close(() => {
        console.log(' Proxy server closed');
        process.exit(0);
    });
});