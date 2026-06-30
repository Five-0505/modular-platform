#!/bin/bash

SERVER="192.168.3.27"
USER="root"
PASSWORD="zysoft@27"
DEST_DIR="/zoesoft/ZOESD-DEMO"
PORT="5001"

echo "========================================="
echo "  开始部署专科一体化管理平台"
echo "========================================="
echo "  服务器: $SERVER"
echo "  目录: $DEST_DIR"
echo "  端口: $PORT"
echo "========================================="

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $USER@$SERVER << 'EOF'

DEST_DIR="/zoesoft/ZOESD-DEMO"
PORT="5001"

echo "1. 创建部署目录..."
mkdir -p $DEST_DIR

echo "2. 检查并停止旧服务..."
pm2 delete zoesd-demo 2>/dev/null || true
sleep 2

echo "3. 清理旧文件..."
rm -rf $DEST_DIR/*

echo "4. 创建服务器脚本..."
cat > $DEST_DIR/server.js << 'SERVEREOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5001;
const BASE_DIR = __dirname;

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

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './专科一体化管理平台-standalone.html';
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(path.join(BASE_DIR, filePath), (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>', 'utf-8');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use!`);
    process.exit(1);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}/`);
});
SERVEREOF

echo "5. 安装 PM2（如果未安装）..."
which pm2 > /dev/null 2>&1 || npm install -g pm2

echo "6. 设置环境变量..."
echo "export PORT=$PORT" > $DEST_DIR/.env

echo "7. 配置 PM2 进程..."
cat > $DEST_DIR/ecosystem.config.js << ECOSYSTEMEOF
module.exports = {
  apps: [{
    name: 'zoesd-demo',
    script: 'server.js',
    cwd: '$DEST_DIR',
    env: {
      PORT: '$PORT',
      NODE_ENV: 'production'
    },
    max_memory_restart: '256M',
    restart_delay: 5000,
    watch: false
  }]
};
ECOSYSTEMEOF

echo "8. 设置端口防火墙规则..."
firewall-cmd --zone=public --add-port=$PORT/tcp --permanent 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

echo "部署准备完成!"
EOF

echo "9. 上传独立HTML文件..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "专科一体化管理平台-standalone.html" $USER@$SERVER:$DEST_DIR/

echo "10. 启动服务..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $USER@$SERVER "cd $DEST_DIR && pm2 start ecosystem.config.js"

echo "11. 查看服务状态..."
sleep 3
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $USER@$SERVER "pm2 list"

echo ""
echo "========================================="
echo "  部署完成!"
echo "========================================="
echo "  访问地址: http://$SERVER:$PORT/"
echo "========================================="