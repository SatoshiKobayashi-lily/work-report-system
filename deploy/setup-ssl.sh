#!/bin/bash
set -e

# ==============================================
# SSL Certificate Setup Script
# ==============================================

DOMAIN="sk-app-dev.lily-tech.net"
EMAIL="admin@lily-tech.net"  # 変更してください
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "DNS確認中..."
echo "=========================================="
SERVER_IP=$(curl -s ifconfig.me)
DNS_IP=$(dig +short $DOMAIN | head -1)

echo "サーバーIP: $SERVER_IP"
echo "DNS解決IP: $DNS_IP"

if [ "$SERVER_IP" != "$DNS_IP" ]; then
    echo ""
    echo "⚠️  警告: DNSがこのサーバーを指していません！"
    echo "Aレコードが正しく設定されるまで待ってください。"
    echo ""
    read -p "続行しますか？ (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        exit 1
    fi
fi

echo "=========================================="
echo "1. SSL証明書を取得"
echo "=========================================="
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

echo "=========================================="
echo "2. 自動更新フック設定"
echo "=========================================="
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

echo "=========================================="
echo "3. 自動更新テスト"
echo "=========================================="
sudo certbot renew --dry-run

echo "=========================================="
echo "HTTPS設定完了！"
echo "=========================================="
echo ""
echo "https://$DOMAIN でアクセスできます"
echo ""
echo "証明書情報確認: sudo certbot certificates"
echo ""
