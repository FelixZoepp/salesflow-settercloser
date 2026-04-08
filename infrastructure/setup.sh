#!/bin/bash
# ============================================
# VPS Setup Script for Custom Domain Reverse Proxy
# ============================================
#
# Prerequisites:
# - Ubuntu 22.04+ VPS (e.g., Hetzner CX22, ~4€/mo)
# - Root or sudo access
# - Two static IPv4 addresses assigned to the VPS
#
# Usage:
#   chmod +x setup.sh
#   sudo ./setup.sh
#
# After running:
# 1. Set SUPABASE_SERVICE_ROLE_KEY in /etc/caddy/environment
# 2. Update EXPECTED_IPS in verify-domain edge function
# 3. Update SERVER_IP_1/2 in src/components/DomainSettings.tsx
# ============================================

set -euo pipefail

echo "=== Installing Caddy ==="

# Install Caddy (official repo)
apt-get update
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list

apt-get update
apt-get install -y caddy

echo "=== Creating directories ==="
mkdir -p /var/log/caddy
mkdir -p /etc/caddy

echo "=== Setting up environment file ==="
cat > /etc/caddy/environment <<'ENVEOF'
# Supabase service role key for authenticating edge function calls
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
ENVEOF

chmod 600 /etc/caddy/environment

echo "=== Copying Caddyfile ==="
# Copy Caddyfile (assumes this script is run from the infrastructure/ directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "${SCRIPT_DIR}/Caddyfile" /etc/caddy/Caddyfile

echo "=== Configuring systemd ==="

# Override systemd service to load environment
mkdir -p /etc/systemd/system/caddy.service.d
cat > /etc/systemd/system/caddy.service.d/override.conf <<'SVCEOF'
[Service]
EnvironmentFile=/etc/caddy/environment
SVCEOF

systemctl daemon-reload
systemctl enable caddy
systemctl restart caddy

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "1. Edit /etc/caddy/environment and set SUPABASE_SERVICE_ROLE_KEY"
echo "2. Run: sudo systemctl restart caddy"
echo "3. Note your server's IP addresses:"
echo "   ip addr show | grep 'inet '"
echo "4. Update these IPs in:"
echo "   - supabase/functions/verify-domain/index.ts (EXPECTED_IPS)"
echo "   - src/components/DomainSettings.tsx (SERVER_IP_1, SERVER_IP_2)"
echo "5. Deploy the Supabase edge functions:"
echo "   supabase functions deploy verify-domain"
echo "   supabase functions deploy serve-lead-page"
echo "   supabase functions deploy check-domain-allowed"
echo ""
echo "Server IPs:"
ip addr show | grep 'inet ' | grep -v '127.0.0.1'
