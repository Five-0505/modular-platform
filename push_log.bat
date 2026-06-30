@echo off
cd /d "d:\软件\Trae\专病管理平台\专科专病一体化平台\modular-platform"
"C:\Program Files\Git\bin\git.exe" push -u origin master --verbose > push_output.txt 2>&1
type push_output.txt