// Shared adapter primitives used by both:
// - sync-external-docs.mjs (render markdown output)
// - check-external-updates.mjs (compute lock hashes)
//
// Keeping these in one place avoids drift in HTTP headers
// and source-specific parsing behavior.
const COMMON_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
};

export async function fetchHtmlPage(url) {
  return fetch(url, {
    headers: {
      ...COMMON_HEADERS,
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  });
}

export async function fetchJsonPage(url) {
  return fetch(url, {
    headers: {
      ...COMMON_HEADERS,
      accept: 'application/json,text/plain,*/*',
    },
  });
}

export function extractReadmeBodyHtml(html) {
  // readme.io pages do not expose a stable API for equivalent rendered body HTML,
  // so we extract the content subtree from the page shell.
  const match = html.match(
    /data-testid="RDMD"[^>]*>([\s\S]*?)<\/div><\/div><div class="UpdatedAt"/,
  );
  if (!match?.[1]) {
    throw new Error('Unable to locate readme.io page body');
  }

  return match[1].trim();
}

export function parseZendeskArticleRef(targetPath) {
  const match = targetPath.match(
    /^\/hc\/([^/]+)\/articles\/(\d+)(?:[-/].*)?$/i,
  );
  if (!match) {
    throw new Error(`Invalid Zendesk article path: ${targetPath}`);
  }

  return {
    locale: match[1],
    articleId: match[2],
  };
}

export function stripCloudflareEmailProtection(input) {
  return input.replace(
    /<a[^>]*href="[^"]*\/cdn-cgi\/l\/email-protection[^"]*"[^>]*>[\s\S]*?<\/a>/gi,
    '[email protected]',
  );
}
