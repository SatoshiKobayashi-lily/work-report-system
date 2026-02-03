# デプロイ手順書

## 前提条件

- Ubuntu 22.04 LTS 以降
- ドメイン名（DNS設定済み）
- サーバーへのSSHアクセス

## 1. サーバー初期設定

```bash
# パッケージ更新
sudo apt update && sudo apt upgrade -y

# Node.js 20.x インストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 インストール
sudo npm install -g pm2

# Nginx インストール
sudo apt install -y nginx

# Certbot インストール
sudo apt install -y certbot python3-certbot-nginx
```

## 2. アプリケーションのデプロイ

```bash
# ディレクトリ作成
sudo mkdir -p /var/www/work-report-system
sudo chown -R $USER:$USER /var/www/work-report-system
cd /var/www/work-report-system

# ファイル転送（ローカルから）
# scp -r ./* user@server:/var/www/work-report-system/

# 依存関係インストール
npm install

# Prisma 設定
npx prisma generate
npx prisma migrate deploy

# ビルド
npm run build
```

## 3. Nginx 設定

```bash
# 設定ファイルをコピー（事前にドメイン名を編集）
sudo cp deploy/nginx.conf /etc/nginx/sites-available/work-report-system

# 有効化
sudo ln -s /etc/nginx/sites-available/work-report-system /etc/nginx/sites-enabled/

# 設定テスト
sudo nginx -t

# 再読み込み
sudo systemctl reload nginx
```

## 4. SSL証明書の取得（Let's Encrypt）

```bash
# 証明書取得（ドメインとメールを変更）
sudo certbot --nginx -d your-domain.com -m your-email@example.com --agree-tos

# 自動更新の確認
sudo certbot renew --dry-run
```

## 5. PM2 でアプリケーション起動

```bash
cd /var/www/work-report-system

# アプリケーション起動
pm2 start ecosystem.config.js

# 状態確認
pm2 status

# ログ確認
pm2 logs work-report-system

# 自動起動設定
pm2 save
pm2 startup
# 表示されるコマンドを実行
```

## 6. 動作確認

ブラウザで `https://your-domain.com` にアクセスして動作確認。

## 運用コマンド

```bash
# アプリケーション再起動
pm2 restart work-report-system

# アプリケーション停止
pm2 stop work-report-system

# ログ確認
pm2 logs work-report-system --lines 100

# Nginx ログ確認
sudo tail -f /var/log/nginx/work-report-system.access.log
sudo tail -f /var/log/nginx/work-report-system.error.log
```

## 更新デプロイ

```bash
cd /var/www/work-report-system

# 最新コードを取得（Gitの場合）
git pull

# 依存関係更新
npm install

# Prisma マイグレーション（スキーマ変更時）
npx prisma migrate deploy

# ビルド
npm run build

# アプリケーション再起動
pm2 restart work-report-system
```

## トラブルシューティング

### ポート3000が使用中
```bash
lsof -i :3000
kill -9 <PID>
```

### Nginx 502 Bad Gateway
```bash
# PM2 が起動しているか確認
pm2 status

# ログ確認
pm2 logs work-report-system
```

### SSL証明書の更新失敗
```bash
# 手動更新
sudo certbot renew

# Nginx 再起動
sudo systemctl restart nginx
```
