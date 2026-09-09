import { afterEach, describe, expect, it } from 'vitest';
import { getAnalyticsEvent } from '../shared';

function requireElement(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Expected element #${id} to exist`);
  }

  return element;
}

describe('getAnalyticsEvent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves the custom event from a direct ancestor', () => {
    document.body.innerHTML = `
      <div data-analytics-custom-event="hero_cta_click">
        <button type="button" id="button">Get Started</button>
      </div>
    `;
    const button = requireElement('button');

    expect(getAnalyticsEvent(button)).toBe('hero_cta_click');
  });

  it('returns null when no ancestor has data-analytics-custom-event', () => {
    document.body.innerHTML = `<button type="button" id="button">Click</button>`;
    const button = requireElement('button');

    expect(getAnalyticsEvent(button)).toBeNull();
  });

  it('resolves the nearest custom event when nested values are present', () => {
    document.body.innerHTML = `
      <div data-analytics-custom-event="outer_event">
        <div data-analytics-custom-event="inner_event">
          <button type="button" id="button">Click</button>
        </div>
      </div>
    `;
    const button = requireElement('button');

    expect(getAnalyticsEvent(button)).toBe('inner_event');
  });
});
