export const CHECK_MY_ACCESS_AUTH_ROOT =
  'https://gen3.biodatacatalyst.nhlbi.nih.gov';
export const CHECK_MY_ACCESS_CLIENT_ID =
  'xMhuXjGdk9zpzdJjufEinh3nKzOUKOTFZcwzU5xT';
export const CHECK_MY_ACCESS_IDP = 'ras';
export const CHECK_MY_ACCESS_STORAGE_KEY = 'bdc-check-my-access-auth';
export const CHECK_MY_ACCESS_NONCE_STORAGE_KEY = 'bdc-check-my-access-nonce';
export const CHECK_MY_ACCESS_PREVIEW_PARAM = 'check-my-access-preview';
export const CHECK_MY_ACCESS_PREVIEW_NAME_PARAM =
  'check-my-access-preview-name';
export const CHECK_MY_ACCESS_PREVIEW_PROJECTS_PARAM =
  'check-my-access-preview-projects';

export type CheckMyAccessPreviewState =
  | 'logged-out'
  | 'processing'
  | 'projects'
  | 'empty'
  | 'session-error'
  | 'lookup-error';

export interface CheckMyAccessTokens {
  accessToken: string;
  idToken: string;
}

export interface CheckMyAccessStoredAuth extends CheckMyAccessTokens {
  nonce?: string;
}

export interface CheckMyAccessUser {
  name?: string;
  authz?: Record<string, unknown>;
}

export interface CheckMyAccessPreviewData {
  state: CheckMyAccessPreviewState;
  userName: string;
  projects: string[];
}

const PREVIEW_STATES = new Set<CheckMyAccessPreviewState>([
  'logged-out',
  'processing',
  'projects',
  'empty',
  'session-error',
  'lookup-error',
]);

const DEFAULT_PREVIEW_USER = 'Alex Researcher';
const DEFAULT_PREVIEW_PROJECTS = [
  'TOPMed_COPDGene',
  'TransOmics',
  'SCD_Cohorts',
];

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded =
    padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
  return atob(padded);
};

export const getCurrentRedirectUri = (url: URL) => {
  return new URL(url.pathname, url.origin).toString();
};

export const createNonce = () => {
  const values = new Uint8Array(16);
  crypto.getRandomValues(values);
  return Array.from(values, (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');
};

export const buildCheckMyAccessUrl = (url: URL, nonce: string) => {
  const authUrl = new URL('/user/oauth2/authorize', CHECK_MY_ACCESS_AUTH_ROOT);
  authUrl.searchParams.set('idp', CHECK_MY_ACCESS_IDP);
  authUrl.searchParams.set('client_id', CHECK_MY_ACCESS_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'id_token token');
  authUrl.searchParams.set('scope', 'openid user');
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('redirect_uri', getCurrentRedirectUri(url));
  return authUrl.toString();
};

export const parseHashTokens = (hash: string): CheckMyAccessTokens | null => {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!fragment) {
    return null;
  }

  const params = new URLSearchParams(fragment);
  const accessToken = params.get('access_token');
  const idToken = params.get('id_token');

  if (!accessToken || !idToken) {
    return null;
  }

  return {
    accessToken,
    idToken,
  };
};

export const decodeJwtPayload = <T>(token: string): T => {
  const segments = token.split('.');
  if (segments.length < 2) {
    throw new Error('Invalid JWT');
  }

  return JSON.parse(decodeBase64Url(segments[1])) as T;
};

export const isIdTokenExpired = (
  idToken: string,
  nowSeconds = Date.now() / 1000,
) => {
  const payload = decodeJwtPayload<{ exp?: number }>(idToken);
  return typeof payload.exp !== 'number' || payload.exp <= nowSeconds;
};

export const doesNonceMatch = (
  idToken: string,
  expectedNonce?: string | null,
) => {
  if (!expectedNonce) {
    return true;
  }

  const payload = decodeJwtPayload<{ nonce?: string }>(idToken);
  return payload.nonce === expectedNonce;
};

export const extractProjects = (user: CheckMyAccessUser) => {
  return Object.keys(user.authz ?? {})
    .filter((key) => key.includes('/projects/'))
    .map((key) => key.slice(key.lastIndexOf('/') + 1))
    .sort((left, right) => left.localeCompare(right));
};

export const getPreviewData = (url: URL): CheckMyAccessPreviewData | null => {
  const preview = url.searchParams.get(CHECK_MY_ACCESS_PREVIEW_PARAM);
  if (!preview || !PREVIEW_STATES.has(preview as CheckMyAccessPreviewState)) {
    return null;
  }

  const projectsValue = url.searchParams.get(
    CHECK_MY_ACCESS_PREVIEW_PROJECTS_PARAM,
  );
  const projects =
    projectsValue
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  return {
    state: preview as CheckMyAccessPreviewState,
    userName:
      url.searchParams.get(CHECK_MY_ACCESS_PREVIEW_NAME_PARAM) ||
      DEFAULT_PREVIEW_USER,
    projects: projects.length > 0 ? projects : DEFAULT_PREVIEW_PROJECTS,
  };
};

export const downloadProjectsCsv = (userName: string, projects: string[]) => {
  const csv = ['Project', ...projects].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${userName}-projects.csv`;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
};
