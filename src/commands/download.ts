import { existsSync } from 'node:fs';
import { DATASETS } from '../datasets/loader.js';
import {
  printMainHeader,
  printSectionHeader,
  printInfo,
  printSuccess,
  printCompletion,
  printError,
} from '../display.js';

export async function downloadCommand(datasetName: string): Promise<void> {
  const dataset = DATASETS[datasetName];
  if (!dataset) {
    throw new Error(`Unknown dataset: ${datasetName}. Available: ${Object.keys(DATASETS).join(', ')}`);
  }

  printMainHeader(dataset.emoji, `${dataset.displayName} Demo - Download`);

  try {
    // Check if already cached
    if (existsSync(dataset.cacheFile)) {
      printInfo(`Cache file already exists: ${dataset.cacheFile}`);
      console.log('💡 Use --force to re-download, or run the load command to proceed.');
      return;
    }

    // Check if download is needed
    if (!dataset.downloadContent) {
      printInfo('This dataset is already local, no download needed.');
      printSuccess(`Using: ${dataset.cacheFile}`);
      printCompletion();
      return;
    }

    // Ensure data/tmp directory exists
    const { mkdirSync } = await import('node:fs');
    mkdirSync('data/tmp', { recursive: true });

    // Download content
    printSectionHeader('📥', 1, 'Download Content');
    await dataset.downloadContent();

    printCompletion();
    console.log(`\n💡 Next step: Run "demo ${datasetName} load" to process and upload\n`);
  } catch (error) {
    printError(error as Error);
    throw error;
  }
}
