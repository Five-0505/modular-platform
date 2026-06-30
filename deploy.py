import paramiko
import os

SERVER = "192.168.3.27"
USER = "root"
PASSWORD = "zysoft@27"
DEST_DIR = "/zoesoft/ZOESD-DEMO"
PORT = "5001"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

def ssh_exec(client, cmd, description):
    print(f"\n{description}")
    try:
        stdin, stdout, stderr = client.exec_command(cmd)
        output = stdout.read().decode('utf-8').strip()
        error = stderr.read().decode('utf-8').strip()
        if output:
            print(f"  输出: {output}")
        if error:
            print(f"  错误: {error}")
        return output
    except Exception as e:
        print(f"  失败: {e}")
        return None

def scp_upload(client, local_file, remote_path):
    print(f"\n上传文件: {local_file} -> {remote_path}")
    try:
        sftp = client.open_sftp()
        sftp.put(local_file, remote_path)
        sftp.close()
        print("  上传成功")
    except Exception as e:
        print(f"  失败: {e}")

print("=" * 50)
print("  专科一体化管理平台 - 部署脚本")
print("=" * 50)
print(f"  服务器: {SERVER}")
print(f"  目录: {DEST_DIR}")
print(f"  端口: {PORT}")
print("=" * 50)

try:
    print("\n连接服务器...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER, username=USER, password=PASSWORD)
    
    ssh_exec(client, f"mkdir -p {DEST_DIR}", "步骤1: 创建部署目录")
    
    scp_upload(client, os.path.join(LOCAL_DIR, "专科一体化管理平台-standalone.html"), f"{DEST_DIR}/index.html")
    
    ssh_exec(client, f"firewall-cmd --zone=public --add-port={PORT}/tcp --permanent 2>/dev/null; firewall-cmd --reload 2>/dev/null; echo '防火墙配置完成'", "步骤2: 设置防火墙")
    
    ssh_exec(client, f"pkill -f 'python.*{PORT}' 2>/dev/null; echo '已清理旧进程'", "步骤3: 清理旧进程")
    
    ssh_exec(client, f"cd {DEST_DIR} && nohup python -m SimpleHTTPServer {PORT} > /dev/null 2>&1 &", "步骤4: 启动Python HTTP服务器")
    
    print("\n步骤5: 查看服务状态")
    ssh_exec(client, f"sleep 2 && lsof -i :{PORT} || netstat -tlnp | grep {PORT}", "")
    
    ssh_exec(client, f"ps aux | grep SimpleHTTPServer | grep -v grep", "")
    
    client.close()
    
    print("\n" + "=" * 50)
    print("  部署完成!")
    print("=" * 50)
    print(f"  访问地址: http://{SERVER}:{PORT}/")
    print("=" * 50)
    
except Exception as e:
    print(f"\n部署失败: {e}")
    print("\n手动部署步骤:")
    print(f"1. 登录服务器: ssh root@{SERVER}")
    print(f"2. 创建目录: mkdir -p {DEST_DIR}")
    print(f"3. 上传文件到 {DEST_DIR}/ 并命名为 index.html")
    print(f"4. 设置防火墙: firewall-cmd --zone=public --add-port={PORT}/tcp --permanent && firewall-cmd --reload")
    print(f"5. 启动服务: cd {DEST_DIR} && nohup python -m SimpleHTTPServer {PORT} > /dev/null 2>&1 &")
    print(f"\n访问地址: http://{SERVER}:{PORT}/")