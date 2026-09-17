// apps/site/src/components/layout/analytics/forms.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest';
import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import {
  getAnalyticsFormName,
  getTrackedForm,
  trackFormStart,
  trackFormSubmitAttempt,
  trackFormSubmitSuccess,
} from './forms';

vi.mock('../../../util/google-analytics/pushAnalyticsEvent', () => ({
  pushAnalyticsEvent: vi.fn(),
}));

const pushAnalyticsEventMock = vi.mocked(pushAnalyticsEvent);

function requireElement<ElementType extends HTMLElement>(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Expected element #${id} to exist`);
  }

  return element as ElementType;
}

describe('form analytics helpers', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    pushAnalyticsEventMock.mockReset();
  });

  it('finds the nearest tracked form and form name', () => {
    document.body.innerHTML = `
      <form data-analytics-form="get_help" id="form">
        <div><input id="field" name="email" type="email" /></div>
      </form>
    `;

    const field = requireElement<HTMLInputElement>('field');

    expect(getTrackedForm(field)).toBe(requireElement<HTMLFormElement>('form'));
    expect(getAnalyticsFormName(field)).toBe('get_help');
  });

  it('tracks submit attempts for tracked forms', () => {
    document.body.innerHTML = `
      <section data-analytics-section="support">
        <form data-analytics-form="get_help" id="form">
          <input name="email" type="email" />
        </form>
      </section>
    `;

    trackFormSubmitAttempt(requireElement<HTMLFormElement>('form'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'form_submit_attempt',
      form_name: 'get_help',
      site_section: 'support',
      page_path: '/',
    });
  });

  it('tracks form starts for tracked forms', () => {
    document.body.innerHTML = `
      <section data-analytics-section="support">
        <form data-analytics-form="get_help" id="form">
          <input name="email" type="email" />
        </form>
      </section>
    `;

    trackFormStart(requireElement<HTMLFormElement>('form'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'form_start',
      form_name: 'get_help',
      site_section: 'support',
      page_path: '/',
    });
  });

  it('tracks successful submits by form name', () => {
    trackFormSubmitSuccess('get_help');

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'form_submit_success',
      form_name: 'get_help',
      page_path: '/',
    });
  });
});
