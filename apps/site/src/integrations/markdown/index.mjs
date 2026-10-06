import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertPage } from './convert.mjs';

const collectionFile = '__markdown-collections.json';

async function htmlFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== 'markdown') {
      result.push(...(await htmlFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      result.push(path);
    }
  }
  return result.sort();
}

export default function markdownExport() {
  let site;
  return {
    name: 'bdc-markdown-export',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command === 'build') {
          injectRoute({
            pattern: `/${collectionFile}`,
            entrypoint: fileURLToPath(
              new URL('./collections.ts', import.meta.url),
            ),
          });
        }
      },
      'astro:config:done': ({ config }) => {
        site = config.site;
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const collectionsPath = join(root, collectionFile);
        const collections = JSON.parse(await readFile(collectionsPath, 'utf8'));
        await rm(collectionsPath);
        const output = join(root, 'markdown');
        await rm(output, { recursive: true, force: true });
        let count = 0;
        for (const file of await htmlFiles(root)) {
          const path = relative(root, file).split(sep).join('/');
          const route = `/${path.replace(/index\.html$/, '').replace(/\.html$/, '')}`;
          const markdown = convertPage(await readFile(file, 'utf8'), {
            url: new URL(route, site).href,
            collections,
          });
          // Redirect documents have no page content.
          if (markdown === null) continue;
          const destination = join(output, path.replace(/\.html$/, '.md'));
          await mkdir(dirname(destination), { recursive: true });
          await writeFile(destination, markdown);
          count++;
        }
        if (!count) throw new Error('Markdown export produced no pages');
        logger.info(`Exported ${count} Markdown pages to ${output}`);
      },
    },
  };
}
