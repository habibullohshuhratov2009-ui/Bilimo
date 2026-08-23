#!/bin/bash
# Loyihani qayta nomlash: bitta buyruq bilan hamma joyda.
#   bash scripts/rename.sh "Zukko"
set -euo pipefail
NEW="${1:?Yangi nom kerak: bash scripts/rename.sh \"Zukko\"}"
OLD="Sinf AI"
cd "$(dirname "$0")/.."
FILES=$(grep -rl "$OLD" src public *.md 2>/dev/null || true)
for f in $FILES; do
  # macOS sed
  sed -i '' "s/$OLD/$NEW/g" "$f"
  echo "  ✓ $f"
done
echo "Tayyor. Endi: npm run build && railway up -s web2 --detach"
