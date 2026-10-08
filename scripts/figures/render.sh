#!/usr/bin/env bash
# Render an SVG-in-HTML figure source to a print-resolution PNG.
# Usage: scripts/figures/render.sh figure_2_1 1780 560
#   -> reads  project/figures/src/figure_2_1.html
#   -> writes project/figures/figure_2_1.png  (3x device scale, ~300 dpi at 6 in wide)
set -euo pipefail

NAME="$1"; WIDTH="$2"; HEIGHT="$3"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/project/figures/src/$NAME.html"
OUT="$ROOT/project/figures/$NAME.png"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=3 \
  --window-size="$WIDTH,$HEIGHT" \
  --screenshot="$OUT" "file://$SRC" >/dev/null 2>&1

echo "$OUT"
