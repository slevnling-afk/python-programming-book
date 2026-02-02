# Python 编程书部署文档

## 部署方案概述

本项目使用 **Node.js http-server + pm2** 方案部署，实现：
- 内网访问
- 关闭终端不会停止服务
- 开机自动启动

## 服务信息

| 项目 | 值 |
|------|-----|
| 服务名称 | python-book |
| 端口 | 8888 |
| 绑定地址 | 0.0.0.0 (所有网卡) |
| 文档目录 | `docs/_build/html` |

## 访问地址

内网其他电脑通过以下地址访问（根据你的网络环境选择）：

- **以太网**: http://172.16.10.96:8888
- **ZeroTier**: http://10.147.17.84:8888
- **本机**: http://127.0.0.1:8888

> 注意：IP 地址可能会变化，可通过 `ipconfig` 命令查看当前 IP

---

## 常用命令

### 查看服务状态
```bash
pm2 status
```

### 查看日志
```bash
pm2 logs python-book
```

### 重启服务
```bash
pm2 restart python-book
```

### 停止服务
```bash
pm2 stop python-book
```

### 启动服务（如果已停止）
```bash
pm2 start python-book
```

---

## 应急启动方式

如果 pm2 服务异常或需要手动启动，可使用以下方式：

### 方式 1：重新加载 pm2 配置
```bash
pm2 resurrect
```

### 方式 2：完全重新启动 pm2 服务
```bash
pm2 start "C:\Users\Admin\AppData\Roaming\npm\node_modules\http-server\bin\http-server" --name "python-book" -- "d:\OneDrive\hnswzy_share\授课\python_programming_book_sphinx_template\docs\_build\html" -a 0.0.0.0 -p 8888 -c-1
pm2 save
```

### 方式 3：临时快速启动（不依赖 pm2）
```bash
cd "d:\OneDrive\hnswzy_share\授课\python_programming_book_sphinx_template\docs\_build\html"
http-server -a 0.0.0.0 -p 8888
```
> 注意：此方式关闭终端后服务会停止

### 方式 4：Python 临时服务器（备用）
```bash
cd "d:\OneDrive\hnswzy_share\授课\python_programming_book_sphinx_template\docs\_build\html"
python -m http.server 8080 --bind 0.0.0.0
```

---

## 更新文档后重新构建

1. 编辑 `docs/` 目录下的 `.md` 文件
2. 重新构建 HTML：
   ```bash
   cd docs
   sphinx-build -b html . _build/html
   ```
3. 浏览器刷新即可看到更新（无需重启服务）

---

## 故障排查

### 端口被占用
```bash
# 查看占用端口的进程
netstat -ano | findstr ":8888"

# 杀掉进程（替换 PID 为实际进程号）
powershell -Command "Stop-Process -Id <PID> -Force"
```

### pm2 开机自启失效
```bash
# 重新设置开机自启
pm2-startup install
pm2 save
```

### 查看 pm2 配置文件位置
- 进程配置：`C:\Users\Admin\.pm2\dump.pm2`
- 日志目录：`C:\Users\Admin\.pm2\logs\`

---

## 技术栈

- **Node.js**: v22.11.0
- **http-server**: v14.1.1
- **pm2**: 进程管理器
- **pm2-windows-startup**: Windows 开机自启支持

---

*文档生成时间：2026-02-02*
