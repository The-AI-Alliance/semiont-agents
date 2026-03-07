# Local Semiont

Run Semiont locally using the CLI and a clone of the Semiont repository.

The default local environment configures backend and frontend as **posix** services (local Node.js processes) and the database as a **container** service (Docker/Podman). Provisioning posix services requires the Semiont source repository because the CLI generates `.env` files, installs dependencies, builds the applications, and runs database migrations directly in the repo.

## Prerequisites

- **Node.js** v20 or higher
- **Docker or Podman** (for PostgreSQL container)
- **Git** (to clone the Semiont repository)

## Setup

### 1. Clone the Semiont Repository

```bash
git clone https://github.com/The-AI-Alliance/semiont.git
```

### 2. Install the CLI

```bash
npm install -g @semiont/cli
```

### 3. Create a Project Directory

```bash
mkdir my_semiont_project
cd my_semiont_project
```

### 4. Set Environment Variables

```bash
export SEMIONT_ROOT=$(pwd)
export SEMIONT_ENV=local
export SEMIONT_REPO=/path/to/semiont
```

- `SEMIONT_ROOT` tells the CLI where your project lives, so you can run commands from any directory.
- `SEMIONT_REPO` points to your Semiont repository clone. The CLI uses this to find backend and frontend source code for provisioning.

### 5. Initialize the Project

```bash
semiont init --verbose
```

This creates `semiont.json` and `environments/local.json`.

### 6. Review the Configuration

```bash
cat environments/local.json
```

Edit this file to set database credentials, API keys, or adjust ports.

The default `local.json` configures:
- **backend** and **frontend** as `posix` platform (local processes, requires `SEMIONT_REPO`)
- **database** as `container` platform (Docker/Podman, no repo needed)
- **graph** as `external` platform (Neo4j, requires connection details)
- **inference** as `external` platform (Anthropic, requires API key)

The graph and inference services reference environment variables that must be set before provisioning:

```bash
# Neo4j connection
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USERNAME=neo4j
export NEO4J_PASSWORD=your-password
export NEO4J_DATABASE=neo4j

# Anthropic API
export ANTHROPIC_API_KEY=sk-ant-...
```

### 7. Provision Services

```bash
semiont provision --verbose
```

This generates `.env` files for backend and frontend (inside `SEMIONT_REPO`), installs npm dependencies, runs Prisma migrations, and processes proxy configuration.

### 8. Start Services

```bash
semiont start --verbose
```

Starts the database container, backend, frontend, and proxy.

### 9. Verify

```bash
semiont check
```

### 10. Create an Admin User

```bash
semiont useradd --email you@example.com --generate-password --admin
```

Note the generated password from the output.

### 11. Configure Demo Credentials

The demo scripts need credentials to authenticate against the backend. Copy the example file and fill in the email and password from step 10:

```bash
cp .env.example .env
```

Edit `.env` and set `AUTH_EMAIL` and `AUTH_PASSWORD` to the admin credentials you just created. The other defaults (`BACKEND_URL`, `DATA_DIR`, etc.) are appropriate for a standard local setup.

### 12. Access the Application

Open http://localhost:8080 and log in with the admin credentials from step 10.

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Envoy Proxy | 8080 | http://localhost:8080 (main entry point) |
| Frontend | 3000 | http://localhost:3000 (direct) |
| Backend | 4000 | http://localhost:4000 (direct) |
| PostgreSQL | 5432 | postgresql://localhost:5432 |

## Common Tasks

### Start/Stop Individual Services

```bash
semiont start --service backend
semiont stop --service backend
semiont check
```

### Re-provision After Config Changes

```bash
semiont provision --service frontend
semiont provision --service backend
```

## Relationship to Upstream

The [upstream LOCAL-DEVELOPMENT.md](https://github.com/The-AI-Alliance/semiont/blob/main/docs/LOCAL-DEVELOPMENT.md) documents the same setup from the perspective of the Semiont repository itself. This guide covers setting up a **downstream project** (like semiont-workflows) that uses Semiont as infrastructure via `@semiont/cli` and the cloned repo.

If you need to modify Semiont itself (backend, frontend, or CLI source), use the upstream guide instead.
