import paramiko

SERVER = "192.168.3.27"
USER = "root"
PASSWORD = "zysoft@27"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASSWORD)

stdin, stdout, stderr = client.exec_command("grep -n '__MODULES__' /zoesoft/ZOESD-DEMO/index.html")
result = stdout.read().decode('utf-8').strip()
print("__MODULES__行号:", result if result else "未找到")

stdin, stdout, stderr = client.exec_command("wc -l /zoesoft/ZOESD-DEMO/index.html")
print("文件行数:", stdout.read().decode('utf-8').strip())

stdin, stdout, stderr = client.exec_command("ls -la /zoesoft/ZOESD-DEMO/index.html")
print("文件信息:", stdout.read().decode('utf-8').strip())

client.close()