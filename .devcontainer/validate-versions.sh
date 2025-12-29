#!/bin/bash
# validate-versions.sh - Ensures all version definitions are synchronized
# Runs during postCreateCommand to catch version drift immediately

set -euo pipefail

cd "$(dirname "$0")/.."

# Extract versions from each source
INIT_ENV_VERSION=$(grep '^SEMIONT_VERSION=' .devcontainer/init-env.sh | head -1 | cut -d'"' -f2)
DEVCONTAINER_VERSION=$(grep '"SEMIONT_VERSION":' .devcontainer/devcontainer.json | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
API_CLIENT_VERSION=$(node -e "console.log(require('./package.json').dependencies['@semiont/api-client'])" | sed 's/\^//')
CLI_VERSION=$(node -e "console.log(require('./package.json').dependencies['@semiont/cli'])" | sed 's/\^//')

echo "Version synchronization check:"
echo "  init-env.sh:          $INIT_ENV_VERSION"
echo "  devcontainer.json:    $DEVCONTAINER_VERSION"
echo "  package.json (api):   $API_CLIENT_VERSION"
echo "  package.json (cli):   $CLI_VERSION"
echo ""

# Check if all versions match
if [ "$INIT_ENV_VERSION" = "$DEVCONTAINER_VERSION" ] && \
   [ "$INIT_ENV_VERSION" = "$API_CLIENT_VERSION" ] && \
   [ "$INIT_ENV_VERSION" = "$CLI_VERSION" ]; then
    echo "✓ All versions synchronized: $INIT_ENV_VERSION"
    exit 0
fi

# Versions don't match - fail loudly
echo "❌ VERSION MISMATCH DETECTED!"
echo ""
echo "All version definitions must be identical. Update these files:"
echo ""
echo "  1. .devcontainer/init-env.sh line 9:"
echo "     SEMIONT_VERSION=\"$INIT_ENV_VERSION\""
echo ""
echo "  2. .devcontainer/devcontainer.json lines 79 and 89:"
echo "     \"SEMIONT_VERSION\": \"$DEVCONTAINER_VERSION\""
echo ""
echo "  3. package.json lines 12-13:"
echo "     \"@semiont/api-client\": \"^$API_CLIENT_VERSION\""
echo "     \"@semiont/cli\": \"^$CLI_VERSION\""
echo ""
echo "See CLAUDE.md 'Semiont Version Management' section for update procedure."
echo ""
exit 1
