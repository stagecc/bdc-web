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
const MAX_RETRIES = Number.parseInt(process.env.EXTERNAL_SYNC_MAX_RETRIES ?? '4', 10);
const BASE_DELAY_MS = Number.parseInt(process.env.EXTERNAL_SYNC_RETRY_DELAY_MS ?? '1500', 10);
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export async function fetchHtmlPage(url) {
  return fetchWithRetry(url, {
    headers: {
      ...COMMON_HEADERS,
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  });
}

export async function fetchJsonPage(url) {
  return fetchWithRetry(url, {
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

async function fetchWithRetry(url, options) {
  let attempt = 0;

  while (true) {
    let response;

    try {
      response = await fetch(url, options);
    } catch (error) {
      if (attempt >= MAX_RETRIES) {
        throw error;
      }

      const delayMs = computeRetryDelayMs(null, attempt);
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(
        `[external-sync] ${url} request failed (${reason}); retrying in ${delayMs}ms (${attempt + 1}/${MAX_RETRIES})`,
      );
      await wait(delayMs);
      attempt += 1;
      continue;
    }

    if (!RETRYABLE_STATUS_CODES.has(response.status)) {
      return response;
    }
    if (attempt >= MAX_RETRIES) return response;

    const delayMs = computeRetryDelayMs(response.headers.get('retry-after'), attempt);
    console.warn(
      `[external-sync] ${url} returned HTTP ${response.status}; retrying in ${delayMs}ms (${attempt + 1}/${MAX_RETRIES})`,
    );

    await wait(delayMs);
    attempt += 1;
  }
}

function computeRetryDelayMs(retryAfterHeader, attempt) {
  const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
  const backoffMs = retryAfterMs ?? BASE_DELAY_MS * 2 ** attempt;
  const jitterMs = Math.floor(Math.random() * 250);
  return backoffMs + jitterMs;
}

function parseRetryAfterMs(value) {
  if (!value) return null;

  const asSeconds = Number.parseInt(value, 10);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) return asSeconds * 1000;

  const asDateMs = Date.parse(value);
  if (!Number.isFinite(asDateMs)) return null;

  const diff = asDateMs - Date.now();
  return diff > 0 ? diff : 0;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
