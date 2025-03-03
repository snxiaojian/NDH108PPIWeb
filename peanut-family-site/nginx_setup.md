
# Nginx 配置指南

## 系统要求
- 操作系统：Debian 11 (Bullseye)
- IP地址：37.123.192.87
- 访问路径：/peanut_family

## 安装步骤

1. 安装Nginx：
```bash
sudo apt update
sudo apt install nginx
```

2. 创建网站目录：
```bash
sudo mkdir -p /var/www/peanut_family
```

3. 复制网站文件：
```bash
sudo cp -r /home/sunxiaojian/project/花生网站/* root@37.123.192.87:/var/www/peanut_family
```

4. 设置目录权限：
```bash
sudo chown -R www-data:www-data /var/www/peanut_family
sudo chmod -R 755 /var/www/peanut_family
```

5. 创建Nginx配置文件：
```bash
sudo vi /etc/nginx/sites-available/peanut_family
```

6. 配置文件内容：
```nginx
server {
    listen 80;
    server_name 37.123.192.87;

    location /peanut_family {
        alias /var/www/peanut_family;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
```

7. 启用站点配置：
```bash
sudo ln -s /etc/nginx/sites-available/peanut_family /etc/nginx/sites-enabled/
```

8. 测试Nginx配置：
```bash
sudo nginx -t
```

9. 重启Nginx服务：
```bash
sudo systemctl restart nginx
```

10. 配置防火墙：
```bash
sudo ufw allow 'Nginx Full'
```

## 访问测试
完成配置后，可通过以下URL访问网站：
http://37.123.192.87/peanut_family
