import { afterEach, describe, expect, it } from 'vitest';
import { getElementText } from '../shared';

function requireElement(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Expected element #${id} to exist`);
  }

  return element;
}

describe('getElementText', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('prefers aria-label over visible text', () => {
    document.body.innerHTML = `
      <button type="button" id="target" aria-label="Open navigation">Menu</button>
    `;
    const target = requireElement('target');

    expect(getElementText(target)).toBe('Open navigation');
  });

  it('falls back to image alt text when needed', () => {
    document.body.innerHTML = `
      <a href="/" id="target"><img src="/logo.svg" alt="BioData Catalyst home" /></a>
    `;
    const target = requireElement('target');

    expect(getElementText(target)).toBe('BioData Catalyst home');
  });

  it('falls back to normalized text content', () => {
    document.body.innerHTML = `
      <a href="/about" id="target">
        About
        BioData   Catalyst
      </a>
    `;
    const target = requireElement('target');

    expect(getElementText(target)).toBe('About BioData Catalyst');
  });

  it('returns undefined when no label can be derived', () => {
    document.body.innerHTML = `<button type="button" id="target"></button>`;
    const target = requireElement('target');

    expect(getElementText(target)).toBeUndefined();
  });
});
