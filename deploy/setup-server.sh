#!/bin/bash
set -e

# ==============================================
# Ubuntu Server Setup Script for work-report-system
# Domain: sk-app-dev.lily-tech.net
# ==============================================

DOMAIN="sk-app-dev.lily-tech.net"
APP_DIR="/opt/work-report-system"
EMAIL="admin@lily-tech.net"  # Let's Encrypt通知用（変更してください）

echo "=========================================="
echo "1. システム更新"
echo "=========================================="
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim ufw software-properties-common

echo "=========================================="
echo "2. Dockerインストール"
echo "=========================================="
if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    sudo systemctl enable --now docker
    echo "Dockerをインストールしました。再ログインが必要です。"
else
    echo "Docker は既にインストール済みです"
fi

echo "=========================================="
echo "3. Nginxインストール"
echo "=========================================="
sudo apt install -y nginx
sudo systemctl enable nginx

echo "=========================================="
echo "4. Certbotインストール"
echo "=========================================="
sudo apt install -y certbot python3-certbot-nginx

echo "=========================================="
echo "5. ファイアウォール設定"
echo "=========================================="
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable
sudo ufw status

echo "=========================================="
echo "6. アプリディレクトリ作成"
echo "=========================================="
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

echo "=========================================="
echo "セットアップ完了！"
echo "=========================================="
echo ""
echo "次のステップ："
echo "1. 一度ログアウト・ログインしてdockerグループを有効化"
echo "2. アプリをデプロイ: ./deploy-app.sh"
echo ""
