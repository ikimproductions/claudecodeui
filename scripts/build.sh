#!/bin/bash
# [ai] Atlas fork production build: single-user platform mode + bypass as the default permission mode (Isaac's chat runs
# behind Tailscale with no login). Usage: scripts/build.sh    (then `launchctl kickstart -k gui/$UID/com.isaac.dossier-chat`)
set -euo pipefail; cd "$(dirname "$0")/.."
VITE_IS_PLATFORM=true VITE_DEFAULT_PERMISSION_MODE="${VITE_DEFAULT_PERMISSION_MODE:-bypassPermissions}" npm run build
