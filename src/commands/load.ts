import { existsSync, writeFileSync } from 'node:fs';
import { SemiontApiClient, baseUrl, type ResourceUri } from '@semiont/api-client';
import { DATASETS } from '../datasets/loader.js';
import { chunkBySize, chunkText, type ChunkInfo } from '../chunking.js';
import { authenticate } from '../auth.js';
import {
  uploadChunks,
  uploadDocuments,
  createTableOfContents,
  createDocumentTableOfContents,
  type TableOfContentsReference,
} from '../resources.js';
import { createStubReferences, linkReferences } from '../annotations.js';
import { showDocumentHistory } from '../history.js';
import { getLayer1Path } from '../filesystem-utils.js';
import {
  printMainHeader,
  printSectionHeader,
  printInfo,
  printSuccess,
  printDownloadStats,
  printChunkingStats,
  printResults,
  printCompletion,
  printError,
  printFilesystemPath,
} from '../display.js';

// Environment configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const AUTH_EMAIL = process.env.AUTH_EMAIL || 'you@example.com';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const DATA_DIR = process.env.DATA_DIR || '/tmp/semiont/data/uploads';

interface DemoState {
  dataset: string;
  tocId?: ResourceUri;
  chunkIds?: ResourceUri[];
  references?: TableOfContentsReference[];
  formattedText: string;
}

function saveState(dataset: { name: string; stateFile: string }, state: Omit<DemoState, 'dataset'>): void {
  const fullState: DemoState = { dataset: dataset.name, ...state };
  writeFileSync(dataset.stateFile, JSON.stringify(fullState, null, 2));
}

export async function loadCommand(datasetName: string): Promise<void> {
  const dataset = DATASETS[datasetName];
  if (!dataset) {
    throw new Error(`Unknown dataset: ${datasetName}. Available: ${Object.keys(DATASETS).join(', ')}`);
  }

  printMainHeader(dataset.emoji, `${dataset.displayName} Demo - Load`);

  try {
    // Check if cache file exists
    if (!existsSync(dataset.cacheFile)) {
      printError(new Error(`Cache file not found: ${dataset.cacheFile}`));
      console.log(`\n💡 Run "demo ${datasetName} download" first to download the content.\n`);
      process.exit(1);
    }

    const client = new SemiontApiClient({
      baseUrl: baseUrl(BACKEND_URL),
    });

    // Pass 0: Authentication
    printSectionHeader('🔐', 0, 'Authentication');
    await authenticate(client, {
      email: AUTH_EMAIL,
      password: AUTH_PASSWORD,
      accessToken: ACCESS_TOKEN,
    });

    // Branch: Multi-document vs Single-document workflow
    let chunkIds: ResourceUri[];
    let tocId: ResourceUri | undefined;
    let references: TableOfContentsReference[] | undefined;
    let formattedText = '';

    if (dataset.isMultiDocument && dataset.loadDocuments) {
      // Multi-document workflow
      printSectionHeader('📥', 1, 'Load Documents');
      const documents = await dataset.loadDocuments();

      // Pass 2: Upload Documents
      printSectionHeader('📤', 2, 'Upload Documents');
      chunkIds = await uploadDocuments(documents, client, {
        entityTypes: dataset.entityTypes,
        dataDir: DATA_DIR,
      });

      // Pass 3: Create Table of Contents (if needed)
      if (dataset.createTableOfContents) {
        printSectionHeader('📑', 3, 'Create Table of Contents');
        const result = await createDocumentTableOfContents(documents, client, {
          title: dataset.tocTitle!,
          entityTypes: dataset.entityTypes,
          dataDir: DATA_DIR,
        });
        tocId = result.tocId;
        references = result.references;
      }
    } else if (dataset.loadText) {
      // Single-document workflow
      printSectionHeader('📥', 1, 'Load Document');
      formattedText = await dataset.loadText();

      // Pass 2: Chunk the Document (or create single chunk)
      let chunks: ChunkInfo[];
      if (dataset.shouldChunk) {
        printSectionHeader('✂️ ', 2, 'Chunk Document');
        if (dataset.useSmartChunking) {
          printInfo(`Chunking at paragraph boundaries (~${dataset.chunkSize} chars per chunk)...`);
          chunks = chunkText(formattedText, dataset.chunkSize!, `${dataset.displayName} - Part`);
        } else {
          printInfo(`Chunking into sections (~${dataset.chunkSize} chars per chunk)...`);
          chunks = chunkBySize(formattedText, dataset.chunkSize!, `${dataset.displayName} - Part`);
        }
        const totalChars = chunks.reduce((sum, c) => sum + c.content.length, 0);
        const avgChars = Math.round(totalChars / chunks.length);
        printDownloadStats(totalChars, totalChars);
        printChunkingStats(chunks.length, avgChars);
      } else {
        printSectionHeader('📄', 2, 'Create Single Document');
        printInfo('Loading as a single document (no chunking)...');
        chunks = [{
          title: dataset.displayName,
          content: formattedText,
          partNumber: 1,
        }];
        printSuccess(`Created single document with ${formattedText.length.toLocaleString()} characters`);
      }

      // Pass 3: Upload Chunks
      printSectionHeader('📤', 3, 'Upload Chunks');
      chunkIds = await uploadChunks(chunks, client, {
        entityTypes: dataset.entityTypes,
        dataDir: DATA_DIR,
      });

      // Pass 4: Create Table of Contents (if needed)
      if (dataset.createTableOfContents) {
        printSectionHeader('📑', 4, 'Create Table of Contents');
        const result = await createTableOfContents(chunks, client, {
          title: dataset.tocTitle!,
          entityTypes: dataset.entityTypes,
          dataDir: DATA_DIR,
        });
        tocId = result.tocId;
        references = result.references;
      }
    } else {
      throw new Error(`Dataset ${dataset.name} must have either loadText or loadDocuments configured`);
    }

    // Shared workflow: Create stub references and link (if TOC was created)
    if (dataset.createTableOfContents && tocId && references) {

      // Pass 5: Create Stub References
      printSectionHeader('🔗', 5, 'Create Stub References');
      const referencesWithIds = await createStubReferences(tocId, references, chunkIds, client, {
        dataDir: DATA_DIR,
      });

      // Pass 6: Link References to Documents
      printSectionHeader('🎯', 6, 'Link References to Documents');
      const linkedCount = await linkReferences(tocId, referencesWithIds, client);

      // Pass 7: Show Document History
      printSectionHeader('📜', 7, 'Document History');
      await showDocumentHistory(tocId, client);

      // Pass 8: Print Results
      printResults({
        tocId,
        chunkIds,
        linkedCount,
        totalCount: references.length,
        frontendUrl: FRONTEND_URL,
      });
    } else {
      // Pass 4: Show Document History (for non-TOC datasets)
      printSectionHeader('📜', 4, 'Document History');
      await showDocumentHistory(chunkIds[0], client);

      // Print results
      printSectionHeader('✨', 5, 'Results');
      console.log();
      console.log('📄 Document:');
      const parts = chunkIds[0].split('/resources/');
      if (parts.length !== 2 || !parts[1]) {
        throw new Error(`Invalid resource ID format: ${chunkIds[0]}`);
      }
      const resourceId = parts[1];
      console.log(`   ${FRONTEND_URL}/en/know/resource/${resourceId}`);
      console.log();
      printFilesystemPath('Layer 1', getLayer1Path(chunkIds[0], DATA_DIR));
    }

    // Save state for annotate command
    saveState(dataset, {
      tocId,
      chunkIds,
      references,
      formattedText,
    });

    printCompletion();
    if (dataset.detectCitations) {
      console.log(`\n💡 Next step: Run "demo ${datasetName} annotate" to detect citations\n`);
    }
  } catch (error) {
    printError(error as Error);
    process.exit(1);
  }
}
