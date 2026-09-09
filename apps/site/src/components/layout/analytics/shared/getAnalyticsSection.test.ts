import { afterEach, describe, expect, it } from 'vitest';
import { getAnalyticsSection } from '../shared';

function requireElement(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Expected element #${id} to exist`);
  }

  return element;
}

describe('getAnalyticsSection', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves the section from a direct data-analytics-section ancestor', () => {
    document.body.innerHTML = `
      <div data-analytics-section="header">
        <a href="/about" id="link">About</a>
      </div>
    `;
    const link = requireElement('link');

    expect(getAnalyticsSection(link)).toBe('header');
  });

  it('resolves the section when nested multiple levels deep', () => {
    document.body.innerHTML = `
      <footer data-analytics-section="footer">
        <div class="column">
          <ul>
            <li><a href="/data" id="link">Data</a></li>
          </ul>
        </div>
      </footer>
    `;
    const link = requireElement('link');

    expect(getAnalyticsSection(link)).toBe('footer');
  });

  it('returns null when no ancestor has data-analytics-section', () => {
    document.body.innerHTML = `<a href="/about" id="link">About</a>`;
    const link = requireElement('link');

    expect(getAnalyticsSection(link)).toBeNull();
  });

  it('returns null when data-analytics-section is present but empty', () => {
    document.body.innerHTML = `
      <div data-analytics-section="">
        <a href="/about" id="link">About</a>
      </div>
    `;
    const link = requireElement('link');

    expect(getAnalyticsSection(link)).toBeNull();
  });

  it('resolves the nearest section when nested inside multiple tracked sections', () => {
    document.body.innerHTML = `
      <div data-analytics-section="outer">
        <div data-analytics-section="inner">
          <a href="/about" id="link">About</a>
        </div>
      </div>
    `;
    const link = requireElement('link');

    expect(getAnalyticsSection(link)).toBe('inner');
  });
});
