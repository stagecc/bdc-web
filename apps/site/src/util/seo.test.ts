import { describe, expect, it } from 'vitest';
import { resolveSeoMetadata } from './seo';

describe('resolveSeoMetadata', () => {
  const site = new URL('https://biodatacatalyst.nhlbi.nih.gov');

  it('builds canonical metadata from the configured site and current path', () => {
    const metadata = resolveSeoMetadata({
      title: 'Events',
      currentUrl: new URL('http://localhost:4321/news/events/?page=2'),
      site,
    });

    expect(metadata.displayTitle).toBe('Events | BioData Catalyst');
    expect(metadata.canonicalUrl).toBe(
      'https://biodatacatalyst.nhlbi.nih.gov/news/events/',
    );
    expect(metadata.robots).toBe('index,follow');
    expect(metadata.ogType).toBe('website');
  });

  it('prefers explicit seo values and trims empty content', () => {
    const metadata = resolveSeoMetadata({
      title: 'Fallback Title',
      fallbackDescription: 'Fallback description',
      currentUrl: new URL('http://localhost:4321/news/latest-updates/post/'),
      site,
      seo: {
        title: 'Custom Title',
        description: '  Custom description.  ',
        keywords: [' heart ', '', 'sleep '],
        canonical: '/custom-canonical/',
        robots: 'noindex,follow',
        type: 'article',
      },
    });

    expect(metadata.pageTitle).toBe('Custom Title');
    expect(metadata.description).toBe('Custom description.');
    expect(metadata.keywords).toEqual(['heart', 'sleep']);
    expect(metadata.canonicalUrl).toBe(
      'https://biodatacatalyst.nhlbi.nih.gov/custom-canonical/',
    );
    expect(metadata.robots).toBe('noindex,follow');
    expect(metadata.ogType).toBe('article');
  });

  it('falls back to page excerpt and a default site description', () => {
    const withExcerpt = resolveSeoMetadata({
      title: 'Study Page',
      fallbackDescription: 'Program summary',
      currentUrl: new URL('http://localhost:4321/about/studies/example/'),
      site,
      seo: {
        description: '   ',
      },
    });

    const withoutExcerpt = resolveSeoMetadata({
      title: 'Plain Page',
      currentUrl: new URL('http://localhost:4321/help/faqs/'),
      site,
    });

    expect(withExcerpt.description).toBe('Program summary');
    expect(withoutExcerpt.description).toBe(
      'NHLBI BioData Catalyst is a cloud-based ecosystem that helps researchers find, access, share, store, and analyze biomedical data in secure workspaces.',
    );
  });

  it('resolves social images to absolute urls', () => {
    const metadata = resolveSeoMetadata({
      title: 'News',
      currentUrl: new URL('http://localhost:4321/news/latest-updates/story/'),
      site,
      seo: {
        image: { src: '/_astro/story-card.abc123.webp' },
      },
    });

    expect(metadata.imageUrl).toBe(
      'https://biodatacatalyst.nhlbi.nih.gov/_astro/story-card.abc123.webp',
    );
  });
});
