import { DATASETS } from '../datasets/loader.js';
import { TerminalApp } from '../terminal-app.js';
import { printError } from '../display.js';

export async function interactiveCommand(): Promise<void> {
  // Keep reference to app for cleanup in error handlers
  let app: TerminalApp | null = null;

  // Add global error handlers FIRST, before creating blessed screen
  // This ensures errors don't get swallowed by the blessed UI
  const handleError = (error: Error) => {
    // Force cleanup of blessed UI
    if (app) {
      try {
        app.destroy();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    // Reset terminal
    if (process.stdout.isTTY) {
      process.stdout.write('\x1b[?25h'); // Show cursor
      process.stdout.write('\x1b[0m');   // Reset colors
    }

    // Print error
    printError(error);
    process.exit(1);
  };

  // Register error handlers
  process.on('unhandledRejection', handleError);
  process.on('uncaughtException', handleError);

  // Launch interactive mode directly
  try {
    app = new TerminalApp(DATASETS);
    app.run();
  } catch (error) {
    // Error during initialization
    handleError(error as Error);
  }
}
