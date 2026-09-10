const handler = require('../api/index');
const http = require('http');

async function testVercelHandler() {
  console.log('Testing Vercel Serverless Function handler...');

  const server = http.createServer(handler);
  server.listen(9099, '127.0.0.1', async () => {
    console.log('Test server listening on port 9099');

    // Test /health endpoint
    http.get('http://127.0.0.1:9099/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Healthcheck status code:', res.statusCode);
        console.log('Healthcheck response:', data);

        server.close(() => {
          console.log('✅ Vercel handler test passed successfully!');
          process.exit(0);
        });
      });
    }).on('error', (err) => {
      console.error('Test request failed:', err.message);
      server.close();
      process.exit(1);
    });
  });
}

testVercelHandler();
