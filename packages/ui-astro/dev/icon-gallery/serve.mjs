import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = resolve(__dirname, 'dist');
const packageRoot = resolve(__dirname, '../..');
const port = Number(process.env.PORT ?? 4179);

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('Icon gallery not built. Run `npm run icons:gallery:build -w @bdc/ui-astro` first.');
  process.exit(1);
}

const mimeByExt = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer((request, response) => {
  const requestUrl = request.url ?? '/';
  const cleanPath = requestUrl.split('?')[0];

  if (cleanPath.startsWith('/src/icon/')) {
    const spritePath = resolve(packageRoot, cleanPath.slice(1));
    return sendFile(spritePath, response);
  }

  const relativePath = cleanPath === '/' ? 'index.html' : cleanPath.slice(1);
  const filePath = resolve(distDir, relativePath);

  if (!filePath.startsWith(distDir)) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  sendFile(filePath, response);
});

server.listen(port, () => {
  console.log(`Icon gallery: http://localhost:${port}`);
});

function sendFile(filePath, response) {
  if (!existsSync(filePath)) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
    return;
  }

  const ext = extname(filePath);
  const contentType = mimeByExt[ext] ?? 'application/octet-stream';
  const content = readFileSync(filePath);
  response.writeHead(200, { 'content-type': contentType });
  response.end(content);
}
