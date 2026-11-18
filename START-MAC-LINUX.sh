#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node -e "const v=Number(process.versions.node.split('.')[0]); if(v<20){console.error('Node.js 20+ required');process.exit(1)}"
( sleep 1; if command -v xdg-open >/dev/null; then xdg-open http://127.0.0.1:3000 >/dev/null 2>&1 || true; elif command -v open >/dev/null; then open http://127.0.0.1:3000 || true; fi ) &
node backend/server.js
