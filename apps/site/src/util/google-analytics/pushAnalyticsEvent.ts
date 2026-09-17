export type AnalyticsParams = Record<
  string,
  string | number | boolean | Array<string> | null | undefined
>;

export type DataLayerEvent = AnalyticsParams & { event: string };

type AnalyticsWindow = Window & {
  gtag?: (
    command: 'event',
    eventName: string,
    params?: AnalyticsParams,
  ) => void;
};

export function pushAnalyticsEvent(event: DataLayerEvent) {
  const { event: eventName, ...params } = event;

  if (import.meta.env.DEV) {
    console.log('Console logging analytics event:', eventName, params);
    return;
  }

  const analyticsWindow = window as AnalyticsWindow;

  if (typeof analyticsWindow.gtag === 'function') {
    analyticsWindow.gtag('event', eventName, params);
  }
}
