/**
 * Local Multi-Document Handler
 *
 * Loads multiple documents from a local directory (text and images)
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { DatasetHandler, DatasetYamlConfig } from './types.js';
import type { DocumentInfo } from '../types.js';
import { printInfo, printSuccess } from '../display.js';

export const localMultiDocHandler: DatasetHandler = {
  download: async (config: DatasetYamlConfig) => {
    // No download needed - files are already local
    printInfo('Local files - no download needed');
  },

  load: async (config: DatasetYamlConfig) => {
    if (!config.cacheFile) {
      throw new Error('Local multi-doc handler requires cacheFile (directory path) in config');
    }

    const documents: DocumentInfo[] = [];
    const dirPath = config.cacheFile;

    printInfo('Loading documents from local directory...');

    const files = readdirSync(dirPath);

    for (const file of files) {
      // Skip config files and hidden files
      if (file === 'config.ts' || file === 'config.yaml' || file === '.state.json' || file.startsWith('.')) {
        continue;
      }

      const filePath = join(dirPath, file);
      const ext = extname(file).toLowerCase();

      try {
        if (ext === '.md' || ext === '.txt') {
          // Text document
          const content = readFileSync(filePath, 'utf-8');
          documents.push({
            title: file.replace(/\.(md|txt)$/, ''),
            content,
            format: ext === '.md' ? 'text/markdown' : 'text/plain',
          });
        } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
          // Image document
          const content = readFileSync(filePath);
          const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
          documents.push({
            title: file.replace(/\.(jpg|jpeg|png)$/, ''),
            content,
            format: mimeType,
          });
        }
      } catch (error) {
        printInfo(`  Skipping ${file}: ${error instanceof Error ? error.message : error}`, 3);
      }
    }

    printSuccess(`Loaded ${documents.length} documents`);

    documents.forEach((doc, i) => {
      const size = typeof doc.content === 'string'
        ? `${doc.content.length.toLocaleString()} chars`
        : `${doc.content.length.toLocaleString()} bytes`;
      printInfo(`  ${i + 1}. ${doc.title} (${size})`, 3);
    });

    return documents;
  },
};
