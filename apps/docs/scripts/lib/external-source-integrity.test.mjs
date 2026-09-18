import { describe, expect, it } from 'vitest';
import { assertOverviewHeadingPreserved } from './external-source-integrity.mjs';

describe('assertOverviewHeadingPreserved', () => {
  it('does not throw when source has no Overview heading', () => {
    expect(() =>
      assertOverviewHeadingPreserved(
        '<h2>Procedure</h2>',
        '<h2>Procedure</h2>',
        'readme-sevenbridges:/docs/example',
      ),
    ).not.toThrow();
  });

  it('does not throw when Overview heading is preserved', () => {
    expect(() =>
      assertOverviewHeadingPreserved(
        '<h2 id="overview">Overview</h2><p>Body</p>',
        '---\ntitle: "Example"\n---\n\n## Overview\n\nBody',
        'readme-sevenbridges:/docs/example',
      ),
    ).not.toThrow();
  });

  it('throws when Overview heading is dropped', () => {
    expect(() =>
      assertOverviewHeadingPreserved(
        '<h2 id="overview">Overview</h2><p>Body</p>',
        '---\ntitle: "Example"\n---\n\n<p>Body</p>',
        'readme-sevenbridges:/docs/example',
      ),
    ).toThrow(/Overview heading was present in source but missing in output/);
  });

  it('does not require non-exact Overview headings', () => {
    expect(() =>
      assertOverviewHeadingPreserved(
        '<h2>Terra Billing Structure Overview</h2><p>Body</p>',
        '---\ntitle: "Example"\n---\n\nBody',
        'zendesk-terra:/hc/en-us/articles/123',
      ),
    ).not.toThrow();
  });
});
