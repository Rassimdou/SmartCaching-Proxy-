import * as http from 'http';
import { MemoryCache } from '../cache/LRU_cache';
import { CacheMiddleware } from '../middleware/CacheMiddleware';
import { RequestHandler } from './requestHandler';
import { ResponseHandler } from './responseHandler';

const memoryCache = new MemoryCache();
const cacheMiddleware = new CacheMiddleware(memoryCache);
const requestHandler = new RequestHandler('http://localhost:3000');

const PROXY_PORT = 8080;
const backendURL = 'http://localhost:3000';

const proxyServer = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    const startTime = Date.now();

    console.log(`Proxy received : ${req.method} from ${req.url}`);

    try {
        // enpoints for stats
        if (req.url === '/__proxy/stats') {
            const stats = cacheMiddleware.getStats();
            return ResponseHandler.sendJSON(res, stats);
        }

        // endpoint for clearing cache
        if (req.url === '/__proxy/clear' && req.method === 'POST') {
            cacheMiddleware.clearCache();
            return ResponseHandler.sendJSON(res, { message: 'Cache cleared' });
        }

        // Step 1: Search in the cache
        const cachedResponse = cacheMiddleware.checkCache(req);

        if (cachedResponse) {
            // Cache HIT - send cached response
            ResponseHandler.sendCached(res, cachedResponse);
            return;
        }

        // cache miss > send to backend 
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

                //  Send response to client
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
    console.log(`Proxy server is running at http://localhost:${PROXY_PORT}`);
    console.log('='.repeat(50));
});

process.on('SIGINT', () => {
    console.log('\n Shutting down proxy...');
    proxyServer.close(() => {
        console.log('Proxy server closed');
        process.exit(0);
    });
});
