import { pushAnalyticsEvent } from '../../util/google-analytics/pushAnalyticsEvent';

const getPagePath = () => {
  return typeof window === 'undefined' ? '' : window.location.pathname;
};

export function trackCheckMyAccessCsvExport(projectCount: number) {
  pushAnalyticsEvent({
    event: 'check_my_access_csv_export',
    site_section: 'check_my_access',
    export_format: 'csv',
    project_count: projectCount,
    page_path: getPagePath(),
  });
}
