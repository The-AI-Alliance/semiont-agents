import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import type { DatasetConfig, DatasetConfigWithPaths } from '../../config/types.js';
import type { DatasetYamlConfig } from '../handlers/types.js';
import { HANDLERS } from '../handlers/index.js';

/**
 * Convert YAML config to DatasetConfig with handler functions
 */
function yamlToDatasetConfig(yamlConfig: DatasetYamlConfig): DatasetConfig {
  const handler = HANDLERS[yamlConfig.handler];
  if (!handler) {
    throw new Error(`Unknown handler: ${yamlConfig.handler}. Available handlers: ${Object.keys(HANDLERS).join(', ')}`);
  }

  return {
    name: yamlConfig.name,
    displayName: yamlConfig.displayName || yamlConfig.name,
    emoji: yamlConfig.emoji || '📄',
    shouldChunk: yamlConfig.shouldChunk || false,
    chunkSize: yamlConfig.chunkSize,
    useSmartChunking: yamlConfig.useSmartChunking,
    entityTypes: yamlConfig.entityTypes || [],
    createTableOfContents: yamlConfig.createTableOfContents || false,
    tocTitle: yamlConfig.tocTitle,
    detectCitations: yamlConfig.detectCitations || false,
    cacheFile: yamlConfig.cacheFile || `/tmp/${yamlConfig.name}.cache`,
    isMultiDocument: yamlConfig.isMultiDocument,
    extractionConfig: yamlConfig.extractionConfig ? {
      startPattern: new RegExp(yamlConfig.extractionConfig.startPattern),
      endMarker: yamlConfig.extractionConfig.endMarker,
    } : undefined,

    // Bind handler functions with the config
    downloadContent: () => handler.download(yamlConfig),
    loadText: yamlConfig.isMultiDocument ? undefined : async () => {
      const result = await handler.load(yamlConfig);
      if (typeof result !== 'string') {
        throw new Error(`Handler ${yamlConfig.handler} returned documents but isMultiDocument is false`);
      }
      return result;
    },
    loadDocuments: yamlConfig.isMultiDocument ? async () => {
      const result = await handler.load(yamlConfig);
      if (typeof result === 'string') {
        throw new Error(`Handler ${yamlConfig.handler} returned string but isMultiDocument is true`);
      }
      return result;
    } : undefined,
  };
}

/**
 * Dynamically load all dataset configurations from the config directory
 * Each dataset should be in its own subdirectory with a config.yaml file
 * Scans both config/ and config/private/ directories
 */
export async function loadDatasets(): Promise<Record<string, DatasetConfigWithPaths>> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // In dev: src/datasets/loader.ts -> ../../config
  // In built bundle: dist/cli.js -> ../config
  const isBundled = __filename.includes('/dist/');
  const configDir = isBundled ? join(__dirname, '../config') : join(__dirname, '../../config');

  const datasets: Record<string, DatasetConfigWithPaths> = {};

  async function scanDirectory(basePath: string, relativePathPrefix: string) {
    if (!existsSync(basePath)) {
      return;
    }

    const entries = readdirSync(basePath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      // Try YAML first (preferred), then fall back to TypeScript
      const yamlPath = join(basePath, entry.name, 'config.yaml');
      const tsPath = join(basePath, entry.name, 'config.ts');

      try {
        if (existsSync(yamlPath)) {
          // Load YAML config with handlers
          const yamlContent = readFileSync(yamlPath, 'utf-8');
          const yamlConfig = yaml.load(yamlContent) as DatasetYamlConfig;
          const config = yamlToDatasetConfig(yamlConfig);

          const configWithPaths: DatasetConfigWithPaths = {
            ...config,
            stateFile: join(relativePathPrefix, entry.name, '.state.json'),
          };

          datasets[config.name] = configWithPaths;
        } else if (existsSync(tsPath)) {
          // Fall back to TypeScript config (legacy - dev mode only)
          const module = await import(tsPath);
          if (module.config && typeof module.config === 'object') {
            const config = module.config as DatasetConfig;

            const configWithPaths: DatasetConfigWithPaths = {
              ...config,
              stateFile: join(relativePathPrefix, entry.name, '.state.json'),
            };

            datasets[config.name] = configWithPaths;
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not load config from ${relativePathPrefix}/${entry.name}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  await scanDirectory(configDir, 'config');
  await scanDirectory(join(configDir, 'private'), 'config/private');

  return datasets;
}

// Load datasets at module initialization (top-level await)
export const DATASETS = await loadDatasets();
