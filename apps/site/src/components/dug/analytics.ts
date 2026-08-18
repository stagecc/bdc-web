import { pushAnalyticsEvent } from '../../util/google-analytics/pushAnalyticsEvent';

type DugCollectionLike = {
  concepts: Array<{ id: string; name: string }>;
  studies: Array<{ id: string; name: string }>;
  variables: Array<{ id: string; name: string }>;
};

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
