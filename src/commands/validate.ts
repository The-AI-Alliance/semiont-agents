import { existsSync, readFileSync } from 'node:fs';
import { SemiontApiClient, baseUrl, type ResourceUri } from '@semiont/api-client';
import type { DatasetConfigWithPaths } from '../../config/types.js';
import { DATASETS } from '../datasets/loader.js';
import { authenticate } from '../auth.js';
import { validateResources, formatValidationResults } from '../validation.js';
import type { TableOfContentsReference } from '../resources.js';
import {
  printMainHeader,
  printSectionHeader,
  printSuccess,
  printCompletion,
  printError,
} from '../display.js';

// Environment configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const AUTH_EMAIL = process.env.AUTH_EMAIL || 'you@example.com';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

interface DemoState {
  dataset: string;
  tocId?: ResourceUri;
  chunkIds?: ResourceUri[];
  documentIds?: ResourceUri[];
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

export async function validateCommand(datasetName: string): Promise<void> {
  const dataset = DATASETS[datasetName];
  if (!dataset) {
    throw new Error(`Unknown dataset: ${datasetName}. Available: ${Object.keys(DATASETS).join(', ')}`);
  }

  printMainHeader(dataset.emoji, `${dataset.displayName} Demo - Validate`);

  try {
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

    // Load state from load command
    printSectionHeader('📂', 1, 'Load State');
    const state = loadState(dataset);

    // Collect all resource URIs
    const allResources: ResourceUri[] = [];

    if (state.tocId) {
      allResources.push(state.tocId);
    }

    if (state.chunkIds) {
      allResources.push(...state.chunkIds);
    }

    if (state.documentIds) {
      allResources.push(...state.documentIds);
    }

    printSuccess(`Found ${allResources.length} resources to validate`);
    console.log();

    // Pass 2: Validate Resources
    printSectionHeader('✓', 2, 'Validate Resources');
    const results = await validateResources(allResources, client);

    // Display results
    const formattedLines = formatValidationResults(results);
    formattedLines.forEach(line => console.log(line));

    // Summary
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log();
    console.log('📊 Summary:');
    console.log(`   Total resources: ${results.length}`);
    console.log(`   ✓ Successful: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   ✗ Errors: ${errorCount}`);
    }

    printCompletion();
  } catch (error) {
    printError(error as Error);
    process.exit(1);
  }
}
