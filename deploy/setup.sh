#!/bin/bash

# =============================================================================
# Ubuntu サーバーセットアップスクリプト
# 作業レポート管理システム - デプロイ手順
# =============================================================================

set -e

# 設定値（デプロイ前に変更してください）
DOMAIN="your-domain.com"          # 実際のドメイン名に変更
APP_DIR="/var/www/work-report-system"
EMAIL="your-email@example.com"    # Let's Encrypt 用メールアドレス

echo "=== 1. システムパッケージの更新 ==="
sudo apt update && sudo apt upgrade -y

echo "=== 2. Node.js のインストール (v20) ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "=== 3. PM2 のインストール ==="
sudo npm install -g pm2

echo "=== 4. Nginx のインストール ==="
sudo apt install -y nginx

echo "=== 5. Certbot (Let's Encrypt) のインストール ==="
sudo apt install -y certbot python3-certbot-nginx

echo "=== 6. アプリケーションディレクトリの作成 ==="
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

echo "=== 7. アプリケーションのデプロイ ==="
echo "以下のコマンドでアプリケーションをデプロイしてください："
echo ""
echo "  # ローカルからサーバーへファイル転送"
echo "  scp -r ./* user@server:$APP_DIR/"
echo ""
echo "  # または Git からクローン"
echo "  cd $APP_DIR"
echo "  git clone <your-repo-url> ."
echo ""

echo "=== 8. アプリケーションのビルド ==="
echo "サーバー上で以下を実行："
echo ""
echo "  cd $APP_DIR"
echo "  npm install"
echo "  npx prisma generate"
echo "  npx prisma migrate deploy"
echo "  npm run build"
echo ""

echo "=== 9. Nginx 設定 ==="
echo "nginx.conf を編集してドメインを設定後、以下を実行："
echo ""
echo "  sudo cp deploy/nginx.conf /etc/nginx/sites-available/work-report-system"
echo "  sudo ln -s /etc/nginx/sites-available/work-report-system /etc/nginx/sites-enabled/"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""

echo "=== 10. SSL証明書の取得 ==="
echo "  sudo certbot --nginx -d $DOMAIN -m $EMAIL --agree-tos"
echo ""

echo "=== 11. PM2 でアプリケーション起動 ==="
echo "  cd $APP_DIR"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save"
echo "  pm2 startup  # 表示されるコマンドを実行"
echo ""

echo "=== セットアップ手順の表示完了 ==="
