# Semiont Agents Demo Workflow

This document describes the four-phase workflow used by the Semiont Agents Demo to process documents and create annotations.

## Overview

The demo follows a sequential workflow with four phases:

1. **Download** - Fetch content from external sources
2. **Load** - Process and upload content to Semiont backend
3. **Annotate** - Create semantic annotations
4. **Validate** - Verify uploaded resources

Each phase can be run independently via the CLI or interactively through the terminal UI.

## Download Phase

Fetches content from various sources and caches it locally.

**Steps:**

1. Fetch from external sources (Cornell LII, arXiv, Hugging Face, etc.)
2. Cache raw content in `data/tmp/<dataset>/`

**Example:**

```bash
demo citizens_united download
```

**Output:**

```
📥 Download
   ✅ Downloaded 123,456 characters
   ✅ Cached to data/tmp/citizens_united/
```

## Load Phase

Processes cached content and uploads it to the Semiont backend.

**Steps:**

1. Read from local cache
2. Format and process text
3. Chunk document (if configured in dataset config)
4. Upload chunks to backend via API
5. Create Table of Contents (if chunking is enabled)
6. Link ToC references to document chunks

**Example:**

```bash
demo citizens_united load
```

**Output:**

```
📤 Load
   ✅ Created 5 chunks (avg 24,691 chars)
   ✅ Created ToC with 5 references
   ✅ All resources uploaded
```

**Configuration:**

Chunking and ToC creation are controlled in the dataset's `config.ts`:

```typescript
export const config: DatasetConfig = {
  // ...
  chunking: { enabled: true, mode: 'simple', targetSize: 5000 },
  tableOfContents: { enabled: true, createLinks: true },
};
```

See [Dataset Configuration Guide](../config/README.md) for details.

## Annotate Phase

Detects patterns in the content and creates semantic annotations.

**Steps:**

1. Detect patterns (e.g., legal citations, references)
2. Create annotations via Semiont API
3. Link annotations to specific text positions

**Example:**

```bash
demo citizens_united annotate
```

**Output:**

```
🔍 Annotate
   ✅ Detected 23 legal citations
   ✅ Created 23 annotations
```

**Annotation Detection:**

Each dataset can implement custom pattern detection. For example, the Citizens United dataset detects legal citations using regex patterns:

```typescript
// Pattern: "123 U.S. 456" or "123 U. S. 456"
const pattern = /\b(\d+)\s+U\.\s*S\.\s+(\d+)\b/g;
```

## Validate Phase

Verifies uploaded resources and displays integrity information.

**Steps:**

1. Fetch all resources (ToC, chunks, documents) from backend
2. Calculate SHA-256 checksums
3. Display media types and text previews
4. Verify resource URLs are accessible

**Example:**

```bash
demo citizens_united validate
```

**Output:**

```
✓ Validate
   ✅ ToC: text/html [sha256:a1b2c3d4...]
   ✅ Chunk 1: text/markdown [sha256:e5f6g7h8...]
   ✅ Chunk 2: text/markdown [sha256:i9j0k1l2...]

📋 Table of Contents:
   http://localhost:3000/en/know/resource/abc123...
```

## Complete Workflow Example

Running all phases in sequence:

```bash
# 1. Download content
demo citizens_united download

# 2. Process and upload
demo citizens_united load

# 3. Create annotations
demo citizens_united annotate

# 4. Verify resources
demo citizens_united validate
```

**Or use the interactive UI:**

```bash
demo interactive
```

Navigate to the dataset, select commands with arrow keys, and press Enter to execute.

## Data Flow Diagram

```
External Source (Cornell LII, arXiv, etc.)
    ↓
[Download] → Local Cache (data/tmp/)
    ↓
[Load] → Process & Chunk → Upload to Backend
    ↓
[Annotate] → Detect Patterns → Create Annotations
    ↓
[Validate] → Fetch & Verify → Display Results
```

## Related Documentation

- [Dataset Configuration Guide](../config/README.md) - Configure chunking, ToC, and annotations
- [Interactive UI Guide](INTERACTIVE.md) - Terminal UI for running workflows
- [Semiont API Client](https://github.com/The-AI-Alliance/semiont/tree/main/packages/api-client) - API reference
