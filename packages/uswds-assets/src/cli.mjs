#!/usr/bin/env node

import { resolve } from 'node:path';
import { syncUswdsAssets } from './sync.mjs';

function parseArgs(argv) {
  const parsed = {
    project: '.',
    preset: 'site',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextArg = argv[index + 1];

    if (arg === '--project' && nextArg) {
      parsed.project = nextArg;
      index += 1;
      continue;
    }

    if (arg === '--preset' && nextArg) {
      parsed.preset = nextArg;
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    }
  }

  return parsed;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage: bdc-uswds-assets-sync [--project <path>] [--preset <name>]',
      '',
      'Options:',
      '  --project <path>   App root containing a public/ directory (default: .)',
      '  --preset <name>    Asset preset to sync (default: site)',
    ].join('\n'),
  );
  process.stdout.write('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const projectRoot = resolve(process.cwd(), args.project);

  await syncUswdsAssets({ projectRoot, presetName: args.preset });
  process.stdout.write(`Synced USWDS assets (${args.preset}) -> ${projectRoot}/public\n`);
}

main().catch((error) => {
  process.stderr.write(`Asset sync failed: ${error.message}\n`);
  process.exitCode = 1;
});
