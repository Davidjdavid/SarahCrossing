#!/bin/sh
# Hollowell, the 12 November 2026 version: opens the game in a window of its own.
# With Chromium or Chrome it gets its own little browser profile, so this version's saves stay apart from
# any other version's. Otherwise it opens in Firefox, or in your default browser.
DIR="$(cd "$(dirname "$0")" && pwd)"
PAGE="file://$DIR/Hollowell.html"
DATA="${XDG_DATA_HOME:-$HOME/.local/share}/hollowell-2026-11-12"
for b in chromium chromium-browser google-chrome google-chrome-stable brave-browser microsoft-edge vivaldi; do
    if command -v "$b" >/dev/null 2>&1; then
        mkdir -p "$DATA"
        exec "$b" --user-data-dir="$DATA" --app="$PAGE" --window-size=1280,880 --no-first-run --no-default-browser-check
    fi
done
if command -v flatpak >/dev/null 2>&1 && flatpak info org.chromium.Chromium >/dev/null 2>&1; then
    mkdir -p "$DATA"
    exec flatpak run org.chromium.Chromium --user-data-dir="$DATA" --app="$PAGE" --window-size=1280,880 --no-first-run
fi
if command -v firefox >/dev/null 2>&1; then exec firefox --new-window "$PAGE"; fi
exec xdg-open "$PAGE"
