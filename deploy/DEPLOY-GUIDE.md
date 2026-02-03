# work-report-system デプロイ手順書

**ドメイン:** `sk-app-dev.lily-tech.net`

---

## 1. AWS EC2 インスタンス作成

### AWSコンソールでの操作

1. **EC2ダッシュボード** → **インスタンスを起動**

2. **設定内容:**
   | 項目 | 設定値 |
   |------|--------|
   | 名前 | work-report-system |
   | AMI | Ubuntu Server 24.04 LTS (64-bit x86) |
   | インスタンスタイプ | t2.micro (無料枠対象) |
   | キーペア | 新規作成または既存を選択 |
   | ネットワーク設定 | パブリックIPを自動割り当て: 有効 |

3. **セキュリティグループ設定:**
   | タイプ | ポート | ソース |
   |--------|--------|--------|
   | SSH | 22 | マイIP (または会社IP) |
   | HTTP | 80 | 0.0.0.0/0 |
   | HTTPS | 443 | 0.0.0.0/0 |

4. **ストレージ:** 8GB以上（無料枠は30GBまで）

5. **インスタンスを起動**

### Elastic IP（固定IP）の取得

1. **EC2** → **Elastic IP** → **Elastic IP アドレスの割り当て**
2. 割り当てたIPをインスタンスに関連付け
3. **このIPアドレスを会社に連絡してAレコード設定を依頼**

---

## 2. サーバーへ接続

```bash
# キーペアのパーミッション設定（初回のみ）
chmod 400 your-key.pem

# SSH接続
ssh -i your-key.pem ubuntu@<Elastic IP>
```

---

## 3. プロジェクトをサーバーにアップロード

**ローカルPC（Windows）で実行:**

```bash
# SCPでアップロード
scp -i your-key.pem -r ./work-report-system ubuntu@<Elastic IP>:/home/ubuntu/
```

または Git を使用:

```bash
# サーバー上で
git clone <your-repository-url> /home/ubuntu/work-report-system
```

---

## 4. サーバーセットアップ実行

```bash
# サーバーにSSH接続後
cd /home/ubuntu/work-report-system/deploy

# 実行権限付与
chmod +x *.sh

# サーバーセットアップ
./setup-server.sh
```

⚠️ **セットアップ完了後、一度ログアウト・再ログインしてdockerグループを有効化**

```bash
exit
ssh -i your-key.pem ubuntu@<Elastic IP>
```

---

## 5. アプリケーションデプロイ

```bash
cd /home/ubuntu/work-report-system/deploy
./deploy-app.sh
```

確認:
```bash
curl http://localhost:3000
```

---

## 6. DNS Aレコード設定依頼

会社のDNS担当者に以下を依頼:

```
ホスト名: sk-app-dev
ドメイン: lily-tech.net
タイプ: A
値: <Elastic IP>
TTL: 300
```

DNS浸透確認:
```bash
dig sk-app-dev.lily-tech.net
```

---

## 7. SSL証明書取得（DNS設定後）

```bash
cd /home/ubuntu/work-report-system/deploy

# EMAIL変数を編集（重要）
vim setup-ssl.sh  # EMAIL="your-email@example.com" を変更

# SSL設定実行
./setup-ssl.sh
```

---

## 8. 動作確認

```bash
# ステータス確認
./check-status.sh

# ブラウザでアクセス
https://sk-app-dev.lily-tech.net
```

---

## 運用コマンド

```bash
# アプリ再起動
cd /opt/work-report-system
docker compose restart

# ログ確認
docker logs -f work-report-system

# 証明書更新テスト
sudo certbot renew --dry-run

# 証明書情報確認
sudo certbot certificates
```

---

## トラブルシューティング

### Dockerが動かない
```bash
# dockerグループ確認
groups
# 「docker」がなければ再ログイン
```

### Nginxエラー
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### 証明書取得失敗
- DNSが正しく設定されているか確認
- ポート80/443が開いているか確認
- Elastic IPが正しく関連付けられているか確認
