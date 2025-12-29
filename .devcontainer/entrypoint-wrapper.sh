#!/bin/sh
# Entrypoint wrapper for backend container
# Runs as root to fix volume permissions, then drops to semiont user
# and calls the original docker-entrypoint.sh

set -e

# Ensure data directory exists and is writable by semiont user
mkdir -p /workspace/data
chown -R semiont:nodejs /workspace/data
chmod -R 755 /workspace/data

# Drop to semiont user and call the original entrypoint
exec su-exec semiont /usr/local/bin/docker-entrypoint.sh "$@"
