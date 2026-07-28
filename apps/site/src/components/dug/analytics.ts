type AnalyticsParams = Record<string, string | number | boolean | Array<string> | null | undefined>;

type DataLayerEvent = AnalyticsParams & { event: string };

type DugCollectionLike = {
  concepts: Array<{ id: string; name: string }>;
  studies: Array<{ id: string; name: string }>;
  variables: Array<{ id: string; name: string }>;
};

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (command: 'event', eventName: string, params?: AnalyticsParams) => void;
};

function pushAnalyticsEvent(event: DataLayerEvent) {
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

export function trackDugSearch(term: string, location: string) {
  pushAnalyticsEvent({
    event: 'dug-search-items',
    dugSearchTerm: term,
    dugSearchLocation: location,
  });
}

export function trackDugDownloadCollection(collection: DugCollectionLike) {
  pushAnalyticsEvent({
    event: 'dug-download-collection',
    dugConceptIds: collection.concepts.map((item) => item.id),
    dugStudyIds: collection.studies.map((item) => item.id),
    dugVariableIds: collection.variables.map((item) => item.id),
  });
}

export function trackDugCheckoutCollection(collection: DugCollectionLike) {
  pushAnalyticsEvent({
    event: 'dug-checkout-collection',
    dugCheckoutConceptIds: collection.concepts.map((item) => item.id),
    dugCheckoutConceptNames: collection.concepts.map((item) => item.name),
    dugCheckoutStudyIds: collection.studies.map((item) => item.id),
    dugCheckoutStudyNames: collection.studies.map((item) => item.name),
    dugCheckoutVariableIds: collection.variables.map((item) => item.id),
    dugCheckoutVariableNames: collection.variables.map((item) => item.name),
    dugConceptIds: collection.concepts.map((item) => item.id),
    dugStudyIds: collection.studies.map((item) => item.id),
    dugVariableIds: collection.variables.map((item) => item.id),
  });
}
