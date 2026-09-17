import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import { getAnalyticsSection } from './shared';

export function getTrackedForm(target: Element) {
  const form = target.closest('form[data-analytics-form]');

  return form instanceof HTMLFormElement ? form : null;
}

export function getAnalyticsFormName(target: Element) {
  const formName = getTrackedForm(target)?.dataset.analyticsForm;

  return typeof formName === 'string' && formName.length > 0 ? formName : null;
}

export function trackFormSubmitAttempt(form: HTMLFormElement) {
  const formName = getAnalyticsFormName(form);
  if (!formName) return;

  pushAnalyticsEvent({
    event: 'form_submit_attempt',
    form_name: formName,
    site_section: getAnalyticsSection(form) ?? undefined,
    page_path: window.location.pathname,
  });
}

export function trackFormStart(form: HTMLFormElement) {
  const formName = getAnalyticsFormName(form);
  if (!formName) return;

  pushAnalyticsEvent({
    event: 'form_start',
    form_name: formName,
    site_section: getAnalyticsSection(form) ?? undefined,
    page_path: window.location.pathname,
  });
}

export function trackFormSubmitSuccess(formName: string) {
  pushAnalyticsEvent({
    event: 'form_submit_success',
    form_name: formName,
    page_path: window.location.pathname,
  });
}
