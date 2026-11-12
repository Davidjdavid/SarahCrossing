#!/bin/sh
# Adds "Hollowell (12 November)" to your applications menu (run it again if you move this folder).
DIR="$(cd "$(dirname "$0")" && pwd)"
APPS="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
mkdir -p "$APPS"
cat > "$APPS/hollowell-2026-11-12.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Hollowell (12 November)
Comment=The 12 November 2026 version
Exec="$DIR/play-hollowell.sh"
Icon=applications-games
Terminal=false
Categories=Game;
DESKTOP
chmod +x "$APPS/hollowell-2026-11-12.desktop"
echo "Added to your menu: Hollowell (12 November)"
