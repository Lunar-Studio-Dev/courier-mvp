#!/usr/bin/env bash
#
# One-shot deploy for an Ubuntu VPS.
#
# Installs the toolchain (nvm + Node 24, pnpm, Caddy, PM2), then builds and
# runs the app: db:migrate -> db:seed:all -> build -> pm2 start, and configures
# + starts Caddy as the HTTPS reverse proxy.
#
# Usage:
#   bash deploy.sh
#
# Interactive once: prompts for domains, DB credentials, and app secrets on
# first run and saves them to .deploy.conf. Subsequent runs reuse the config.
# To reconfigure, delete .deploy.conf and .env files, then re-run.
#
# Re-runnable: every step is idempotent.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NODE_MAJOR=24
NVM_VERSION="v0.40.1"
PNPM_VERSION="9.0.0"  # matches root package.json "packageManager"
FRONTEND_PORT="3000"
BACKEND_PORT="8000"

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

say() { printf '\n\033[1;36m>> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m!! %s\033[0m\n' "$*" >&2; exit 1; }

# --- 0. Interactive configuration (saved to .deploy.conf) ---------------------

DEPLOY_CONF="$SCRIPT_DIR/.deploy.conf"

if [ -f "$DEPLOY_CONF" ]; then
  # shellcheck disable=SC1090
  source "$DEPLOY_CONF"
  say "Loaded config from .deploy.conf"
  echo "  Frontend : $FRONTEND_DOMAIN"
  echo "  Backend  : $BACKEND_DOMAIN"
  echo "  DB       : $DB_USER@localhost:$DB_PORT/$DB_NAME"
else
  say "First-time setup -- enter deployment configuration"
  echo ""

  read -rp "  Frontend domain (e.g. courier.example.com): " FRONTEND_DOMAIN
  [ -z "$FRONTEND_DOMAIN" ] && die "Frontend domain is required"

  read -rp "  Backend/API domain (e.g. api-courier.example.com): " BACKEND_DOMAIN
  [ -z "$BACKEND_DOMAIN" ] && die "Backend domain is required"

  read -rp "  ACME email for Let's Encrypt: " ACME_EMAIL
  [ -z "$ACME_EMAIL" ] && die "ACME email is required"

  echo ""
  echo "  -- Database --"
  read -rp "  Postgres database name [courier]: " DB_NAME
  DB_NAME="${DB_NAME:-courier}"

  read -rp "  Postgres user [postgres]: " DB_USER
  DB_USER="${DB_USER:-postgres}"

  read -rsp "  Postgres password [postgres]: " DB_PASSWORD
  echo
  DB_PASSWORD="${DB_PASSWORD:-postgres}"

  read -rp "  Postgres host port [5432]: " DB_PORT
  DB_PORT="${DB_PORT:-5432}"

  echo ""
  echo "  -- App Secrets --"
  read -rsp "  JWT secret (leave blank to auto-generate): " JWT_SECRET
  echo
  if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "  Auto-generated JWT secret."
  fi

  # Save config (permissions: owner-only read)
  cat > "$DEPLOY_CONF" <<CONF
FRONTEND_DOMAIN="$FRONTEND_DOMAIN"
BACKEND_DOMAIN="$BACKEND_DOMAIN"
ACME_EMAIL="$ACME_EMAIL"
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
DB_PASSWORD="$DB_PASSWORD"
DB_PORT="$DB_PORT"
JWT_SECRET="$JWT_SECRET"
CONF
  chmod 600 "$DEPLOY_CONF"
  echo ""
  echo "  Saved to .deploy.conf (chmod 600)"
fi

# Build the DATABASE_URL from the prompted credentials.
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"

# --- 1. System packages ------------------------------------------------------

say "Updating apt and installing base packages"
$SUDO apt-get update -y
$SUDO apt-get install -y curl git ca-certificates debian-keyring \
  debian-archive-keyring apt-transport-https jq openssl

# --- 2. nvm + Node -----------------------------------------------------------

export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  say "Installing nvm $NVM_VERSION"
  curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
else
  say "nvm already installed"
fi

# Load nvm into this non-interactive shell.
# shellcheck disable=SC1090
. "$NVM_DIR/nvm.sh"

say "Installing & switching to Node $NODE_MAJOR"
nvm install "$NODE_MAJOR"
nvm use "$NODE_MAJOR"
nvm alias default "$NODE_MAJOR"
echo "  node $(node -v)  |  npm $(npm -v)"

# --- 3. pnpm (via corepack) --------------------------------------------------

say "Enabling pnpm $PNPM_VERSION via corepack"
corepack enable
corepack prepare "pnpm@${PNPM_VERSION}" --activate
echo "  pnpm $(pnpm -v)"

# --- 4. PM2 -------------------------------------------------------------------

if ! command -v pm2 >/dev/null 2>&1; then
  say "Installing PM2 globally"
  npm install -g pm2
else
  say "PM2 already installed ($(pm2 -v))"
fi

# --- 5. Caddy -----------------------------------------------------------------

if ! command -v caddy >/dev/null 2>&1; then
  say "Installing Caddy from official apt repo"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | $SUDO gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | $SUDO tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  $SUDO apt-get update -y
  $SUDO apt-get install -y caddy
else
  say "Caddy already installed ($(caddy version | head -1))"
fi

CADDYFILE="/etc/caddy/Caddyfile"

# Build the two site blocks for this project.
COURIER_CADDY_BLOCK=$(cat <<EOF

${FRONTEND_DOMAIN} {
	encode zstd gzip
	reverse_proxy 127.0.0.1:${FRONTEND_PORT}
}

${BACKEND_DOMAIN} {
	encode zstd gzip
	reverse_proxy 127.0.0.1:${BACKEND_PORT}
}
EOF
)

if [ ! -f "$CADDYFILE" ]; then
  say "Creating /etc/caddy/Caddyfile"
  $SUDO tee "$CADDYFILE" >/dev/null <<EOF
{
	email ${ACME_EMAIL}
}
${COURIER_CADDY_BLOCK}
EOF
else
  say "Extending existing /etc/caddy/Caddyfile"
  if ! grep -qF "${FRONTEND_DOMAIN}" "$CADDYFILE"; then
    echo "$COURIER_CADDY_BLOCK" | $SUDO tee -a "$CADDYFILE" >/dev/null
    echo "  Added ${FRONTEND_DOMAIN} + ${BACKEND_DOMAIN}"
  else
    echo "  Courier domains already present -- skipping"
  fi
fi

$SUDO caddy validate --config "$CADDYFILE"

# --- 6. Env files -------------------------------------------------------------
# Generate .env files directly from the prompted config. Each variable is
# written to every target that needs it, but prompted/resolved only once.

say "Writing .env files"

write_env() {
  local file="$1"
  shift
  # "$@" = list of KEY=VALUE pairs to write

  local dir
  dir="$(dirname "$file")"
  mkdir -p "$dir"

  if [ -f "$file" ]; then
    echo "  $file already exists -- skipping (delete to regenerate)"
    return
  fi

  {
    echo "# Auto-generated by deploy.sh - $(date +%Y-%m-%d)"
    echo "# Do not commit this file."
    echo ""
    for pair in "$@"; do
      echo "$pair"
    done
  } > "$file"

  echo "  Created $file"
}

# Common variable sets
COMMON_DB="DATABASE_URL=${DATABASE_URL}"
COMMON_JWT="JWT_SECRET=${JWT_SECRET}"
COMMON_NODE_ENV="NODE_ENV=production"
COMMON_LOGGER="LOGGER_LEVEL=info"
COMMON_OTP="OTP_EXPIRY_MINUTES=10"
COMMON_SMS="SMS_PROVIDER=console"
COMMON_GOOGLE_ID="GOOGLE_OAUTH_CLIENT_ID="
COMMON_GOOGLE_SECRET="GOOGLE_OAUTH_CLIENT_SECRET="
COMMON_GOOGLE_REDIRECT="GOOGLE_OAUTH_REDIRECT_URI=https://${BACKEND_DOMAIN}/api/auth/google/callback"

write_env apps/api/.env \
  "$COMMON_DB" \
  "$COMMON_NODE_ENV" \
  "PORT=${BACKEND_PORT}" \
  "BASE_URL=https://${BACKEND_DOMAIN}" \
  "$COMMON_JWT" \
  "$COMMON_GOOGLE_ID" \
  "$COMMON_GOOGLE_SECRET" \
  "$COMMON_GOOGLE_REDIRECT" \
  "NEXT_PUBLIC_API_URL=https://${BACKEND_DOMAIN}/trpc" \
  "$COMMON_LOGGER" \
  "$COMMON_OTP" \
  "$COMMON_SMS"

write_env apps/web/.env \
  "$COMMON_DB" \
  "$COMMON_NODE_ENV" \
  "$COMMON_JWT" \
  "$COMMON_GOOGLE_ID" \
  "$COMMON_GOOGLE_SECRET" \
  "$COMMON_GOOGLE_REDIRECT" \
  "NEXT_PUBLIC_API_URL=https://${BACKEND_DOMAIN}/trpc" \
  "$COMMON_LOGGER" \
  "$COMMON_OTP" \
  "$COMMON_SMS"

write_env packages/database/.env \
  "$COMMON_DB"

write_env packages/services/.env \
  "$COMMON_DB" \
  "$COMMON_JWT" \
  "$COMMON_GOOGLE_ID" \
  "$COMMON_GOOGLE_SECRET" \
  "$COMMON_GOOGLE_REDIRECT" \
  "$COMMON_OTP" \
  "$COMMON_SMS"

write_env packages/logger/.env \
  "$COMMON_NODE_ENV" \
  "$COMMON_LOGGER"

# Root .env for dotenv-cli / turbo
write_env .env \
  "$COMMON_DB" \
  "$COMMON_NODE_ENV" \
  "PORT=${BACKEND_PORT}" \
  "BASE_URL=https://${BACKEND_DOMAIN}" \
  "$COMMON_JWT" \
  "$COMMON_GOOGLE_ID" \
  "$COMMON_GOOGLE_SECRET" \
  "$COMMON_GOOGLE_REDIRECT" \
  "NEXT_PUBLIC_API_URL=https://${BACKEND_DOMAIN}/trpc" \
  "$COMMON_LOGGER" \
  "$COMMON_OTP" \
  "$COMMON_SMS"

# --- 7. Docker + Postgres container ------------------------------------------

if ! command -v docker >/dev/null 2>&1; then
  say "Installing Docker (engine + CLI + compose plugin)"
  $SUDO apt-get install -y docker.io docker-compose-v2
  $SUDO systemctl enable --now docker
else
  say "Docker already installed ($(docker --version))"
  $SUDO systemctl enable --now docker 2>/dev/null || true
fi

docker compose version >/dev/null 2>&1 \
  || die "docker compose plugin missing -- install 'docker-compose-v2'"

# Export DB vars so docker-compose.yml can interpolate them.
export DB_USER DB_PASSWORD DB_NAME DB_PORT

say "Starting Postgres container"
docker compose up -d

say "Waiting for Postgres to be ready"
for i in $(seq 1 30); do
  if docker exec postgresdb pg_isready -U "$DB_USER" >/dev/null 2>&1; then
    echo "  Postgres ready"
    break
  fi
  [ "$i" -eq 30 ] && die "Postgres did not become ready in time"
  sleep 1
done

# --- 8. Install deps + DB schema + seed + build ------------------------------

say "Installing workspace dependencies"
pnpm install --frozen-lockfile

say "Generating Drizzle schema"
pnpm db:generate

say "Applying migrations"
pnpm db:migrate

say "Seeding master data"
pnpm db:seed:all

# Free RAM for the build. Postgres isn't needed during `pnpm build` (next
# build + tsup are offline), and on a light VPS the container competing for
# memory can OOM-kill the build.
say "Stopping Postgres to free memory for the build"
docker compose stop

say "Building all apps (turbo)"
pnpm build

say "Restarting Postgres"
export DB_USER DB_PASSWORD DB_NAME DB_PORT
docker compose start
for i in $(seq 1 30); do
  docker exec postgresdb pg_isready -U "$DB_USER" >/dev/null 2>&1 && { echo "  Postgres ready"; break; }
  [ "$i" -eq 30 ] && die "Postgres did not come back up after build"
  sleep 1
done

# --- 9. Start apps with PM2 --------------------------------------------------

say "Starting apps via PM2 ecosystem config"
pm2 start ecosystem.config.js
pm2 save
# Register PM2 to start on boot (systemd). Harmless if already registered.
pm2 startup systemd -u "$(whoami)" --hp "$HOME" 2>/dev/null | tail -1 | grep -E '^sudo|^env' | bash || true

# --- 10. Start / reload Caddy ------------------------------------------------

say "Enabling and (re)starting Caddy"
$SUDO systemctl enable caddy
$SUDO systemctl reload caddy 2>/dev/null || $SUDO systemctl restart caddy

# --- Done ---------------------------------------------------------------------

say "Deploy complete"
cat <<EOF

  Frontend : https://${FRONTEND_DOMAIN}   (-> 127.0.0.1:${FRONTEND_PORT})
  Backend  : https://${BACKEND_DOMAIN}    (-> 127.0.0.1:${BACKEND_PORT})
  Database : ${DB_USER}@localhost:${DB_PORT}/${DB_NAME}

  Useful commands:
    pm2 status              # process health
    pm2 logs                # app logs
    pm2 restart all         # restart both apps
    journalctl -u caddy -f  # TLS / proxy logs
    docker compose logs -f  # Postgres logs

  To reconfigure: delete .deploy.conf and all .env files, then re-run.

EOF
