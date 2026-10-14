import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pushAnalyticsEvent } from '../../util/google-analytics/pushAnalyticsEvent';
import { trackCheckMyAccessCsvExport } from './analytics';

vi.mock('../../util/google-analytics/pushAnalyticsEvent', () => ({
  pushAnalyticsEvent: vi.fn(),
}));

const pushAnalyticsEventMock = vi.mocked(pushAnalyticsEvent);

describe('check my access analytics helpers', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    pushAnalyticsEventMock.mockReset();
  });

  it('tracks CSV exports with project count and page path', () => {
    window.history.replaceState({}, '', '/data/explore/');

    trackCheckMyAccessCsvExport(2);

    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'check_my_access_csv_export',
      site_section: 'check_my_access',
      export_format: 'csv',
      project_count: 2,
      page_path: '/data/explore/',
    });
  });
});
