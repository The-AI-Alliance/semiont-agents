#!/bin/bash
# Welcome message displayed after devcontainer creation

cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Welcome to Semiont Agents Demo!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your devcontainer is ready. To complete setup:

    bash .devcontainer/setup-demo.sh

This will:
  • Wait for backend and frontend services to start
  • Create a demo admin account with random credentials
  • Install workspace dependencies
  • Save credentials to .env file

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
