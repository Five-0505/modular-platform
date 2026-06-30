$SERVER = "192.168.3.27"
$USER = "root"
$PASSWORD = "zysoft@27"
$DEST_DIR = "/zoesoft/ZOESD-DEMO"
$PORT = "5001"

$sshOpts = "-o StrictHostKeyChecking=no"
$scpOpts = "-o StrictHostKeyChecking=no"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  专科一体化管理平台 - 部署脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  服务器: $SERVER" -ForegroundColor Yellow
Write-Host "  目录: $DEST_DIR" -ForegroundColor Yellow
Write-Host "  端口: $PORT" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

try {
    Write-Host ""
    Write-Host "步骤1: 创建部署目录..." -ForegroundColor Green
    ssh $sshOpts "$USER@$SERVER" "mkdir -p $DEST_DIR && echo '目录创建成功'"

    Write-Host ""
    Write-Host "步骤2: 上传服务器脚本..." -ForegroundColor Green
    scp $scpOpts "server.js" "$USER@$SERVER`:$DEST_DIR/"

    Write-Host ""
    Write-Host "步骤3: 上传PM2配置..." -ForegroundColor Green
    scp $scpOpts "ecosystem.config.js" "$USER@$SERVER`:$DEST_DIR/"

    Write-Host ""
    Write-Host "步骤4: 上传HTML文件..." -ForegroundColor Green
    scp $scpOpts "专科一体化管理平台-standalone.html" "$USER@$SERVER`:$DEST_DIR/"

    Write-Host ""
    Write-Host "步骤5: 安装PM2..." -ForegroundColor Green
    ssh $sshOpts "$USER@$SERVER" "which pm2 || npm install -g pm2"

    Write-Host ""
    Write-Host "步骤6: 设置防火墙..." -ForegroundColor Green
    ssh $sshOpts "$USER@$SERVER" "firewall-cmd --zone=public --add-port=$PORT/tcp --permanent 2>/dev/null; firewall-cmd --reload 2>/dev/null; echo '防火墙配置完成'"

    Write-Host ""
    Write-Host "步骤7: 启动服务..." -ForegroundColor Green
    ssh $sshOpts "$USER@$SERVER" "cd $DEST_DIR && pm2 delete zoesd-demo 2>/dev/null; pm2 start ecosystem.config.js"

    Write-Host ""
    Write-Host "步骤8: 查看服务状态..." -ForegroundColor Green
    Start-Sleep -Seconds 2
    ssh $sshOpts "$USER@$SERVER" "pm2 list"

    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "  部署完成!" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "  访问地址: http://$SERVER`:$PORT/" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan

} catch {
    Write-Host "自动部署失败，请手动部署:" -ForegroundColor Red
    Write-Host "错误: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "手动部署步骤:" -ForegroundColor Cyan
    Write-Host "1. 登录服务器: ssh root@$SERVER" -ForegroundColor White
    Write-Host "2. 创建目录: mkdir -p $DEST_DIR" -ForegroundColor White
    Write-Host "3. 上传文件到 $DEST_DIR/" -ForegroundColor White
    Write-Host "4. 安装PM2: npm install -g pm2" -ForegroundColor White
    Write-Host "5. 设置防火墙: firewall-cmd --zone=public --add-port=$PORT/tcp --permanent && firewall-cmd --reload" -ForegroundColor White
    Write-Host "6. 启动服务: cd $DEST_DIR && pm2 start ecosystem.config.js" -ForegroundColor White
    Write-Host ""
    Write-Host "访问地址: http://$SERVER`:$PORT/" -ForegroundColor Green
}