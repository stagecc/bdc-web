export const COLLECTION_KEY = 'dug-collection';

export type DugCollectionConcept = {
  id: string;
  name: string;
  description: string;
  type: string;
};

export type DugCollectionStudy = {
  id: string;
  name: string;
  url: string;
  source: string;
};

export type DugCollectionVariable = {
  id: string;
  name: string;
  description: string;
  url: string;
};

export type DugCollection = {
  concepts: DugCollectionConcept[];
  studies: DugCollectionStudy[];
  variables: DugCollectionVariable[];
};

export const EMPTY_COLLECTION: DugCollection = {
  concepts: [],
  studies: [],
  variables: [],
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeCollection(parsed: Partial<DugCollection>): DugCollection {
  return {
    concepts: Array.isArray(parsed.concepts)
      ? parsed.concepts.map((item) => ({
          id: asString(item?.id),
          name: asString(item?.name),
          description: asString(item?.description),
          type: asString(item?.type),
        }))
      : [],
    studies: Array.isArray(parsed.studies)
      ? parsed.studies.map((item) => ({
          id: asString(item?.id),
          name: asString(item?.name),
          url: asString(item?.url),
          source: asString(item?.source),
        }))
      : [],
    variables: Array.isArray(parsed.variables)
      ? parsed.variables.map((item) => ({
          id: asString(item?.id),
          name: asString(item?.name),
          description: asString(item?.description),
          url: asString(item?.url),
        }))
      : [],
  };
}

export function loadCollection(): DugCollection {
  if (typeof window === 'undefined') {
    return EMPTY_COLLECTION;
  }

  try {
    const item = window.localStorage.getItem(COLLECTION_KEY);
    if (!item) {
      return EMPTY_COLLECTION;
    }

    const parsed = JSON.parse(item) as Partial<DugCollection>;
    return normalizeCollection(parsed);
  } catch {
    return EMPTY_COLLECTION;
  }
}

export function saveCollection(collection: DugCollection): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
}
