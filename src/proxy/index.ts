import * as http from 'http';
import { MemoryCache } from '../cache/InMemoryCache';
import { createCacheKey } from '../cache/InMemoryCache';

const memoryCache = new MemoryCache();

const PROXY_PORT = 8080;
const backendURL = 'http://localhost:3000';

const proxyServer = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const startTime = Date.now();

    console.log(`Proxy received : ${req.method} from ${req.url}`);
    try {
        const URL = req.url;

        {/*Search in the cache*/}
        const cacheKey = createCacheKey(req.method!, req.url!, req.headers);
        const cachedResponse = memoryCache.get(cacheKey);

        if (cachedResponse) {
            console.log(`Cache HIT for : ${cacheKey}`);
            res.writeHead(cachedResponse.statusCode, cachedResponse.headers);
            res.end(cachedResponse.body);
            return;
        }
        console.log(`Cache MISS for: ${cacheKey}`);


        {/*Cache MISS SEND TO BACKEND*/}
        const backendOption = {
            hostname: "localhost",
            port: 3000,
            path: URL,
            method: req.method,
            headers: req.headers,
        };

        const backendReq = http.request(backendOption, (backendRes) => {
            console.log(`Backend responded with: ${backendRes.statusCode}`);


            const chunks: Buffer[] = [];
            backendRes.on('data', (chunk) => chunks.push(chunk));
            backendRes.on('end', () => {
                const body = Buffer.concat(chunks);
                const responseTime = Date.now() - startTime;

                
                {/*Save data in the Cache for another GET REQUESTS*/}
                if (req.method === 'GET' && backendRes.statusCode === 200) {
                    const cacheEntry = {
                        statusCode: backendRes.statusCode!,
                        headers: backendRes.headers,
                        body: body,
                        timestamp: Date.now(),
                        ttl: 30000
                    };
                    memoryCache.set(cacheKey, cacheEntry);
                    console.log(`Stored in cache: ${cacheKey}`);
                    console.log(`Cache stats:`, memoryCache.getStats());
                }

                console.log(`Response time: ${responseTime}ms (from backend)`);
                res.writeHead(backendRes.statusCode ?? 500, backendRes.headers);
                res.end(body);
            });
        });

        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            req.pipe(backendReq);
        } else {
            backendReq.end();
        }

        backendReq.on('error', (err) => {
            console.error('Backend error:', err.message);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Backend service unavailable',
                message: err.message
            }));
        });

    } catch (error) {
        console.error('Proxy error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
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