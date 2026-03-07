# Dataset Handlers

This document describes how semiont-workflows consumes dataset configurations from the [structured-knowledge](https://github.com/The-AI-Alliance/structured-knowledge) submodule and processes them through a handler registry.

## Architecture

```
structured-knowledge/scenarios/<dataset>/config.yaml
        |
        v
  src/datasets/loader.ts       Parses YAML, resolves paths, binds handler functions
        |
        v
  src/handlers/index.ts         Handler registry maps handler names to implementations
        |
        v
  src/handlers/<handler>.ts     Handler implements download() and load()
        |
        v
  src/types.ts                  DatasetConfig interface consumed by the workflow commands
```

At startup, `src/datasets/loader.ts` scans `structured-knowledge/scenarios/` (and `scenarios/private/`) for directories containing a `config.yaml`. Each YAML file specifies a `handler` field that selects the implementation.

## How It Works

1. **YAML parsing** -- `loader.ts` reads the `config.yaml` and deserializes it into a `DatasetYamlConfig` (defined in `src/handlers/types.ts`).

2. **Handler lookup** -- The `handler` field (e.g., `cornell-lii`, `arxiv`) is looked up in the `HANDLERS` registry (`src/handlers/index.ts`).

3. **Path resolution** -- `cacheFile` paths are resolved: absolute paths are kept as-is, relative paths are resolved against the scenario directory.

4. **Function binding** -- The handler's `download()` and `load()` methods are bound to the resolved config, producing a `DatasetConfig` with callable functions that the workflow commands (`download`, `load`, `annotate`, `validate`) use directly.

## Handler Registry

| Handler | Source Type | What It Does |
|---------|------------|-------------|
| `cornell-lii` | Cornell Legal Information Institute | Fetches legal opinions by URL, formats as markdown |
| `arxiv` | arXiv.org | Downloads papers by arXiv ID |
| `gutenberg` | Project Gutenberg | Downloads texts, extracts content between configurable start/end markers |
| `huggingface` | HuggingFace Datasets | Fetches datasets by name, supports multi-document with configurable count |
| `local-file` | Local filesystem | Reads a single file (no download step) |
| `local-multi-doc` | Local filesystem | Reads multiple files from a directory |
| `json-multi-doc` | Local JSON file | Multi-phase upload with cross-references, Handlebars templates, and annotations |

## Handler Interface

Every handler implements the `DatasetHandler` interface (`src/handlers/types.ts`):

```typescript
interface DatasetHandler {
  download: (config: DatasetYamlConfig) => Promise<void>;
  load: (config: DatasetYamlConfig) => Promise<string | DocumentInfo[]>;
  customLoad?: (config, scenarioDir, client, auth) => Promise<CustomLoadResult>;
}
```

- **`download`** fetches content from an external source and caches it locally.
- **`load`** reads the cached content and returns either a single string (for single-document datasets) or a `DocumentInfo[]` array (for multi-document datasets). The `isMultiDocument` flag in the YAML config determines which is expected.
- **`customLoad`** (optional) gives the handler full control over the upload workflow. When present, the `load` command delegates entirely to this method instead of using the standard chunking/upload pipeline. The `json-multi-doc` handler uses this for multi-phase uploads with cross-references between resources.

## YAML Config Reference

The YAML format is documented in the [structured-knowledge README](https://github.com/The-AI-Alliance/structured-knowledge/blob/main/README.md). The key fields consumed by this codebase:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Internal identifier |
| `displayName` | string | Human-readable title |
| `emoji` | string | Visual identifier |
| `handler` | string | Handler name (must match a key in the registry) |
| `url` | string | Source URL (for web-based handlers) |
| `dataset` | string | Dataset identifier (for arxiv/huggingface) |
| `cacheFile` | string | Local cache path (absolute or relative to scenario dir) |
| `shouldChunk` | boolean | Whether to split content into chunks |
| `chunkSize` | number | Characters per chunk |
| `useSmartChunking` | boolean | Paragraph-aware chunking |
| `isMultiDocument` | boolean | Multi-document workflow |
| `createTableOfContents` | boolean | Generate a ToC linking chunks |
| `detectCitations` | boolean | Run citation detection during annotation |
| `entityTypes` | string[] | Tags/categories for the content |
| `highlightPhases` | array | AI-powered annotation phases (uses Semiont's annotateHighlights) |

## Adding a New Handler

1. Create `src/handlers/<name>.ts` implementing `DatasetHandler`.
2. Register it in `src/handlers/index.ts`.
3. Use the handler name in any `config.yaml` via the `handler` field.

No changes to the loader or workflow commands are needed -- the registry picks it up automatically.
