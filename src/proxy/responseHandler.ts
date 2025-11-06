import * as http from 'http';
import { CachedResponse } from '../cache/InMemoryCache';

interface BackendResponse {
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: Buffer;
}

export class ResponseHandler {
    /**
     * Send cached response - USING YOUR EXACT LOGIC
     */
    static sendCached(res: http.ServerResponse, cachedResponse: CachedResponse): void {
        // Your exact writeHead and end logic
        res.writeHead(cachedResponse.statusCode, cachedResponse.headers);
        res.end(cachedResponse.body);
    }

    /**
     * Send fresh response from backend - USING YOUR EXACT LOGIC
     */
    static sendFresh(
        res: http.ServerResponse,
        backendResponse: BackendResponse
    ): void {
        // Your exact writeHead and end logic
        res.writeHead(backendResponse.statusCode, backendResponse.headers);
        res.end(backendResponse.body);
    }

    /**
     * Send error response - USING YOUR EXACT LOGIC
     */
    static sendError(res: http.ServerResponse, error: any): void {
        // Your exact error response logic
        res.writeHead(error.statusCode || 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: error.message || 'Internal Server Error',
            details: error.error
        }));
    }

    /**
     * Send JSON response (for stats endpoint)
     */
    static sendJSON(res: http.ServerResponse, data: any): void {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    }
}
