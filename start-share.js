const { spawn } = require('child_process');
const path = require('path');

const BASE_DIR = path.dirname(__filename);

const serverProcess = spawn('node', [path.join(BASE_DIR, 'share-server.js')], {
  cwd: BASE_DIR,
  stdio: 'inherit'
});

const gatewayProcess = spawn('node', [path.join(BASE_DIR, 'share-gateway.js')], {
  cwd: BASE_DIR,
  stdio: 'inherit'
});

console.log('\n========================================');
console.log('  分享服务已启动');
console.log('========================================');
console.log('  服务器: share-server.js');
console.log('  网关:    share-gateway.js');
console.log('========================================');
console.log('  按 Ctrl+C 停止所有服务');
console.log('========================================\n');

process.on('SIGINT', () => {
  console.log('\n正在停止服务...');
  
  serverProcess.kill();
  gatewayProcess.kill();
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.log('分享服务器异常退出 (code:', code + ')');
  }
});

gatewayProcess.on('exit', (code) => {
  if (code !== 0) {
    console.log('分享网关异常退出 (code:', code + ')');
  }
});