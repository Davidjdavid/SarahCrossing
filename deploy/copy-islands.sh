#!/usr/bin/env bash
# Replaces the beta site's islands with a copy of the live ones (Sarah's island
# and the rest, with their backups and photos), so changes can be tried on the
# real islands without touching them. The live site isn't changed.
#
#   sudo bash deploy/copy-islands.sh
#
# The Deploy workflow runs it when "copy live islands to beta" is ticked, before
# installing the release on beta (which restarts the beta server).
set -euo pipefail

LIVE=/srv/sarahcrossing/data
BETA=/srv/sarahcrossing-beta/data
SC_USER=${SC_USER:-sarahcrossing}

die() {
  echo "copy-islands.sh: $*" >&2
  exit 1
}
[ "$(id -u)" -eq 0 ] || die "run it with sudo"
[ -d "$LIVE/islands" ] || die "the live site has no islands yet"
[ -d "$BETA" ] || die "the beta site isn't set up yet (run setup.sh for beta first)"

rm -rf "$BETA/islands.incoming"
cp -a "$LIVE/islands" "$BETA/islands.incoming"
rm -rf "$BETA/islands"
mv "$BETA/islands.incoming" "$BETA/islands"
chown -R "$SC_USER:$SC_USER" "$BETA/islands"
echo "==> Beta now has a copy of the live islands ($(find "$BETA/islands" -mindepth 1 -maxdepth 1 -type d | wc -l) of them)"
