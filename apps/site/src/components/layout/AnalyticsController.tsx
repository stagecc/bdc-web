import { useEffect } from 'react';

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  __bdcGtmInitialized?: boolean;
  __bdcLastTrackedPath?: string;
};

function initGtm(gtmId: string) {
  const analyticsWindow = window as AnalyticsWindow;

  if (analyticsWindow.__bdcGtmInitialized) return;

  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  analyticsWindow.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
  });

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[data-gtm-id="${gtmId}"]`,
  );

  if (!existingScript) {
    const firstScript = document.getElementsByTagName('script')[0];
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    script.dataset.gtmId = gtmId;
    firstScript?.parentNode?.insertBefore(script, firstScript);
  }

  analyticsWindow.__bdcGtmInitialized = true;
}

function trackPageView() {
  const analyticsWindow = window as AnalyticsWindow;
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (analyticsWindow.__bdcLastTrackedPath === path) return;

  analyticsWindow.__bdcLastTrackedPath = path;
  analyticsWindow.dataLayer?.push({
    event: 'page_view',
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_search: window.location.search,
  });
}

interface Props {
  gtmId: string;
}

export function AnalyticsController({ gtmId }: Props) {
  useEffect(() => {
    if (!gtmId) return;

    initGtm(gtmId);
    trackPageView();

    const handleNavigation = () => {
      trackPageView();
    };

    document.addEventListener('astro:after-swap', handleNavigation);

    return () => {
      document.removeEventListener('astro:after-swap', handleNavigation);
    };
  }, [gtmId]);

  return null;
}
