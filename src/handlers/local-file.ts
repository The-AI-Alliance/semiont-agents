/**
 * Local File Handler
 *
 * Loads content from local files (no download needed)
 */

import { readFileSync } from 'node:fs';
import type { DatasetHandler, DatasetYamlConfig } from './types.js';
import { printInfo, printSuccess } from '../display.js';

export const localFileHandler: DatasetHandler = {
  download: async (config: DatasetYamlConfig) => {
    // No download needed - file is already local
    printInfo('Local file - no download needed');
  },

  load: async (config: DatasetYamlConfig) => {
    if (!config.cacheFile) {
      throw new Error('Local file handler requires cacheFile (path to local file) in config');
    }

    printInfo(`Loading from ${config.cacheFile}...`);
    const text = readFileSync(config.cacheFile, 'utf-8');
    printSuccess(`Loaded ${text.length.toLocaleString()} characters`);

    return text;
  },
};
