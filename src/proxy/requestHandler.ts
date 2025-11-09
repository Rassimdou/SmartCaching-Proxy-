import * as http from 'http';

export class RequestHandler {
    private backendURL: string;

    constructor(backendURL: string) {
        this.backendURL = backendURL;
    }

    
     // Forward request to backend server using Callback 
     
    forward(
        req: http.IncomingMessage, 
        res: http.ServerResponse,
        onSuccess: (backendRes: http.IncomingMessage, body: Buffer) => void,
        onError: (err: Error) => void
    ): void {
        const startTime = Date.now();

        const backendOption = {
            hostname: "localhost",
            port: 3000,
            path: req.url,
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
                console.log(`Response time: ${responseTime}ms (from backend)`);
                onSuccess(backendRes, body);
            });
        });

        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            req.pipe(backendReq);
        } else {
            backendReq.end();
        }

        backendReq.on('error', (err) => {
            console.error('Backend error:', err.message);
            onError(err);
        });
    }

    
      //  Promise-based tari9a for coalescing
     
    async forwardPromise(req: http.IncomingMessage): Promise<{ 
        backendRes: http.IncomingMessage; 
        body: Buffer 
    }> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const backendOption = {
                hostname: "localhost",
                port: 3000,
                path: req.url,
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
                    console.log(`Response time: ${responseTime}ms (from backend - coalescing)`);
                    
                    resolve({ backendRes, body });
                });
            });

            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                req.pipe(backendReq);
            } else {
                backendReq.end();
            }

            backendReq.on('error', (err) => {
                console.error('Backend error (coalescing):', err.message);
                reject(err);
            });

            // Timeout protection
            setTimeout(() => {
                reject(new Error('Backend request timeout'));
                backendReq.destroy();
            }, 30000);
        });
    }
}