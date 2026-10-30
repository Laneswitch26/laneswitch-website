#!/usr/bin/env bash
# Holt three.js r160 (MIT) nur für das lokale Rendern. Nicht Teil der Website.
set -euo pipefail
cd "$(dirname "$0")"
[ -f vendor/three.module.js ] && { echo "vendor vorhanden"; exit 0; }
tmp=$(mktemp -d)
git clone -q --depth 1 --branch r160 --filter=blob:none --sparse https://github.com/mrdoob/three.js "$tmp/three"
git -C "$tmp/three" sparse-checkout set --no-cone /build/three.module.js /examples/jsm/objects/Sky.js /examples/jsm/utils/BufferGeometryUtils.js /LICENSE
mkdir -p vendor/jsm/objects vendor/jsm/utils
cp "$tmp/three/examples/jsm/utils/BufferGeometryUtils.js" vendor/jsm/utils/
cp "$tmp/three/build/three.module.js" vendor/
cp "$tmp/three/examples/jsm/objects/Sky.js" vendor/jsm/objects/
cp "$tmp/three/LICENSE" vendor/LICENSE
rm -rf "$tmp"
echo "three.js r160 bereit"
