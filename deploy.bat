@echo off
cd /d "d:\软件\Trae\专病管理平台\专科专病一体化平台\modular-platform"

echo 上传文件到服务器...
echo zysoft@27 | plink -ssh -l root -pw zysoft@27 192.168.3.27 "mkdir -p /zoesoft/ZOESD-DEMO"
pscp -pw zysoft@27 "专科一体化管理平台-standalone.html" root@192.168.3.27:/zoesoft/ZOESD-DEMO/index.html

echo 重启服务器...
echo zysoft@27 | plink -ssh -l root -pw zysoft@27 192.168.3.27 "pkill -f 'python.*5001' 2>/dev/null; cd /zoesoft/ZOESD-DEMO && nohup python -m SimpleHTTPServer 5001 > /dev/null 2>&1 &"

echo 部署完成!
echo 访问地址: http://192.168.3.27:5001/