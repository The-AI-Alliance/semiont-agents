import { Command } from 'commander';
import { config } from 'dotenv';
import { COMMANDS, type CommandName } from './commands/index.js';
import { interactiveCommand } from './commands/interactive.js';
import { DATASETS } from './datasets/loader.js';

// Load .env file
config();

const program = new Command();

program
  .name('demo')
  .description('Semiont demo CLI for legal document processing')
  .version('0.1.0');

// Interactive mode
program
  .command('interactive')
  .description('Launch interactive terminal UI')
  .action(interactiveCommand);

// Dataset commands
program
  .argument('[dataset]', 'Dataset name (dynamically discovered from config/)')
  .argument('[command]', `Command: ${Object.keys(COMMANDS).join(', ')}`)
  .action((datasetArg?: string, commandArg?: string) => {
    if (!datasetArg || !commandArg) {
      program.help();
      return;
    }

    // Runtime validation for dynamic datasets
    if (!(datasetArg in DATASETS)) {
      console.error(`Unknown dataset: ${datasetArg}`);
      console.error(`Available datasets: ${Object.keys(DATASETS).join(', ')}`);
      process.exit(1);
    }

    // Compile-time type-safe validation for static commands
    if (!(commandArg in COMMANDS)) {
      console.error(`Unknown command: ${commandArg}`);
      console.error(`Available commands: ${Object.keys(COMMANDS).join(', ')}`);
      process.exit(1);
    }

    const command = commandArg as CommandName;  // Type-safe after validation

    // Dispatch to type-safe command
    return COMMANDS[command](datasetArg);
  });

program.parse();
