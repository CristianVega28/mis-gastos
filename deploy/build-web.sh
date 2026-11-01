#!/usr/bin/env bash
# Compila la web de Expo con Docker y deja el dist en la carpeta que sirve Caddy.
# Uso (desde la raíz del repo, en el VPS):  deploy/build-web.sh [destino]
set -euo pipefail

DEST="${1:-/var/www/mis-gastos}"
cd "$(dirname "$0")/.."

# Compila en una carpeta temporal y luego reemplaza el contenido de golpe,
# así la web nunca queda a medio copiar ni acumula archivos viejos.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

docker build -f deploy/web.Dockerfile --target export \
  --output "type=local,dest=$TMP" .

test -f "$TMP/index.html" || { echo "El build no generó index.html" >&2; exit 1; }

sudo mkdir -p "$DEST"
sudo rsync -a --delete "$TMP"/ "$DEST"/
sudo chmod -R a+rX "$DEST"

echo "Web publicada en $DEST"
