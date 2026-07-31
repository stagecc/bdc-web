import { existsSync } from 'node:fs';
import { cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sitePreset } from './presets/site.mjs';

const PRESETS = {
  site: sitePreset,
};

function getUswdsDistPath(projectRoot) {
  const require = createRequire(import.meta.url);
  const packageEntryPath = require.resolve('@uswds/uswds', {
    paths: [projectRoot],
  });

  let currentDir = dirname(packageEntryPath);

  while (currentDir !== dirname(currentDir)) {
    const distPath = join(currentDir, 'dist');
    if (existsSync(join(distPath, 'img'))) {
      return distPath;
    }

    currentDir = dirname(currentDir);
  }

  throw new Error('Unable to locate @uswds/uswds dist directory');
}

async function copyManagedDirectory(sourceDist, targetPublicDir, directory) {
  const sourceDir = join(sourceDist, directory);
  const targetDir = join(targetPublicDir, directory);

  await rm(targetDir, { recursive: true, force: true });
  await mkdir(dirname(targetDir), { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });
}

async function copyManagedFile(sourceDist, targetPublicDir, filePath) {
  const sourceFile = join(sourceDist, filePath);
  const targetFile = join(targetPublicDir, filePath);

  await mkdir(dirname(targetFile), { recursive: true });
  await cp(sourceFile, targetFile);
}

async function copyManagedLocalFile(sourceRoot, targetPublicDir, localFile) {
  const sourceFile = join(sourceRoot, localFile.source);
  const targetFile = join(targetPublicDir, localFile.target);

  await mkdir(dirname(targetFile), { recursive: true });
  await cp(sourceFile, targetFile);
}

export async function syncUswdsAssets({ projectRoot, presetName = 'site' }) {
  const preset = PRESETS[presetName];

  if (!preset) {
    throw new Error(
      `Unknown preset "${presetName}". Available presets: ${Object.keys(PRESETS).join(', ')}`,
    );
  }

  const resolvedProjectRoot = resolve(projectRoot);
  const sourceDist = getUswdsDistPath(resolvedProjectRoot);
  const localSourceRoot = dirname(fileURLToPath(import.meta.url));
  const targetPublicDir = join(resolvedProjectRoot, 'public');

  for (const prunePath of preset.prunePaths ?? []) {
    await rm(join(targetPublicDir, prunePath), {
      recursive: true,
      force: true,
    });
  }

  for (const directory of preset.managedDirectories ?? []) {
    await copyManagedDirectory(sourceDist, targetPublicDir, directory);
  }

  for (const filePath of preset.managedFiles ?? []) {
    await copyManagedFile(sourceDist, targetPublicDir, filePath);
  }

  for (const localFile of preset.managedLocalFiles ?? []) {
    await copyManagedLocalFile(localSourceRoot, targetPublicDir, localFile);
  }
}
