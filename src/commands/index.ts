import { downloadCommand } from './download.js';
import { loadCommand } from './load.js';
import { annotateCommand } from './annotate.js';
import { validateCommand } from './validate.js';

// Type-safe command registry (commands are statically defined)
export const COMMANDS = {
  download: downloadCommand,
  load: loadCommand,
  annotate: annotateCommand,
  validate: validateCommand
} as const;

// Extract command names as a union type for compile-time safety
export type CommandName = keyof typeof COMMANDS;

// Command function signature - all commands accept a dataset name string
export type CommandFunction = (datasetName: string) => Promise<void>;
