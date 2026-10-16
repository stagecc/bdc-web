export const markdownExportIgnore = {
  site: ['404.html', '404/', 'tagged/', 'search/index.html', 'search.html'],
  docs: ['404.md', '404.mdx', '404/', 'strategic-planning.md'],
};

export function isMarkdownExportIgnored(app, path) {
  return markdownExportIgnore[app].some((entry) =>
    entry.endsWith('/') ? path.startsWith(entry) : path === entry,
  );
}
