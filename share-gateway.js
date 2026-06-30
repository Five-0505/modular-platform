const http = require('http');
const fs = require('fs');
const path = require('path');

const GATEWAY_PORT = 3456;
const BASE_DIR = path.dirname(__filename);
const CONFIG_FILE = path.join(BASE_DIR, 'share-config.json');

let targetPort = null;
let configTimestamp = 0;

function loadConfig() {
  try {
    const stat = fs.statSync(CONFIG_FILE);
    if (stat.mtime.getTime() > configTimestamp) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      targetPort = config.port;
      configTimestamp = stat.mtime.getTime();
      console.log(`配置已更新: 目标端口 -> ${targetPort}`);
    }
  } catch (err) {
    console.log('等待分享服务器启动...');
  }
}

setInterval(loadConfig, 3000);
loadConfig();

function proxyRequest(req, res) {
  if (!targetPort) {
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>服务未就绪</title><style>body{font-family:sans-serif;text-align:center;margin-top:100px;color:#666}</style></head>
        <body>
          <h1>服务未就绪</h1>
          <p>请先启动分享服务器 (share-server.js)</p>
          <p style="font-size:12px;color:#999;margin-top:20px">正在尝试重新连接...</p>
        </body>
      </html>
    `);
    return;
  }

  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.log('代理错误:', err.message);
    res.writeHead(502, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>连接失败</title><style>body{font-family:sans-serif;text-align:center;margin-top:100px;color:#666}</style></head>
        <body>
          <h1>连接失败</h1>
          <p>无法连接到后端服务器</p>
          <p style="font-size:12px;color:#999;margin-top:20px">正在尝试重新连接...</p>
        </body>
      </html>
    `);
  });

  req.pipe(proxy, { end: true });
}

const server = http.createServer(proxyRequest);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`错误: 网关端口 ${GATEWAY_PORT} 被占用！`);
    console.error('请关闭占用该端口的程序或修改 share-gateway.js 中的端口配置');
    process.exit(1);
  }
  console.error('服务器错误:', err);
});

server.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('  分享网关服务已启动');
  console.log('========================================');
  console.log(`  网关地址: http://0.0.0.0:${GATEWAY_PORT}/`);
  console.log('========================================');
  console.log('  按 Ctrl+C 停止网关');
  console.log('========================================\n');
});

process.on('SIGINT', () => {
  console.log('\n网关正在关闭...');
  server.close(() => {
    process.exit(0);
  });
});