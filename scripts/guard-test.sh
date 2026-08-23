#!/bin/bash
# Prompt-injection himoyasini OFFLINE tekshirish (AI chaqirilmaydi, tekin va tez).
set -e
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
npx tsc src/lib/ai/guard.ts --outDir "$OUT" --module esnext --target es2022 \
  --moduleResolution bundler --skipLibCheck
mv "$OUT/guard.js" "$OUT/guard.mjs"
cp scripts/guard-test.mjs "$OUT/run.mjs"
node "$OUT/run.mjs"
rm -rf "$OUT"
