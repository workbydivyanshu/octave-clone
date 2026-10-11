#!/bin/bash
set -e
cd "$(dirname "$0")"

if ! npx wrangler whoami > /dev/null 2>&1; then
  echo "Not logged in. Run: npx wrangler login   then rerun this script."
  exit 1
fi

npx wrangler deploy

NAME=$(grep -oP 'name = "\K[^"]+' wrangler.toml)
SUBDOMAIN=$(npx wrangler whoami 2>/dev/null | grep -oP 'Account Name: \K.*' | head -1)
echo ""
echo "Worker deployed. It should answer at:"
echo "  https://${NAME}.<your-subdomain>.workers.dev/health"
echo ""
echo "Verify with:"
echo "  curl -s https://${NAME}.<your-subdomain>.workers.dev/health"
echo "  curl -s \"https://${NAME}.<your-subdomain>.workers.dev/search?q=daft+punk\""
echo ""
echo "Then open the app Settings page and paste the URL"
echo "(https://${NAME}.<your-subdomain>.workers.dev) into the Streaming worker field."
