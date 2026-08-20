import { useEffect } from 'react';
import { pushAnalyticsEvent } from '../../util/google-analytics/pushAnalyticsEvent';

type AnalyticsWindow = Window & {
  __bdcLastTrackedPath?: string;
};

function trackPageView() {
  const analyticsWindow = window as AnalyticsWindow;
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (analyticsWindow.__bdcLastTrackedPath === path) return;

  analyticsWindow.__bdcLastTrackedPath = path;
  pushAnalyticsEvent({
    event: 'page_view',
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_search: window.location.search,
  });
}

export function AnalyticsController() {
  useEffect(() => {
    trackPageView();

    const handleNavigation = () => {
      trackPageView();
    };

    document.addEventListener('astro:after-swap', handleNavigation);

    return () => {
      document.removeEventListener('astro:after-swap', handleNavigation);
    };
  }, []);

  return null;
}
