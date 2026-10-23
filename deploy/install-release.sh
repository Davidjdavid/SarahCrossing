#!/usr/bin/env bash
# Installs one built release of the game and makes it live.
#
#   sudo bash deploy/install-release.sh release.tgz [live|beta]
#
# release.tgz holds dist/ (the built game, with dist/build.json naming the
# version) and server/, as packed by the GitHub "Deploy" workflow. It goes into
# /srv/sarahcrossing/releases/<version>/ (beta: /srv/sarahcrossing-beta/...) and
# "current" points at it. If the server doesn't come back healthy with the new
# version, the previous release is put back. The newest 5 releases are kept.
#
# Run setup.sh first (the workflow always does).
set -euo pipefail

INSTANCE=${INSTANCE:-${2:-live}}
case $INSTANCE in
  live) NAME=sarahcrossing PORT=8090 ;;
  beta) NAME=sarahcrossing-beta PORT=8091 ;;
  *)
    echo "install-release.sh: the second argument is live or beta, not $INSTANCE" >&2
    exit 1
    ;;
esac
SC_ROOT=${SC_ROOT:-/srv/$NAME}
SC_USER=${SC_USER:-sarahcrossing}
SERVICE=$NAME
KEEP=5
RELEASES="$SC_ROOT/releases"

say() { echo "==> $*"; }
die() {
  echo "install-release.sh: $*" >&2
  exit 1
}

[ $# -ge 1 ] || die "usage: sudo bash $0 <release.tgz> [live|beta]"
tarball=$1
[ "$(id -u)" -eq 0 ] || die "run it with sudo"
[ -f "$tarball" ] || die "no such file: $tarball"
[ -d "$RELEASES" ] || die "$RELEASES is missing; run setup.sh first"

# Leftovers from interrupted deploys.
find "$RELEASES" -mindepth 1 -maxdepth 1 -name '.incoming-*' -mmin +60 -exec rm -rf {} +

staging=$(mktemp -d "$RELEASES/.incoming-XXXXXX")
trap 'rm -rf "$staging"' EXIT
tar -xzf "$tarball" -C "$staging" --no-same-owner
[ -f "$staging/dist/index.html" ] || die "the release has no dist/index.html"
[ -f "$staging/server/server.mjs" ] || die "the release has no server/server.mjs"
version=$(sed -nE 's/.*"version": *"([^"]+)".*/\1/p' "$staging/dist/build.json" | head -n 1)
[[ $version =~ ^[0-9A-Za-z][0-9A-Za-z._-]*$ ]] || die "the release has no version in dist/build.json"
# Root owns it all; the server can only read it.
chown -R "root:$SC_USER" "$staging"
chmod -R u=rwX,g=rX,o= "$staging"
chmod 750 "$staging"
rm -rf "${RELEASES:?}/$version"
mv "$staging" "$RELEASES/$version"
trap - EXIT
say "Unpacked release $version"

# Swap the symlink in one step, so it's never missing.
previous=$(readlink "$SC_ROOT/current" || true)
ln -sfn "$RELEASES/$version" "$SC_ROOT/.current.new"
mv -T "$SC_ROOT/.current.new" "$SC_ROOT/current"

say "Restarting $SERVICE"
systemctl restart "$SERVICE"
healthy=0
for _ in $(seq 1 30); do
  sleep 1
  if curl -fs --max-time 5 "http://127.0.0.1:$PORT/healthz" | grep -q "\"version\":\"$version\""; then
    healthy=1
    break
  fi
done
if [ "$healthy" != 1 ]; then
  echo "The server didn't come back healthy. Its last log lines:" >&2
  journalctl -u "$SERVICE" -n 40 --no-pager >&2 || true
  if [ -n "$previous" ] && [ "$previous" != "$RELEASES/$version" ] && [ -d "$previous" ]; then
    echo "Putting the previous release ($(basename "$previous")) back." >&2
    ln -sfn "$previous" "$SC_ROOT/.current.new"
    mv -T "$SC_ROOT/.current.new" "$SC_ROOT/current"
    systemctl restart "$SERVICE" || true
  fi
  die "deploy failed"
fi

# Keep the newest few (never the live one).
live=$(basename "$(readlink -f "$SC_ROOT/current")")
find "$RELEASES" -mindepth 1 -maxdepth 1 -type d ! -name '.*' -printf '%f\n' | sort -r | tail -n +$((KEEP + 1)) | while IFS= read -r old; do
  if [ "$old" = "$live" ]; then continue; fi
  say "Removing old release $old"
  rm -rf "${RELEASES:?}/$old"
done

say "Live: release $version"
