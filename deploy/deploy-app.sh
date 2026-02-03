#!/bin/bash
set -e

# ==============================================
# Deploy Application Script
# ==============================================

DOMAIN="sk-app-dev.lily-tech.net"
APP_DIR="/opt/work-report-system"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "1. アプリケーションをデプロイディレクトリにコピー"
echo "=========================================="
# 親ディレクトリ（プロジェクトルート）からコピー
cd "$SCRIPT_DIR/.."
sudo cp -r Dockerfile docker-compose.yml .dockerignore package*.json next.config.ts tsconfig.json src public "$APP_DIR/"
sudo chown -R $USER:$USER "$APP_DIR"

echo "=========================================="
echo "2. Dockerイメージをビルド・起動"
echo "=========================================="
cd "$APP_DIR"
docker compose down || true
docker compose build --no-cache
docker compose up -d

echo "=========================================="
echo "3. Nginx初期設定（HTTP）"
echo "=========================================="
sudo rm -f /etc/nginx/sites-enabled/default
sudo cp "$SCRIPT_DIR/nginx-initial.conf" /etc/nginx/sites-available/$DOMAIN
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "=========================================="
echo "アプリケーションがデプロイされました！"
echo "=========================================="
echo ""
echo "現在 http://$DOMAIN でアクセス可能です（HTTPのみ）"
echo ""
echo "次のステップ："
echo "1. DNS Aレコードがこのサーバーに向いていることを確認"
echo "2. HTTPS化: ./setup-ssl.sh を実行"
echo ""
