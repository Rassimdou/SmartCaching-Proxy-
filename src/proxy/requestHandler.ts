import * as http from 'http';

export class RequestHandler {
    private backendURL: string;

    constructor(backendURL: string) {
        this.backendURL = backendURL;
    }

    /**
     * Forward request to backend server - USING YOUR EXACT LOGIC (NO PROMISES!)
     */
    forward(
        req: http.IncomingMessage, 
        res: http.ServerResponse,
        onSuccess: (backendRes: http.IncomingMessage, body: Buffer) => void,
        onError: (err: Error) => void
    ): void {
        const startTime = Date.now();

        // Your exact backendOption logic
        const backendOption = {
            hostname: "localhost",
            port: 3000,
            path: req.url,
            method: req.method,
            headers: req.headers,
        };

        const backendReq = http.request(backendOption, (backendRes) => {
            console.log(`Backend responded with: ${backendRes.statusCode}`);

            // Your exact chunks logic
            const chunks: Buffer[] = [];
            backendRes.on('data', (chunk) => chunks.push(chunk));
            backendRes.on('end', () => {
                const body = Buffer.concat(chunks);
                const responseTime = Date.now() - startTime;

                console.log(`Response time: ${responseTime}ms (from backend)`);

                // Call the success callback
                onSuccess(backendRes, body);
            });
        });

        // Your exact POST/PUT/PATCH logic
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            req.pipe(backendReq);
        } else {
            backendReq.end();
        }

        // Your exact error handling
        backendReq.on('error', (err) => {
            console.error('Backend error:', err.message);
            onError(err);
        });
    }
}