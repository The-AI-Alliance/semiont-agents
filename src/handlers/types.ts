/**
 * Dataset Handler Types
 *
 * Handlers implement the actual logic for downloading and loading datasets.
 * Configs (YAML files) reference handlers and provide configuration data.
 */

import type { DocumentInfo } from '../../config/types.js';

/**
 * Configuration data from YAML file
 */
export interface DatasetYamlConfig {
  name: string;
  displayName: string;
  emoji?: string;
  handler: string;

  // Handler-specific configuration
  url?: string;
  dataset?: string;  // For HuggingFace/ArXiv datasets (arxiv ID or HF dataset name)
  count?: number;

  // Processing options
  shouldChunk?: boolean;
  chunkSize?: number;
  useSmartChunking?: boolean;
  entityTypes?: string[];
  createTableOfContents?: boolean;
  tocTitle?: string;
  detectCitations?: boolean;

  // Text extraction (for Gutenberg handler)
  extractionConfig?: {
    startPattern: string;  // Regex pattern as string
    endMarker: string;
  };

  // Paths
  cacheFile?: string;

  // Multi-document support
  isMultiDocument?: boolean;
}

/**
 * Handler implementation interface
 */
export interface DatasetHandler {
  /**
   * Download content from external source and cache it
   */
  download: (config: DatasetYamlConfig) => Promise<void>;

  /**
   * Load and process cached content
   * Returns either text (single document) or documents array
   */
  load: (config: DatasetYamlConfig) => Promise<string | DocumentInfo[]>;
}

/**
 * Handler registry
 */
export type HandlerRegistry = Record<string, DatasetHandler>;
