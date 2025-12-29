# Semiont Agents Demo

Configuration-driven demonstration of [Semiont](https://github.com/The-AI-Alliance/semiont) SDK features: document processing, chunking, annotations, and validation.

> **About Semiont**: A semantic annotation and knowledge extraction platform developed by [The AI Alliance](https://thealliance.ai/). This demo repository showcases Semiont's capabilities using published artifacts. For development and contributing, see the [main Semiont repository](https://github.com/The-AI-Alliance/semiont).

## Try in GitHub Codespaces

Launch the complete Semiont Agents Demo environment with one click (no installation required):

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new/The-AI-Alliance/semiont-agents)

Includes:

- Semiont frontend, backend, and database (all pre-configured)
- Demo account with sample data
- Interactive terminal UI for dataset operations
- Ready to run in ~2 minutes

See [.devcontainer/README.md](.devcontainer/README.md) for container details.

## Quick Start

```bash
# Run in interactive terminal UI mode
demo interactive

# Or run specific commands via CLI
demo <dataset> <command>

# Example: Download and process Citizens United case
demo citizens_united download
demo citizens_united load
demo citizens_united annotate
```

## Prerequisites

Everything is pre-configured when using GitHub Codespaces! Just click the badge above.

## Modes

### Interactive Terminal UI

```bash
demo interactive
```

Full-screen terminal interface with three panels:

- **Left**: Dataset list with command tree
- **Bottom**: Detail view (config/status)
- **Right**: Activity log (command output)

**Controls:** `↑/↓` or `j/k` (navigate), `Enter` (execute), `Tab` (cycle focus), `q` (quit)

See [docs/INTERACTIVE.md](docs/INTERACTIVE.md) for details.

### CLI Mode

```bash
demo <dataset> <command>
```

**Datasets:** `citizens_united`, `prometheus_bound`, `freelaw_nh`, `arxiv`, `hiking`, and private datasets in `config/private/`

**Commands:**

- `download` - Fetch content, cache in `data/tmp/`
- `load` - Process cache, upload to backend, create ToC
- `annotate` - Detect citations, create annotations
- `validate` - Fetch all resources, verify content, show checksums

**📚 [Dataset Configuration Guide](config/README.md)** - Learn how to add your own datasets

**🔧 [Semiont API Client Documentation](https://github.com/The-AI-Alliance/semiont/tree/main/packages/api-client)** - Full API reference and usage examples

## Project Structure

```text
semiont-agents/
├── src/
│   ├── cli.ts               # CLI entry point
│   ├── commands/            # Command implementations
│   │   ├── index.ts         # Command registry
│   │   ├── download.ts      # Download command
│   │   ├── load.ts          # Load command
│   │   ├── annotate.ts      # Annotate command
│   │   ├── validate.ts      # Validate command
│   │   └── interactive.ts   # Interactive UI launcher
│   ├── datasets/
│   │   └── loader.ts        # Dynamic dataset discovery
│   ├── auth.ts              # Authentication
│   ├── annotations.ts       # Annotation creation/linking
│   ├── chunking.ts          # Text chunking
│   ├── resources.ts         # Upload & ToC creation
│   ├── validation.ts        # Resource validation
│   └── terminal-app.ts      # Interactive UI
└── config/                   # Dataset configurations
    ├── types.ts             # Config type definitions
    ├── citizens_united/     # Each dataset has config.ts
    └── private/             # Private datasets (gitignored)
```

**📖 [Workflow Guide](docs/WORKFLOW.md)** - Detailed explanation of the four-phase processing workflow

## Example Output

```text
📚 CITIZENS UNITED Demo
════════════════════════════════════════════

🔐 Authentication
   ✅ Authenticated as you@example.com

📥 Download
   ✅ Downloaded 123,456 characters

📤 Load
   ✅ Created 5 chunks (avg 24,691 chars)
   ✅ Created ToC with 5 references

🔍 Annotate
   ✅ Detected 23 legal citations

✓ Validate
   ✅ ToC: text/html [sha256:a1b2c3...]
   ✅ Chunk 1: text/markdown [sha256:d4e5f6...]

📋 Table of Contents:
   http://localhost:3000/en/know/resource/abc123...
```

## Related Documentation

- [Workflow Guide](docs/WORKFLOW.md) - Four-phase processing workflow
- [Interactive UI Guide](docs/INTERACTIVE.md) - Terminal UI details
- [Dataset Configuration Guide](config/README.md) - Adding and configuring datasets
- [Container Documentation](docs/CONTAINER.md) - Devcontainer setup and details
- [Main Semiont Repository](https://github.com/The-AI-Alliance/semiont) - Development and contributing

## Contributing

This is a demo repository showcasing Semiont. For contributions to Semiont itself, please see the [main Semiont repository](https://github.com/The-AI-Alliance/semiont).

For improvements to this demo:
- Issues and pull requests are welcome
- Please follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- See [LICENSE](LICENSE) for licensing information

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
