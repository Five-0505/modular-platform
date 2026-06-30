import paramiko
import os

SERVER = "192.168.3.27"
USER = "root"
PASSWORD = "zysoft@27"
DEST_DIR = "/zoesoft/ZOESD-DEMO"
PORT = "5001"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASSWORD)

print("上传更新后的HTML文件...")
sftp = client.open_sftp()
sftp.put(os.path.join(LOCAL_DIR, "专科一体化管理平台-standalone.html"), f"{DEST_DIR}/index.html")
sftp.close()

print("重启服务...")
client.exec_command(f"pkill -f 'python.*{PORT}' 2>/dev/null")
import time
time.sleep(2)
client.exec_command(f"cd {DEST_DIR} && nohup python -m SimpleHTTPServer {PORT} > /dev/null 2>&1 &")

time.sleep(2)
stdin, stdout, stderr = client.exec_command(f"netstat -tlnp | grep {PORT}")
print("服务状态:", stdout.read().decode('utf-8').strip())

client.close()

print(f"\n更新完成！访问地址: http://{SERVER}:{PORT}/")