import { existsSync, readFileSync } from 'node:fs';
import { SemiontApiClient, baseUrl, resourceUri, type ResourceUri } from '@semiont/api-client';
import type { DatasetConfigWithPaths } from '../../config/types.js';
import { DATASETS } from '../datasets/loader.js';
import { chunkBySize, chunkText, type ChunkInfo } from '../chunking.js';
import { authenticate } from '../auth.js';
import { showDocumentHistory } from '../history.js';
import { detectCitations } from '../legal-citations.js';
import type { TableOfContentsReference } from '../resources.js';
import {
  printMainHeader,
  printSectionHeader,
  printInfo,
  printSuccess,
  printBatchProgress,
  printCompletion,
  printError,
} from '../display.js';

interface DemoState {
  dataset: string;
  tocId?: ResourceUri;
  chunkIds?: ResourceUri[];
  references?: TableOfContentsReference[];
  formattedText: string;
}

function loadState(dataset: DatasetConfigWithPaths): DemoState {
  if (!existsSync(dataset.stateFile)) {
    throw new Error(`State file ${dataset.stateFile} not found. Run 'load' command first.`);
  }
  const data = readFileSync(dataset.stateFile, 'utf-8');
  const state: DemoState = JSON.parse(data);

  if (state.dataset !== dataset.name) {
    throw new Error(`State file is for dataset '${state.dataset}', but you requested '${dataset.name}'`);
  }

  return state;
}

export async function annotateCommand(datasetName: string): Promise<void> {
  const dataset = DATASETS[datasetName];
  if (!dataset) {
    throw new Error(`Unknown dataset: ${datasetName}. Available: ${Object.keys(DATASETS).join(', ')}`);
  }

  printMainHeader(dataset.emoji || '📄', `${dataset.displayName} Demo - Annotate`);

  try {
    // Read environment variables - NO DEFAULTS, FAIL LOUDLY
    const SEMIONT_URL = process.env.SEMIONT_URL;
    const AUTH_EMAIL = process.env.AUTH_EMAIL;
    const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
    const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

    // Validate required environment variables
    if (!SEMIONT_URL) {
      throw new Error('SEMIONT_URL environment variable is required');
    }

    const client = new SemiontApiClient({
      baseUrl: baseUrl(SEMIONT_URL),
    });

    // Pass 0: Authentication
    printSectionHeader('🔐', 0, 'Authentication');
    await authenticate(client, {
      email: AUTH_EMAIL,
      password: AUTH_PASSWORD,
      accessToken: ACCESS_TOKEN,
    });

    // Load state from load command
    printSectionHeader('📂', 1, 'Load State');
    const state = loadState(dataset);

    // Check if this dataset supports citation detection
    if (!dataset.detectCitations) {
      printInfo('This dataset does not support the annotate command (no citations to detect)');
      printCompletion();
      return;
    }

    if (!state.chunkIds || state.chunkIds.length === 0) {
      printError(new Error('No chunks found in state. Run the load command first.'));
      process.exit(1);
    }

    printSuccess(`Loaded ${state.chunkIds.length} chunk IDs`);

    // Re-chunk the text to get chunk content for annotation detection
    let chunks: ChunkInfo[];
    if (dataset.shouldChunk) {
      if (dataset.useSmartChunking) {
        chunks = chunkText(state.formattedText, dataset.chunkSize!, `${dataset.displayName} - Part`);
      } else {
        chunks = chunkBySize(state.formattedText, dataset.chunkSize!, `${dataset.displayName} - Part`);
      }
    } else {
      chunks = [{
        title: dataset.displayName,
        content: state.formattedText,
        partNumber: 1,
      }];
    }

    let totalAnnotations = 0;

    // Pass 2: Detect Legal Citations
    printSectionHeader('⚖️ ', 2, 'Detect Legal Citations');

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = state.chunkIds[i];

      printBatchProgress(i + 1, chunks.length, `Scanning "${chunk.title}"...`);

      const citations = await detectCitations(chunk.content);

      if (citations.length > 0) {
        printInfo(`Found ${citations.length} citation(s)`, 7);

        for (const citation of citations) {
          await client.createAnnotation(resourceUri(chunkId), {
            motivation: 'linking',
            target: {
              source: chunkId,
              selector: [
                {
                  type: 'TextPositionSelector',
                  start: citation.start,
                  end: citation.end,
                },
                {
                  type: 'TextQuoteSelector',
                  exact: citation.text,
                },
              ],
            },
            body: [{
              type: 'TextualBody',
              value: 'LegalCitation',
              purpose: 'tagging',
            }],
          });

          totalAnnotations++;
        }
      }
    }

    printSuccess(`Detected and tagged ${totalAnnotations} legal citations across ${chunks.length} chunks`);

    // Pass 3: Show Document History
    printSectionHeader('📜', 3, 'Document History');
    await showDocumentHistory(state.chunkIds[0], client);

    // Pass 4: Print Summary
    console.log();
    console.log('📊 Summary:');
    console.log(`   Citations detected: ${totalAnnotations}`);

    printCompletion();
  } catch (error) {
    printError(error as Error);
    process.exit(1);
  }
}
