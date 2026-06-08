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
# Interactive once: if env files are missing it runs `setup.sh --prod`, which
# prompts you for URLs + DB/mail credentials. After that it's hands-off.
#
# Re-runnable: every step is idempotent. Env files already present are reused
# (no re-prompt). To reconfigure, delete them or run `bash setup.sh --prod`.

set -euo pipefail

# --- Configuration (edit these before running) --------------------------------

FRONTEND_DOMAIN="courier-front.dosomething.qzz.io"
BACKEND_DOMAIN="courier-back.dosomething.qzz.io"
FRONTEND_PORT="3000"
BACKEND_PORT="8000"
ACME_EMAIL="you@example.com"

# --- Internal constants -------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NODE_MAJOR=24
NVM_VERSION="v0.40.1"
PNPM_VERSION="9.0.0"  # matches root package.json "packageManager"

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

say() { printf '\n\033[1;36m>> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m!! %s\033[0m\n' "$*" >&2; exit 1; }

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
  # Only append if the frontend domain isn't already configured.
  if ! grep -qF "${FRONTEND_DOMAIN}" "$CADDYFILE"; then
    echo "$COURIER_CADDY_BLOCK" | $SUDO tee -a "$CADDYFILE" >/dev/null
    echo "  Added ${FRONTEND_DOMAIN} + ${BACKEND_DOMAIN}"
  else
    echo "  Courier domains already present -- skipping"
  fi
fi

$SUDO caddy validate --config "$CADDYFILE"

# --- 6. Env files (interactive on first run) ----------------------------------

ENV_FILES_PRESENT=true
for f in apps/api/.env apps/web/.env packages/database/.env packages/services/.env; do
  [ -f "$f" ] || ENV_FILES_PRESENT=false
done

if [ "$ENV_FILES_PRESENT" = true ]; then
  say "Env files present -- skipping setup.sh (delete them or run 'bash setup.sh --prod' to reconfigure)"
else
  say "Generating env files -- enter your production credentials when prompted"
  bash setup.sh --prod
fi

# Patch localhost URLs with actual production domains.
# setup.sh writes dev defaults; we replace them for production.
say "Patching env files with production domains"

patch_env() {
  local file="$1"
  [ -f "$file" ] || return 0

  # BASE_URL (API's own URL)
  sed -i "s|BASE_URL=http://localhost:${BACKEND_PORT}|BASE_URL=https://${BACKEND_DOMAIN}|g" "$file"

  # NEXT_PUBLIC_API_URL (tRPC endpoint for the frontend)
  sed -i "s|NEXT_PUBLIC_API_URL=http://localhost:${BACKEND_PORT}/trpc|NEXT_PUBLIC_API_URL=https://${BACKEND_DOMAIN}/trpc|g" "$file"

  # Google OAuth redirect
  sed -i "s|GOOGLE_OAUTH_REDIRECT_URI=http://localhost:${BACKEND_PORT}/api/auth/google/callback|GOOGLE_OAUTH_REDIRECT_URI=https://${BACKEND_DOMAIN}/api/auth/google/callback|g" "$file"

  # NODE_ENV
  sed -i "s|NODE_ENV=development|NODE_ENV=production|g" "$file"

  # Logger level
  sed -i "s|LOGGER_LEVEL=debug|LOGGER_LEVEL=info|g" "$file"
}

patch_env apps/api/.env
patch_env apps/web/.env
patch_env packages/database/.env
patch_env packages/services/.env
patch_env packages/logger/.env
patch_env .env

echo "  Done."

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

say "Starting Postgres container"
docker compose up -d

say "Waiting for Postgres to be ready"
for i in $(seq 1 30); do
  if docker exec postgresdb pg_isready -U postgres >/dev/null 2>&1; then
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
docker compose start
for i in $(seq 1 30); do
  docker exec postgresdb pg_isready -U postgres >/dev/null 2>&1 && { echo "  Postgres ready"; break; }
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

  Useful commands:
    pm2 status              # process health
    pm2 logs                # app logs
    pm2 restart all         # restart both apps
    journalctl -u caddy -f  # TLS / proxy logs
    docker compose logs -f  # Postgres logs

EOF
