const DEFAULT_SITE_NAME = 'BioData Catalyst';
const DEFAULT_DESCRIPTION =
  'NHLBI BioData Catalyst is a cloud-based ecosystem that helps researchers find, access, share, store, and analyze biomedical data in secure workspaces.';

type SeoImage = string | { src: string };

export interface SeoConfig {
  title?: string;
  description?: string | null;
  keywords?: string[] | null;
  canonical?: string;
  image?: SeoImage | null;
  robots?: string;
  type?: 'website' | 'article';
}

interface ResolveSeoInput {
  title: string;
  seo?: SeoConfig;
  fallbackDescription?: string | null;
  site?: URL;
  currentUrl: URL;
  siteName?: string;
}

export interface ResolvedSeoMetadata {
  pageTitle: string;
  displayTitle: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  imageUrl?: string;
  robots: string;
  ogType: 'website' | 'article';
  siteName: string;
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) return normalized;
  }

  return undefined;
}

function resolveCanonicalUrl(
  canonical: string | undefined,
  currentUrl: URL,
  site?: URL,
) {
  const baseUrl = site ?? currentUrl;

  if (canonical) {
    return new URL(canonical, baseUrl).toString();
  }

  return new URL(currentUrl.pathname, baseUrl).toString();
}

function resolveImageUrl(image: SeoImage | null | undefined, site?: URL) {
  const src = typeof image === 'string' ? image : image?.src;

  if (!src) return undefined;
  if (!site) return src;

  return new URL(src, site).toString();
}

export function resolveSeoMetadata({
  title,
  seo,
  fallbackDescription,
  site,
  currentUrl,
  siteName = DEFAULT_SITE_NAME,
}: ResolveSeoInput): ResolvedSeoMetadata {
  const pageTitle = firstNonEmpty(seo?.title, title) ?? title;
  const description =
    firstNonEmpty(seo?.description, fallbackDescription) ?? DEFAULT_DESCRIPTION;
  const keywords = (seo?.keywords ?? [])
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    pageTitle,
    displayTitle: pageTitle.includes(siteName)
      ? pageTitle
      : `${pageTitle} | ${siteName}`,
    description,
    keywords,
    canonicalUrl: resolveCanonicalUrl(seo?.canonical, currentUrl, site),
    imageUrl: resolveImageUrl(seo?.image, site),
    robots: firstNonEmpty(seo?.robots) ?? 'index,follow',
    ogType: seo?.type === 'article' ? 'article' : 'website',
    siteName,
  };
}
