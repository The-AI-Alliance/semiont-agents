/**
 * Project Gutenberg Handler
 *
 * Downloads and processes texts from Project Gutenberg
 */

import { writeFileSync, readFileSync } from 'node:fs';
import type { DatasetHandler, DatasetYamlConfig } from './types.js';
import { downloadText, extractSection } from '../chunking.js';
import { printInfo, printSuccess } from '../display.js';

export const gutenbergHandler: DatasetHandler = {
  download: async (config: DatasetYamlConfig) => {
    if (!config.url) {
      throw new Error('Gutenberg handler requires url in config');
    }
    if (!config.cacheFile) {
      throw new Error('Gutenberg handler requires cacheFile in config');
    }

    printInfo(`Downloading from Project Gutenberg...`);
    const rawText = await downloadText(config.url);
    printSuccess(`Downloaded ${rawText.length.toLocaleString()} characters`);

    writeFileSync(config.cacheFile, rawText);
    printSuccess(`Saved to ${config.cacheFile}`);
  },

  load: async (config: DatasetYamlConfig) => {
    if (!config.cacheFile) {
      throw new Error('Gutenberg handler requires cacheFile in config');
    }

    printInfo(`Loading from ${config.cacheFile}...`);
    const rawText = readFileSync(config.cacheFile, 'utf-8');
    printSuccess(`Loaded ${rawText.length.toLocaleString()} characters`);

    // Extract specific section if configured
    let processedText = rawText;
    if (config.extractionConfig) {
      printInfo('Extracting section...');
      // Convert string pattern to RegExp
      const startPattern = new RegExp(config.extractionConfig.startPattern);
      processedText = extractSection(
        rawText,
        startPattern,
        config.extractionConfig.endMarker
      );
      printSuccess(`Extracted ${processedText.length.toLocaleString()} characters`);
    }

    return processedText;
  },
};
