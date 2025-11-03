import * as http from 'http';





const PROXY_PORT = 8080;
const backendURL = 'http://localhost:3000';

const proxyServer = http.createServer(async(req: http.IncomingMessage, res: http.ServerResponse) => {
    const startTime = Date.now();
    const FrontendURL = req.url || '';
    console.log(`Received request from: ${FrontendURL} with method: ${req.method}`);


        try {
            
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'Hello from the proxy server!',
            requestedURL: FrontendURL,
            method: req.method,
            processingTime: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString(),

        }));
        } catch (error) {
            console.error('Error processing request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
});


proxyServer.listen(PROXY_PORT, () => {
    console.log('='.repeat(50));
    console.log(`Proxy server is running at http://localhost:${PROXY_PORT}`);
    console.log('='.repeat(50));

});

//graceful shutdown
process.on('SIGINT', () => {
  console.log('\n Shutting down proxy...');
  proxyServer.close(() => {
    console.log('Proxy server closed');
    process.exit(0);
  });
});