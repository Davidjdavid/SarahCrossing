#!/usr/bin/env bash
# Prepares an Ubuntu server (EC2, Ubuntu 24.04) to run Sarah Crossing:
# Node.js 22, Caddy (the web server that gets the HTTPS certificates), a
# "sarahcrossing" user, the /srv/sarahcrossing folders, the password, the
# systemd service, a nightly backup and the site's part of the Caddyfile.
#
#   sudo bash deploy/setup.sh <domain> [live|beta]
#
#   e.g. sudo bash deploy/setup.sh sarahcrossing.com            Sarah's island (live)
#        sudo bash deploy/setup.sh beta.sarahcrossing.com beta  the test site
#
# The live site and the beta site are two copies side by side, each with its own
# islands: live is /srv/sarahcrossing on port 8090, beta /srv/sarahcrossing-beta
# on port 8091.
#
# The GitHub "Deploy" workflow runs it on every deploy, so it's safe to run
# again: whatever is already in place is left alone.
#
# It can share a server with other sites (Dr Hazelwood, Settlers...): it has its
# own ports, user and folders, and in /etc/caddy/Caddyfile it only ever changes
# the lines between "# BEGIN <name>" and "# END <name>" (the name being
# sarahcrossing or sarahcrossing-beta).
#
# The password comes from /tmp/<name>-password (written by the deploy, then moved
# into place); without one, the one already on the server is kept.
set -euo pipefail

INSTANCE=${INSTANCE:-${2:-live}}
case $INSTANCE in
  live) NAME=sarahcrossing PORT=8090 ;;
  beta) NAME=sarahcrossing-beta PORT=8091 ;;
  *)
    echo "setup.sh: the second argument is live or beta, not $INSTANCE" >&2
    exit 1
    ;;
esac
SC_ROOT=${SC_ROOT:-/srv/$NAME}
SC_USER=${SC_USER:-sarahcrossing}
SERVICE=$NAME
CADDYFILE=${CADDYFILE:-/etc/caddy/Caddyfile}
BACKUPS=/var/backups/$NAME
NEW_PASSWORD=/tmp/$NAME-password

export DEBIAN_FRONTEND=noninteractive
# Waits for apt if Ubuntu is busy updating itself (common right after a reboot).
APT=(apt-get -y -q -o DPkg::Lock::Timeout=600)

say() { echo "==> $*"; }
die() {
  echo "setup.sh: $*" >&2
  exit 1
}

# Writes stdin to a file, but only if that changes it. Succeeds when it changed.
write_if_changed() {
  local dest=$1 mode=$2 tmp
  tmp=$(mktemp)
  cat >"$tmp"
  if [ -f "$dest" ] && cmp -s "$tmp" "$dest"; then
    rm -f "$tmp"
    return 1
  fi
  mkdir -p "$(dirname "$dest")"
  install -m "$mode" "$tmp" "$dest"
  rm -f "$tmp"
}

# The site's lines for the Caddyfile, between its markers. (Live also sends www. to the plain domain.)
caddy_block() {
  printf '%s\n' "# BEGIN $NAME (written by Sarah Crossing's deploy/setup.sh; changes in here are replaced on the next deploy)"
  printf '%s {\n\tencode zstd gzip\n\treverse_proxy 127.0.0.1:%s\n}\n' "$DOMAIN" "$PORT"
  if [ "$INSTANCE" = live ]; then printf '\nwww.%s {\n\tredir https://%s{uri} permanent\n}\n' "$DOMAIN" "$DOMAIN"; fi
  printf '%s\n' "# END $NAME"
}

# Ubuntu's welcome page, or the bare ":80" a fresh install starts with: nothing worth keeping.
caddyfile_is_stock() {
  [ ! -s "$1" ] && return 0
  grep -q 'root \* /usr/share/caddy' "$1" && return 0
  [ "$(grep -v -E '^[[:space:]]*(#|$)' "$1" | tr -d '[:space:]')" = ":80" ]
}

# The Caddyfile as it should be: everything else in it as it was, plus this site's block at the end.
new_caddyfile() {
  local current=$1
  if [ -f "$current" ] && ! caddyfile_is_stock "$current"; then
    # (the blank line that separated the old block from what follows goes with it)
    awk -v begin="# BEGIN $NAME" -v end="# END $NAME" 'function blank(s) { return s ~ /^[[:space:]]*$/ }
      function marks(s, m) { return s == m || index(s, m " ") == 1 }
      marks($0, begin) { skip = 1; next }
      marks($0, end) { skip = 0; gap = 1; next }
      skip { next }
      { if (gap && blank($0) && (n == 0 || blank(lines[n]))) { gap = 0; next } gap = 0; lines[++n] = $0 }
      END { while (n > 0 && blank(lines[n])) n--; for (i = 1; i <= n; i++) print lines[i]; if (n > 0) print "" }' "$current"
  fi
  caddy_block
}

# Lets tests/deploy.test.mjs try the Caddyfile handling without a server:
#   INSTANCE=live|beta bash deploy/setup.sh --caddyfile-only <domain> <Caddyfile>
if [ "${1:-}" = "--caddyfile-only" ]; then
  DOMAIN=$2
  new_caddyfile "$3"
  exit 0
fi

[ "$(id -u)" -eq 0 ] || die "run it with sudo: sudo bash $0 <domain> [live|beta]"
DOMAIN=$(printf '%s' "${1:-}" | tr -d '[:space:]' | tr 'A-Z' 'a-z')
DOMAIN=${DOMAIN#www.}
[[ $DOMAIN =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] || die "give the domain, like: sudo bash $0 sarahcrossing.com"
say "Domain $DOMAIN"

# ------------------------------------------------------------ basic tools
missing=()
command -v curl >/dev/null || missing+=(curl)
command -v gpg >/dev/null || missing+=(gnupg)
command -v tar >/dev/null || missing+=(tar)
[ -d /etc/ssl/certs ] || missing+=(ca-certificates)
if [ ${#missing[@]} -gt 0 ]; then
  say "Installing ${missing[*]}"
  "${APT[@]}" update
  "${APT[@]}" install "${missing[@]}"
fi

# 1 GB of swap, so a small server can't run out of memory (skipped if there's swap already).
if [ -z "$(swapon --show --noheadings 2>/dev/null)" ] && [ ! -e /swapfile ]; then
  say "Adding 1 GB of swap"
  fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

# ------------------------------------------------------- Node.js 22 or newer
node_major() { node -v 2>/dev/null | sed -nE 's/^v([0-9]+)\..*/\1/p'; }
major=$(node_major || true)
if [ -z "$major" ] || [ "$major" -lt 22 ]; then
  say "Installing Node.js 22 (from NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh
  bash /tmp/nodesource_setup.sh
  rm -f /tmp/nodesource_setup.sh
  "${APT[@]}" install nodejs
  major=$(node_major || true)
  [ -n "$major" ] && [ "$major" -ge 22 ] || die "Node.js 22 didn't install (node -v says: $(node -v 2>&1 || true))"
fi
NODE_BIN=$(command -v node)
say "Node.js $(node -v)"

# ----------------------------------------------------------------- Caddy
# Ubuntu's own package. (Caddy's apt repo has refused downloads lately, so an entry
# for it, left by an earlier setup, is removed: otherwise every "apt-get update" fails.)
rm -f /etc/apt/sources.list.d/caddy-stable.list /usr/share/keyrings/caddy-stable-archive-keyring.gpg

# Fallback when Ubuntu has no caddy package: the official release from GitHub,
# checked against its published checksums, set up the way the package would be.
install_caddy_release() {
  local arch tag version tarball tmp
  case "$(uname -m)" in
    x86_64) arch=amd64 ;;
    aarch64 | arm64) arch=arm64 ;;
    *) die "no Caddy download for this processor ($(uname -m))" ;;
  esac
  tag=$(curl -fsSLI -o /dev/null -w '%{url_effective}' https://github.com/caddyserver/caddy/releases/latest | sed -nE 's#.*/tag/(v[0-9][^/]*)$#\1#p')
  [ -n "$tag" ] || die "couldn't find the latest Caddy release on GitHub"
  version=${tag#v}
  tarball="caddy_${version}_linux_${arch}.tar.gz"
  tmp=$(mktemp -d)
  curl -fsSL "https://github.com/caddyserver/caddy/releases/download/$tag/$tarball" -o "$tmp/$tarball"
  curl -fsSL "https://github.com/caddyserver/caddy/releases/download/$tag/caddy_${version}_checksums.txt" -o "$tmp/checksums.txt"
  (cd "$tmp" && grep " $tarball\$" checksums.txt | sha512sum -c --status -) || die "the Caddy download didn't match its checksum"
  tar -xzf "$tmp/$tarball" -C "$tmp" caddy
  install -m 755 "$tmp/caddy" /usr/bin/caddy
  rm -rf "$tmp"
  getent group caddy >/dev/null || groupadd --system caddy
  id -u caddy >/dev/null 2>&1 ||
    useradd --system --gid caddy --create-home --home-dir /var/lib/caddy --shell /usr/sbin/nologin caddy
  mkdir -p /etc/caddy
  [ -f "$CADDYFILE" ] || echo ":80" >"$CADDYFILE"
  cat >/etc/systemd/system/caddy.service <<'UNIT'
[Unit]
Description=Caddy
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s
LimitNOFILE=1048576
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
}

if ! command -v caddy >/dev/null; then
  say "Installing Caddy"
  "${APT[@]}" update
  candidate=$(apt-cache policy caddy 2>/dev/null | sed -nE 's/^ *Candidate: *//p')
  if [ -n "$candidate" ] && [ "$candidate" != "(none)" ]; then
    "${APT[@]}" install caddy
  else
    say "Ubuntu has no caddy package here; installing the official release from GitHub"
    install_caddy_release
  fi
  command -v caddy >/dev/null || die "Caddy didn't install"
fi
say "Caddy $(caddy version | head -n 1)"

# --------------------------------------------------------- user and folders
if ! id -u "$SC_USER" >/dev/null 2>&1; then
  say "Creating the $SC_USER user"
  useradd --system --user-group --home-dir "$SC_ROOT" --no-create-home --shell /usr/sbin/nologin "$SC_USER"
fi
# The game belongs to root, so the server can read but never change it; it only writes in data/.
install -d -o root -g "$SC_USER" -m 750 "$SC_ROOT" "$SC_ROOT/releases"
install -d -o "$SC_USER" -g "$SC_USER" -m 750 "$SC_ROOT/data"
# David's music from the games, uploaded from the game's Music app: one folder both sites share, outside data/ so the
# nightly backups don't copy gigabytes of it
MUSIC_DIR=${MUSIC_DIR:-/srv/sarahcrossing-music}
# (uploaded from the beta site; the live site only plays it)
if [ "$INSTANCE" = beta ]; then MUSIC_UPLOADS=1; else MUSIC_UPLOADS=0; fi
install -d -o "$SC_USER" -g "$SC_USER" -m 750 "$MUSIC_DIR"
install -d -o root -g root -m 700 "$BACKUPS"

# The password players type. Changing it logs everyone out (they type the new one once).
if [ -s "$NEW_PASSWORD" ]; then
  if ! cmp -s "$NEW_PASSWORD" "$SC_ROOT/password"; then say "Setting the password"; fi
  install -o root -g "$SC_USER" -m 640 "$NEW_PASSWORD" "$SC_ROOT/password"
fi
rm -f "$NEW_PASSWORD"
[ -s "$SC_ROOT/password" ] || die "there's no password yet: the deploy writes it from the SITE_PASSWORD secret (docs/DEPLOY.md)"

# ---------------------------------------------------------- the game server
if write_if_changed "/etc/systemd/system/$SERVICE.service" 644 <<UNIT; then
# Written by Sarah Crossing's deploy/setup.sh; changes here are replaced on the next deploy.
[Unit]
Description=Sarah Crossing game server ($INSTANCE)
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=$SC_USER
Group=$SC_USER
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOST=127.0.0.1
Environment=STATIC_DIR=$SC_ROOT/current/dist
Environment=DATA_DIR=$SC_ROOT/data
Environment=MUSIC_DIR=$MUSIC_DIR
Environment=MUSIC_UPLOADS=$MUSIC_UPLOADS
Environment=SITE_PASSWORD_FILE=$SC_ROOT/password
ExecStart=$NODE_BIN $SC_ROOT/current/server/server.mjs
Restart=always
RestartSec=2
TimeoutStopSec=10
# The server may only write its data folder (and the music folder).
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$SC_ROOT/data $MUSIC_DIR

[Install]
WantedBy=multi-user.target
UNIT
  say "Updated the $SERVICE service"
fi

# A copy of all the islands every night, kept two weeks (on top of each island's own backups).
write_if_changed "/etc/systemd/system/$SERVICE-backup.service" 644 <<UNIT || true
# Written by Sarah Crossing's deploy/setup.sh.
[Unit]
Description=Back up the Sarah Crossing islands ($INSTANCE)

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'tar -czf $BACKUPS/islands-\$(date +%%F).tgz -C $SC_ROOT data && find $BACKUPS -name "islands-*.tgz" -mtime +14 -delete'
UNIT
write_if_changed "/etc/systemd/system/$SERVICE-backup.timer" 644 <<UNIT || true
# Written by Sarah Crossing's deploy/setup.sh.
[Unit]
Description=Nightly Sarah Crossing backup ($INSTANCE)

[Timer]
OnCalendar=*-*-* 09:23:00
Persistent=true

[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --quiet "$SERVICE"
systemctl enable --quiet --now "$SERVICE-backup.timer"

# ----------------------------------------------------- Caddy (HTTPS in front)
# Caddy gets and renews the certificates by itself, as long as the domain points at
# this server and ports 80 and 443 are open. Only this site's lines are touched.
new=$(mktemp)
new_caddyfile "$CADDYFILE" >"$new"
if ! cmp -s "$new" "$CADDYFILE"; then
  if [ -f "$CADDYFILE" ]; then cp "$CADDYFILE" "$CADDYFILE.before-sarahcrossing"; fi
  install -m 644 "$new" "$CADDYFILE"
  if ! caddy validate --config "$CADDYFILE" --adapter caddyfile >/dev/null 2>&1; then
    caddy validate --config "$CADDYFILE" --adapter caddyfile || true
    if [ -f "$CADDYFILE.before-sarahcrossing" ]; then cp "$CADDYFILE.before-sarahcrossing" "$CADDYFILE"; fi
    rm -f "$new"
    die "Caddy rejected the new Caddyfile, so the old one was put back"
  fi
  say "Updated $CADDYFILE"
  systemctl reload-or-restart caddy
fi
rm -f "$new"
systemctl enable --quiet caddy
systemctl is-active --quiet caddy || systemctl start caddy

# Ubuntu's firewall is off on EC2 (the AWS security group does that job), but if
# someone turned it on, let web traffic and SSH through.
if command -v ufw >/dev/null && ufw status 2>/dev/null | grep -q '^Status: active'; then
  ufw allow OpenSSH >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
fi

say "Server setup is done"
