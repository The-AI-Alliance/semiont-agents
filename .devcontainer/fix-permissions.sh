#!/bin/sh
# Fix permissions on data directory before starting backend
# This runs as root, then drops to semiont user

set -e

# Ensure data directory exists and is writable by semiont user
mkdir -p /workspace/data
chown -R semiont:nodejs /workspace/data
chmod -R 755 /workspace/data

# Switch to semiont user and run the app
cd /app
exec su-exec semiont node dist/index.js
