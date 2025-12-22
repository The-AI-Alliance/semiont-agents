#!/bin/bash
set -euo pipefail

# Force unbuffered output
exec 2>&1
export PYTHONUNBUFFERED=1

SEMIONT_VERSION="${SEMIONT_VERSION:-0.2.0}"
DEMO_EMAIL="demo@example.com"
DEMO_PASSWORD="demo123"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "\n${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

clear

echo "=========================================="
echo "   SEMIONT AGENTS DEMO SETUP"
echo "=========================================="
echo ""
echo "Version: $SEMIONT_VERSION"
echo ""
echo "📋 Setup Steps:"
echo "  • Install Semiont CLI"
echo "  • Create project directory"
echo "  • Initialize Semiont project"
echo "  • Configure environment"
echo "  • Wait for services"
echo "  • Provision services via CLI"
echo "  • Create demo user"
echo ""
echo "⏱️  Estimated time: 2-3 minutes"
echo "------------------------------------------"
echo ""

# Navigate to workspace root
cd /workspaces/semiont-agents

# Install Semiont CLI globally
print_status "Installing @semiont/cli@latest globally..."
npm install -g "@semiont/cli@latest" 2>&1 | grep -v "npm warn" || true
print_success "CLI installed"

# Verify CLI installation
if command -v semiont &> /dev/null; then
    CLI_VERSION=$(semiont --version 2>&1 | head -n 1 || echo "installed")
    print_success "CLI available: $CLI_VERSION"
else
    print_warning "CLI command 'semiont' not in PATH, but package is installed"
fi

# Verify project directory exists (created by init-env.sh)
export SEMIONT_ROOT=/workspaces/semiont-agents/project
export SEMIONT_ENV=demo

if [ ! -d "$SEMIONT_ROOT" ]; then
    print_error "Project directory not found at $SEMIONT_ROOT"
    print_error "This should have been created by init-env.sh"
    exit 1
fi

print_status "Verifying project configuration..."

# Check if already initialized by init-env.sh
if [ -f "$SEMIONT_ROOT/semiont.json" ] && [ -f "$SEMIONT_ROOT/environments/demo.json" ]; then
    print_success "Project already initialized by init-env.sh"
else
    print_status "Initializing project configuration..."

    # Initialize Semiont project
    cd $SEMIONT_ROOT || exit 1
    semiont init || {
        print_warning "semiont init failed - copying config files manually"
    }

    # Copy semiont.json if not present
    if [ ! -f "semiont.json" ]; then
        cp /workspaces/semiont-agents/.devcontainer/semiont.json semiont.json
        print_success "semiont.json configured"
    fi

    # Copy environment config if not present
    mkdir -p environments
    if [ ! -f "environments/demo.json" ]; then
        cp /workspaces/semiont-agents/.devcontainer/environments-demo.json environments/demo.json
        print_success "environments/demo.json configured"
    fi
fi

# Detect environment and set URLs
if [ -n "${CODESPACE_NAME:-}" ]; then
    FRONTEND_URL="https://${CODESPACE_NAME}-3000.app.github.dev"
    BACKEND_URL="https://${CODESPACE_NAME}-4000.app.github.dev"
    SITE_DOMAIN="${CODESPACE_NAME}-3000.app.github.dev"

    # Verify URLs are properly set in config
    cd $SEMIONT_ROOT || exit 1
    CURRENT_BACKEND_URL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('environments/demo.json', 'utf-8')).services.backend.publicURL)" 2>/dev/null || echo "")

    if [ "$CURRENT_BACKEND_URL" != "$BACKEND_URL" ]; then
        print_status "Updating Codespaces URLs in configuration..."
        node -e "
        const fs = require('fs');
        const baseConfig = JSON.parse(fs.readFileSync('semiont.json', 'utf-8'));
        const envFile = 'environments/demo.json';
        const config = JSON.parse(fs.readFileSync(envFile, 'utf-8'));
        config.site.domain = '${SITE_DOMAIN}';
        config.site.oauthAllowedDomains = ['${SITE_DOMAIN}', ...(baseConfig.site?.oauthAllowedDomains || [])];
        config.services.frontend.url = '${FRONTEND_URL}';
        config.services.backend.publicURL = '${BACKEND_URL}';
        config.services.backend.corsOrigin = '${FRONTEND_URL}';
        fs.writeFileSync(envFile, JSON.stringify(config, null, 2));
        "
        print_success "URLs configured for Codespaces"
    else
        print_success "Codespaces URLs already configured"
    fi
else
    FRONTEND_URL="http://localhost:3000"
    BACKEND_URL="http://localhost:4000"
    print_success "Using localhost URLs"
fi

# Wait for backend service to be healthy
print_status "Waiting for backend service to start..."
MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $((WAITED % 10)) -eq 0 ]; then
        echo "  Still waiting... (${WAITED}s)"
    fi
done

if [ $WAITED -ge $MAX_WAIT ]; then
    print_error "Backend failed to start within ${MAX_WAIT}s"
    echo ""
    echo "Check logs with: docker compose logs backend"
    exit 1
fi

# Wait for frontend service to be healthy
print_status "Waiting for frontend service to start..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is healthy"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $((WAITED % 10)) -eq 0 ]; then
        echo "  Still waiting... (${WAITED}s)"
    fi
done

if [ $WAITED -ge $MAX_WAIT ]; then
    print_warning "Frontend took longer than expected to start"
    print_warning "It may still be starting - check http://localhost:3000"
fi

# Provision services using Semiont CLI
print_status "Provisioning services with Semiont CLI..."
cd $SEMIONT_ROOT || exit 1

# Provision backend service
semiont provision --service backend --environment demo || {
    print_warning "Backend provisioning failed or not needed for containers - continuing"
}
print_success "Backend provisioned"

# Provision frontend service
semiont provision --service frontend --environment demo || {
    print_warning "Frontend provisioning failed or not needed for containers - continuing"
}
print_success "Frontend provisioned"

# Create demo user using CLI
print_status "Creating demo user with Semiont CLI..."
cd $SEMIONT_ROOT || exit 1

semiont useradd --email "$DEMO_EMAIL" --password "$DEMO_PASSWORD" --environment demo || {
    print_warning "User creation via CLI failed, trying direct API call..."

    # Fallback to direct API call
    HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/register-response.txt \
      -X POST http://localhost:4000/api/auth/register \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\",\"name\":\"Demo User\"}")

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        print_success "Demo user created via API"
    elif [ "$HTTP_CODE" = "409" ] || [ "$HTTP_CODE" = "400" ]; then
        print_warning "Demo user already exists (this is fine)"
    else
        print_warning "User creation returned HTTP $HTTP_CODE"
    fi
}

# Install demo dependencies
print_status "Installing demo dependencies..."
cd /workspaces/semiont-agents
npm install 2>&1 | grep -v "npm warn" | tail -5 || true
print_success "Dependencies installed"

# Save demo .env credentials
print_status "Saving demo configuration..."
cd /workspaces/semiont-agents

# Use Codespaces URLs if available, otherwise localhost
DEMO_BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
DEMO_FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

cat > .env <<EOF
# Semiont Demo Environment
SEMIONT_VERSION=$SEMIONT_VERSION
SEMIONT_ENV=demo
SEMIONT_ROOT=$SEMIONT_ROOT

# API URLs
BACKEND_URL=$DEMO_BACKEND_URL
FRONTEND_URL=$DEMO_FRONTEND_URL

# Demo Account Credentials
AUTH_EMAIL=$DEMO_EMAIL
AUTH_PASSWORD=$DEMO_PASSWORD

# Optional: Add your API keys here for advanced features
# ANTHROPIC_API_KEY=
# NEO4J_URI=
# NEO4J_USERNAME=
# NEO4J_PASSWORD=
# NEO4J_DATABASE=
EOF
print_success "Demo configuration saved to .env"

echo ""
echo "=========================================="
echo "   ✅ SEMIONT AGENTS DEMO READY!"
echo "=========================================="
echo ""
echo "🌐 Frontend:  ${DEMO_FRONTEND_URL}"
echo "🔌 Backend:   ${DEMO_BACKEND_URL}"
echo "📊 Database:  postgresql://semiont:semiont@postgres:5432/semiont_demo"
echo "📁 Project:   $SEMIONT_ROOT"
echo ""
echo "👤 Demo Account:"
echo "   Email:    $DEMO_EMAIL"
echo "   Password: $DEMO_PASSWORD"
echo ""
echo "🎯 Quick Start:"
echo ""
echo "   1. Visit ${DEMO_FRONTEND_URL} and login"
echo "   2. Run interactive demo:"
echo "      cd /workspaces/semiont-agents"
echo "      npm run demo:interactive"
echo ""
echo "📖 Documentation:"
echo "   • Demo guide:      cat README.md"
echo "   • Container info:  cat docs/CONTAINER.md"
echo "   • Workflow guide:  cat docs/WORKFLOW.md"
echo "   • Interactive UI:  cat docs/INTERACTIVE.md"
echo ""
echo "🔧 Useful Commands:"
echo "   • Check services:  docker compose ps"
echo "   • View logs:       docker compose logs -f"
echo "   • Restart backend: docker compose restart backend"
echo "   • CLI commands:    semiont --help"
echo ""
echo "🚀 Semiont $SEMIONT_VERSION is ready for exploration!"
echo ""
