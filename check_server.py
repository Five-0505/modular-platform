import paramiko

SERVER = "192.168.3.27"
USER = "root"
PASSWORD = "zysoft@27"
PORT = "5001"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASSWORD)

commands = [
    f"lsof -i :{PORT}",
    f"netstat -tlnp | grep {PORT}",
    f"ps aux | grep SimpleHTTPServer | grep -v grep",
    "curl -s http://localhost:5001/ | head -5"
]

for cmd in commands:
    print(f"\n=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    output = stdout.read().decode('utf-8').strip()
    error = stderr.read().decode('utf-8').strip()
    if output:
        print(output)
    if error:
        print(f"ERROR: {error}")

client.close()