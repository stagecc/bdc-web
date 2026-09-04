export interface DugConcept {
  id: string;
  name: string;
  description: string;
  type: string;
  identifiers: Array<{ label?: string }>;
  explanation?: unknown;
}

export interface DugConceptSearchResponse {
  hits: DugConcept[];
  totalItems: number;
  conceptTypes: string[];
}

export interface DugVariable {
  id: string;
  name: string;
  description: string;
  e_link?: string;
}

export interface DugStudy {
  c_id: string;
  c_name: string;
  c_link: string;
  source: string;
  elements: DugVariable[];
}

const SEARCH_BASE_URL = 'https://search.biodatacatalyst.renci.org/search-api';

interface DugConceptHit {
  _source?: Omit<DugConcept, 'explanation'>;
  _explanation?: unknown;
}

interface DugSearchApiResult {
  hits?: {
    hits?: DugConceptHit[];
  };
  total_items?: number;
  concept_types?: Record<string, number>;
}

interface DugSearchApiResponse {
  status?: string;
  result?: DugSearchApiResult;
}

interface DugSearchVarApiResponse {
  result?: Record<string, Omit<DugStudy, 'source'>[]>;
}

export async function fetchConcepts(
  query: string,
  page: number,
  perPage: number,
  signal?: AbortSignal,
): Promise<DugConceptSearchResponse> {
  const response = await fetch(`${SEARCH_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      index: 'concepts_index',
      query,
      offset: (page - 1) * perPage,
      size: perPage,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Unable to load search results right now.');
  }

  const json = (await response.json()) as DugSearchApiResponse;
  if (json.status !== 'success' || !json.result) {
    return { hits: [], totalItems: 0, conceptTypes: [] };
  }

  const hits = (json.result.hits?.hits ?? []).map((hit) => ({
    id: hit._source?.id ?? '',
    name: hit._source?.name ?? '',
    description: hit._source?.description ?? '',
    type: hit._source?.type ?? 'UNKNOWN',
    identifiers: hit._source?.identifiers ?? [],
    explanation: hit._explanation,
  }));

  return {
    hits,
    totalItems: json.result.total_items ?? 0,
    conceptTypes: Object.keys(json.result.concept_types ?? {}),
  };
}

export async function fetchStudies(
  conceptId: string,
  query: string,
  signal?: AbortSignal,
): Promise<DugStudy[]> {
  const response = await fetch(`${SEARCH_BASE_URL}/search_var`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      concept: conceptId,
      index: 'variables_index',
      query,
      size: 1000,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Unable to load related studies right now.');
  }

  const json = (await response.json()) as DugSearchVarApiResponse;
  const result = json.result ?? {};

  const studies = Object.keys(result).flatMap((source) =>
    (result[source] ?? []).map((study) => ({ ...study, source })),
  );

  return studies.sort((a, b) => a.c_name.localeCompare(b.c_name));
}
