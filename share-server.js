const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT_START = 7777;
const PORT_END = 7799;
const BASE_DIR = path.dirname(__filename);
const CONFIG_FILE = path.join(BASE_DIR, 'share-config.json');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function getLocalIP() {
  const interfaces = require('os').networkInterfaces();
  const privateRanges = [
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./
  ];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        for (const range of privateRanges) {
          if (range.test(iface.address)) {
            return iface.address;
          }
        }
      }
    }
  }
  return '127.0.0.1';
}

function writeConfig(port) {
  const config = {
    port: port,
    localIP: getLocalIP(),
    timestamp: Date.now()
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  return config;
}

function tryListen(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = '.' + req.url;
      if (filePath === './') filePath = './index.html';
      
      if (req.url === '/api/share-info') {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          localUrl: `http://127.0.0.1:${config.port}/`,
          networkUrl: `http://${config.localIP}:${config.port}/`,
          gatewayUrl: `http://${config.localIP}:3456/`,
          port: config.port,
          ip: config.localIP
        }));
        return;
      }

      const extname = String(path.extname(filePath)).toLowerCase();
      const contentType = MIME_TYPES[extname] || 'application/octet-stream';

      fs.readFile(filePath, (error, content) => {
        if (error) {
          if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>', 'utf-8');
          } else {
            res.writeHead(500);
            res.end('Server Error: ' + error.code);
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    server.on('error', (err) => {
      server.close();
      reject(err);
    });

    server.listen(port, '0.0.0.0', () => {
      resolve(server);
    });
  });
}

async function startServer() {
  for (let port = PORT_START; port <= PORT_END; port++) {
    try {
      const server = await tryListen(port);
      const config = writeConfig(port);
      console.log('\n========================================');
      console.log('  专科一体化管理平台 - 分享服务器已启动');
      console.log('========================================');
      console.log(`  本地访问: http://127.0.0.1:${port}/`);
      console.log(`  局域网访问: http://${config.localIP}:${port}/`);
      console.log(`  稳定分享链接: http://${config.localIP}:3456/`);
      console.log('========================================');
      console.log('  按 Ctrl+C 停止服务器');
      console.log('========================================\n');
      
      process.on('SIGINT', () => {
        console.log('\n服务器正在关闭...');
        server.close(() => {
          process.exit(0);
        });
      });

      return server;
    } catch (err) {
      console.log(`端口 ${port} 被占用，尝试下一个端口...`);
    }
  }

  console.error('\n错误: 所有端口（' + PORT_START + ' - ' + PORT_END + '）都被占用！');
  process.exit(1);
}

startServer().catch(console.error);