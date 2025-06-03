#!/usr/bin/env node

const { build, watch } = require('../lib/core');
const { program } = require('commander');

program
  .option('--watch', 'Watch mode')
  .option('--configDir <path>', 'Tailwind config directory', 'tailwind-configs')
  .option('--pagesDir <path>', 'Pages directory', 'src/pages')
  .option('--pattern <glob>', 'Pattern for JSX/TSX files', '**/index.{jsx,tsx}')
  .option('--verbose', 'Enable verbose logging')
  .option('--dry-run', 'Only show what will be changed, don\'t write')
  .option('--report <type>', 'Report type (txt, json, html)', 'txt');

program.parse(process.argv);
const options = program.opts();

if (options.watch) {
  watch(options);
} else {
  build(options);
}