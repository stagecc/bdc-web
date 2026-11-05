import { cp, mkdir, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nodeFileTrace } from '@vercel/nft';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const server = resolve(
  root,
  'apps/consortium/.amplify-hosting/compute/default',
);
async function modules(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((e) => e.name !== 'node_modules')
      .map(async (entry) => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory()
          ? modules(path)
          : path.endsWith('.mjs')
            ? [path]
            : [];
      }),
  );
  return files.flat();
}
const { fileList } = await nodeFileTrace(await modules(server), {
  base: root,
  processCwd: server,
});
let copied = 0;
for (const file of fileList) {
  if (!file.startsWith('node_modules/')) continue;
  const target = resolve(server, file);
  await mkdir(dirname(target), { recursive: true });
  await cp(resolve(root, file), target, { dereference: true, recursive: true });
  copied++;
}
console.log(
  `Packaged ${copied} runtime dependency files in ${relative(root, server)}.`,
);
