#!/usr/bin/env node

import { build } from 'esbuild'
import { chmod } from 'node:fs/promises'

console.log('📦 Building demo CLI with esbuild...')

try {
  await build({
    entryPoints: ['src/cli.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: 'dist/cli.js',
    external: [
      // Node.js built-ins
      'fs',
      'path',
      'child_process',
      'crypto',
      'os',
      'util',
      'stream',
      'events',
      'buffer',
      'url',
      // External packages
      '@semiont/api-client',
      '@semiont/cli',
      'blessed',
      'commander',
      'dotenv',
      'bcrypt',
      'js-yaml',
      'winston',
      '@colors/colors',
      'colors'
    ],
    banner: {
      js: '#!/usr/bin/env node\n'
    },
    logLevel: 'info'
  })

  await chmod('dist/cli.js', 0o755)

  console.log('✅ Build complete!')
  console.log('📍 Entry point: dist/cli.js')
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}
