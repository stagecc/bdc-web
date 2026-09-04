import { afterEach, describe, expect, it } from 'vitest';
import { getInteractiveElement } from '../shared';

function requireElement(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Expected element #${id} to exist`);
  }

  return element;
}

describe('getInteractiveElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the nearest anchor for delegated link clicks', () => {
    document.body.innerHTML = `
      <a href="/about" id="link"><span id="target">About</span></a>
    `;
    const target = requireElement('target');

    expect(getInteractiveElement(target)).toBe(requireElement('link'));
  });

  it('returns the nearest button for delegated button clicks', () => {
    document.body.innerHTML = `
      <button type="button" id="button"><span id="target">Menu</span></button>
    `;
    const target = requireElement('target');

    expect(getInteractiveElement(target)).toBe(requireElement('button'));
  });

  it('returns null for non-interactive wrappers', () => {
    document.body.innerHTML = `<div id="target">Not interactive</div>`;
    const target = requireElement('target');

    expect(getInteractiveElement(target)).toBeNull();
  });
});
