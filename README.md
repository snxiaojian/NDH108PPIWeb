# NDH108 蛋白质相互作用网站部署文档

## 系统要求
- Ubuntu 20.04 LTS
- Node.js 16+ (推荐使用 nvm 安装)
- Nginx
- PM2 (用于管理 Node.js 进程)

## 1. 基础环境配置

### 1.1 更新系统
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 安装 Node.js
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装 Node.js
nvm install 16
nvm use 16

# 安装 PM2
npm install -g pm2
```

### 1.3 安装 Nginx
```bash
sudo apt install nginx -y
```

## 2. 部署 peanut_interaction 网站

### 2.1 准备项目文件
```bash
# 创建部署目录
sudo mkdir -p /var/www/peanut_interaction
sudo chown -R $USER:$USER /var/www/peanut_interaction

# 创建数据目录
sudo mkdir -p /var/www/peanut_interaction/server/data
sudo chown -R $USER:$USER /var/www/peanut_interaction/server/data

# 复制构建文件和服务器文件
cp -r protein-interaction-site/build/* /var/www/peanut_interaction/
cp -r protein-interaction-site/server/* /var/www/peanut_interaction/server/

# 复制必要的数据文件
cp protein-interaction-site/server/data/* /var/www/peanut_interaction/server/data/

scp -r build/* root@37.123.192.87:/var/www/peanut_interaction/
scp -r server root@37.123.192.87:/var/www/peanut_interaction/
```

### 2.2 安装后端依赖
```bash
cd /var/www/peanut_interaction/server
npm install --production
```

### 2.3 启动后端服务
```bash
pm2 start index.js --name "peanut-interaction-api"
```

## 3. 部署 peanut_family 网站

### 3.1 准备项目文件
```bash
# 创建部署目录
sudo mkdir -p /var/www/peanut_family
sudo chown -R $USER:$USER /var/www/peanut_family

# 复制网站文件
cp -r peanut-family-site/* /var/www/peanut_family/
```

## 4. Nginx 配置

### 4.1 创建 Nginx 配置文件
```bash
sudo vi /etc/nginx/sites-available/peanut_sites
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name 37.123.192.87;

    # peanut_interaction 配置
    location /peanut_interaction/ {
        alias /var/www/peanut_interaction/;
        try_files $uri $uri/ /peanut_interaction/index.html;
    }

    # peanut_interaction 静态资源
    location /static/ {
        alias /var/www/peanut_interaction/static/;
        try_files $uri $uri/ =404;
    }

    # peanut_interaction API 配置
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # peanut_family 配置
    location /peanut_family/ {
        alias /var/www/peanut_family/;
        try_files $uri $uri/ /peanut_family/index.html;
    }

    # 禁止访问 . 文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 4.2 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/peanut_sites /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. 验证部署

访问以下地址验证部署是否成功：
- peanut_family: http://37.123.192.87/peanut_family
- peanut_interaction: http://37.123.192.87/peanut_interaction

## 6. 维护命令

### 6.1 查看 API 服务状态
```bash
pm2 status
pm2 logs peanut-interaction-api
```

### 6.2 重启服务
```bash
# 重启 API 服务
pm2 restart peanut-interaction-api

# 重启 Nginx
sudo systemctl restart nginx
```

### 6.3 查看日志
```bash
# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# API 服务日志
pm2 logs peanut-interaction-api
```

## 注意事项
1. 确保服务器防火墙允许 80 端口访问
2. 建议配置 SSL 证书启用 HTTPS
3. 定期备份数据和配置文件
4. 监控服务器资源使用情况，特别是内存使用
5. 数据文件已经包含在项目中，确保它们被正确复制到 server/data 目录