import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import {
  escapeRegExp,
  findIgnoredRedirects,
  ignoredHostnamePattern,
} from './link-exclusions.mjs';

const USAGE =
  'Usage: node scripts/check-links.mjs <offline|online|unique> [app] [--verbose] [--download [file.csv]]';

const root = resolve(import.meta.dirname, '..');
const [mode = 'offline', ...options] = process.argv.slice(2);
const { verbose, download, downloadPath, positionalOptions } =
  parseOptions(options);
const requestedApp = positionalOptions[0];

if (
  !['offline', 'online', 'unique'].includes(mode) ||
  positionalOptions.length > 1
) {
  console.error(USAGE);
  process.exit(1);
}

if (download && mode === 'unique') {
  console.warn('--download is ignored for unique checks (no error report).');
}

const appsDirectory = join(root, 'apps');
const discoveredApps = readdirSync(appsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const directory = join(appsDirectory, entry.name);
    const packagePath = join(directory, 'package.json');

    if (!existsSync(packagePath)) return null;

    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    if (!packageJson.scripts?.build) return null;

    return { directory, name: entry.name, workspace: packageJson.name };
  })
  .filter(Boolean);

const apps = requestedApp
  ? discoveredApps.filter(
      (app) => app.name === requestedApp || app.workspace === requestedApp,
    )
  : discoveredApps;

if (requestedApp && apps.length === 0) {
  console.error(`No buildable app workspace found for "${requestedApp}".`);
  process.exit(1);
}

function parseOptions(argv) {
  const positionalOptions = [];
  let verbose = false;
  let download = false;
  let downloadPath = join(root, 'lychee-errors.csv');

  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];

    if (option === '--verbose') {
      verbose = true;
      continue;
    }

    if (option === '--download') {
      download = true;
      const next = argv[index + 1];
      if (next && !next.startsWith('-')) {
        downloadPath = resolveDownloadPath(next);
        index += 1;
      }
      continue;
    }

    if (option.startsWith('--download=')) {
      download = true;
      const value = option.slice('--download='.length);
      if (value) downloadPath = resolveDownloadPath(value);
      continue;
    }

    if (option.startsWith('-')) {
      console.error(`Unknown option: ${option}\n${USAGE}`);
      process.exit(1);
    }

    positionalOptions.push(option);
  }

  return { verbose, download, downloadPath, positionalOptions };
}

function resolveDownloadPath(value) {
  return isAbsolute(value) ? value : resolve(process.cwd(), value);
}

function csvCell(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function toCsv(rows) {
  const columns = ['app', 'source', 'url', 'code', 'error'];
  return [
    columns.join(','),
    ...rows.map((row) =>
      columns.map((column) => csvCell(row[column])).join(','),
    ),
  ].join('\n');
}

function relativizeSource(source) {
  let path = source;

  try {
    if (source.startsWith('file:')) {
      path = decodeURIComponent(new URL(source).pathname);
    }
  } catch {
    path = source;
  }

  if (path.startsWith(root)) return path.slice(root.length + 1);
  return path;
}

function errorRowsFromReport(report, appName) {
  const errorMap = report.error_map ?? report.fail_map ?? {};
  const rows = [];

  for (const [source, entries] of Object.entries(errorMap)) {
    for (const entry of entries ?? []) {
      rows.push({
        app: appName,
        source: relativizeSource(source),
        url: entry.url ?? '',
        code: entry.status?.code ?? '',
        error: entry.status?.text ?? entry.status?.details ?? '',
      });
    }
  }

  return rows.sort(
    (left, right) =>
      left.url.localeCompare(right.url) ||
      left.source.localeCompare(right.source),
  );
}

function writeErrorCsv(path, rows) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${toCsv(rows)}\n`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
    ...options,
  });

  if (result.error?.code === 'ENOENT') {
    console.error(
      `Could not find ${command}. Install it and ensure it is on PATH.`,
    );
    process.exit(1);
  }

  return result;
}

let hasBuildFailures = false;
let hasLinkFailures = false;
const errorRows = [];
const writeCsv = download && mode !== 'unique';

for (const app of apps) {
  console.log(`\nBuilding ${app.workspace}...`);
  const build = run('npm', ['run', 'build', '--workspace', app.workspace]);
  if (build.status !== 0) {
    hasBuildFailures = true;
    continue;
  }

  console.log(`\nChecking links in ${app.name}...`);
  const args = [
    '--config',
    join(root, 'lychee.toml'),
    '--root-dir',
    join(app.directory, 'dist'),
  ];
  const reportPath = join(root, `.lychee-${app.name}-report.json`);

  if (mode === 'online') {
    args.push(
      '--scheme',
      'https',
      '--scheme',
      'http',
      '--cache',
      '--max-cache-age',
      '2d',
    );
  } else {
    args.push('--offline');
  }

  if (!verbose) {
    args.push('--exclude', ignoredHostnamePattern());

    if (mode === 'online') {
      const redirects = await findIgnoredRedirects(join(app.directory, 'dist'));
      console.log(
        `Ignoring ${redirects.length} Bitly redirect(s) to configured hostnames.`,
      );
      for (const url of redirects) {
        args.push('--exclude', `^${escapeRegExp(url)}$`);
      }
    }
  }
  if (mode === 'unique') args.push('--format', 'compact');
  if (writeCsv) args.push('--format', 'json', '--output', reportPath);
  args.push(`apps/${app.name}/dist/**/*.html`);

  const check = run(
    'lychee',
    args,
    mode === 'unique' ? { stdio: 'pipe' } : undefined,
  );

  if (mode === 'unique') {
    const output = `${check.stdout ?? ''}\n${check.stderr ?? ''}`;
    const distUrl = new URL(`${join(app.directory, 'dist')}/`, 'file:').href;
    const links = [...output.matchAll(/file:\/\/\/[^ )\n]+/g)]
      .map(([url]) => url.replace(distUrl, '/'))
      .filter((url, index, all) => all.indexOf(url) === index)
      .sort();
    console.log(links.join('\n'));
  } else if (check.status !== 0) {
    hasLinkFailures = true;
  }

  if (writeCsv && existsSync(reportPath)) {
    try {
      const report = JSON.parse(readFileSync(reportPath, 'utf8'));
      const rows = errorRowsFromReport(report, app.name);
      errorRows.push(...rows);
      console.log(
        `${app.name}: ${rows.length} error(s) of ${report.total ?? 0} total link(s).`,
      );
    } catch (error) {
      console.error(
        `Could not parse Lychee report for ${app.name}: ${error.message}`,
      );
    } finally {
      unlinkSync(reportPath);
    }
  }
}

if (writeCsv) {
  writeErrorCsv(downloadPath, errorRows);
  console.log(`\nWrote ${errorRows.length} error(s) to ${downloadPath}`);
}

if (hasBuildFailures || (hasLinkFailures && !writeCsv)) process.exit(1);
