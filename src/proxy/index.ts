import * as http from 'http';






  const PROXY_PORT = 8080;
  const backendURL = 'http://localhost:3000';

const proxyServer = http.createServer(async(req: http.IncomingMessage, res: http.ServerResponse) => {
      const time = Date.now()
      console.log(`Proxy received : ${req.method} from ${req.url}`);
      try {
          const URL = req.url;

          const backendOption = {
            hostname: "localhost",
            port: 3000,
            path: URL,
            method: req.method,
            headers: req.headers,
          }

            
            const backendReq = http.request(backendOption, (backendRes)=>{
              console.log(`Backend repsonded with:" ${backendRes.statusCode}`)
              //forward to backend
              res.writeHead(backendRes.statusCode ?? 500, backendRes.headers)
              backendRes.pipe(res)
             
            })
                  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                      req.pipe(backendReq);  // Pipe the request body to backend
                    } else {
                        backendReq.end();  
                  }

              backendReq.on('error', (err) => {
              console.error('❌ Backend error:', err.message);
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                error: 'Backend service unavailable',
                message: err.message 
            }));
        });

      } catch (error) {
        console.error('❌ Proxy error:', error);
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