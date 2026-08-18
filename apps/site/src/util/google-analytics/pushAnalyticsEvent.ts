export type AnalyticsParams = Record<
  string,
  string | number | boolean | Array<string> | null | undefined
>;

export type DataLayerEvent = AnalyticsParams & { event: string };

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (
    command: 'event',
    eventName: string,
    params?: AnalyticsParams,
  ) => void;
};

export function pushAnalyticsEvent(event: DataLayerEvent) {
  const analyticsWindow = window as AnalyticsWindow;
  if (Array.isArray(analyticsWindow.dataLayer)) {
    analyticsWindow.dataLayer.push(event);
    return;
  }

  if (typeof analyticsWindow.gtag === 'function') {
    const { event: eventName, ...params } = event;
    analyticsWindow.gtag('event', eventName, params);
  }
}
