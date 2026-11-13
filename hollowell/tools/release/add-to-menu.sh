#!/bin/sh
# Adds Hollowell to your applications menu (run it again if you move this folder).
DIR="$(cd "$(dirname "$0")" && pwd)"
APPS="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
mkdir -p "$APPS"
cat > "$APPS/hollowell.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Hollowell
Comment=Version 1.0.4
Exec=sh "$DIR/play-hollowell.sh"
Icon=applications-games
Terminal=false
Categories=Game;
DESKTOP
chmod +x "$APPS/hollowell.desktop"
echo "Added to your menu: Hollowell"
