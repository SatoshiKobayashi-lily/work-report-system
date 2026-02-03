#!/bin/bash

# ==============================================
# 運用チェックスクリプト
# ==============================================

DOMAIN="sk-app-dev.lily-tech.net"

echo "=========================================="
echo "サービス状態"
echo "=========================================="
echo "--- Docker ---"
sudo systemctl is-active docker
docker ps

echo ""
echo "--- Nginx ---"
sudo systemctl is-active nginx

echo ""
echo "--- Certbot Timer ---"
sudo systemctl is-active certbot.timer

echo ""
echo "=========================================="
echo "SSL証明書情報"
echo "=========================================="
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    sudo certbot certificates
    echo ""
    echo "--- 有効期限 ---"
    echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates
else
    echo "SSL証明書はまだ設定されていません"
fi

echo ""
echo "=========================================="
echo "アプリケーション状態"
echo "=========================================="
echo "--- ローカル接続テスト ---"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000 || echo "接続失敗"

echo ""
echo "--- コンテナログ（最新10行）---"
docker logs --tail 10 work-report-system 2>/dev/null || echo "コンテナが見つかりません"

echo ""
echo "=========================================="
echo "証明書更新テスト"
echo "=========================================="
echo "実行コマンド: sudo certbot renew --dry-run"
