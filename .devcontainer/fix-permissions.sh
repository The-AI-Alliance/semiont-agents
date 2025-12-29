#!/bin/sh
# Fix permissions on data directory before starting backend
# This runs as root, then drops to semiont user

set -e

# Ensure data directory exists and is writable by semiont user
mkdir -p /workspace/data
chown -R semiont:nodejs /workspace/data

# Drop to semiont user and exec the original entrypoint
exec gosu semiont docker-entrypoint.sh "$@"
