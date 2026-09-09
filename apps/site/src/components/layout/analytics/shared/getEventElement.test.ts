import { afterEach, describe, expect, it } from 'vitest';
import { getEventElement } from '../shared';

function requireElement(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Expected element #${id} to exist`);
  }

  return element;
}

describe('getEventElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the element directly when the target is an element', () => {
    document.body.innerHTML = `<button type="button" id="target">Menu</button>`;
    const target = requireElement('target');

    expect(getEventElement(target)).toBe(target);
  });

  it('returns the parent element when the target is a text node', () => {
    document.body.innerHTML = `<button type="button" id="target">Menu</button>`;
    const target = requireElement('target');
    const textNode = target.firstChild;

    expect(getEventElement(textNode)).toBe(target);
  });

  it('returns null for unsupported targets', () => {
    expect(getEventElement(null)).toBeNull();
    expect(getEventElement(window)).toBeNull();
  });
});
