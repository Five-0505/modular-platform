module.exports = {
  apps: [{
    name: 'zoesd-demo',
    script: 'server.js',
    cwd: '/zoesoft/ZOESD-DEMO',
    env: {
      PORT: '5001',
      NODE_ENV: 'production'
    },
    max_memory_restart: '256M',
    restart_delay: 5000,
    watch: false
  }]
};