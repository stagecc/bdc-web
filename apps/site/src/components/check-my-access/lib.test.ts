import {
  buildCheckMyAccessUrl,
  decodeJwtPayload,
  doesNonceMatch,
  extractProjects,
  getCheckMyAccessConfig,
  getCurrentRedirectUri,
  getPreviewData,
  isIdTokenExpired,
  parseHashTokens,
} from './lib';

const createJwt = (payload: Record<string, unknown>) => {
  const encode = (value: Record<string, unknown>) => {
    return btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  };

  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
};

describe('check my access helpers', () => {
  it('parses returned tokens from the hash fragment', () => {
    expect(
      parseHashTokens('#access_token=access&id_token=id&token_type=bearer'),
    ).toEqual({
      accessToken: 'access',
      idToken: 'id',
    });
  });

  it('returns null when required hash tokens are missing', () => {
    expect(parseHashTokens('#access_token=access')).toBeNull();
    expect(parseHashTokens('')).toBeNull();
  });

  it('builds the current page redirect uri without query or hash', () => {
    const url = new URL(
      'https://biodatacatalyst.nhlbi.nih.gov/data/explore/?check-my-access-preview=projects#foo',
    );

    expect(getCurrentRedirectUri(url)).toBe(
      'https://biodatacatalyst.nhlbi.nih.gov/data/explore/',
    );
  });

  it('builds the Fence authorization url for the current page', () => {
    const url = new URL(
      'https://preview.biodatacatalyst.nhlbi.nih.gov/data/explore/',
    );
    const authUrl = new URL(
      buildCheckMyAccessUrl(url, 'nonce-123', {
        authRoot: 'https://gen3.biodatacatalyst.nhlbi.nih.gov',
        clientId: 'client-123',
      }),
    );

    expect(authUrl.origin).toBe('https://gen3.biodatacatalyst.nhlbi.nih.gov');
    expect(authUrl.pathname).toBe('/user/oauth2/authorize');
    expect(authUrl.searchParams.get('idp')).toBe('ras');
    expect(authUrl.searchParams.get('client_id')).toBe('client-123');
    expect(authUrl.searchParams.get('redirect_uri')).toBe(
      'https://preview.biodatacatalyst.nhlbi.nih.gov/data/explore/',
    );
    expect(authUrl.searchParams.get('nonce')).toBe('nonce-123');
  });

  it('decodes JWT payloads and checks expiration', () => {
    const futureToken = createJwt({ exp: Math.floor(Date.now() / 1000) + 60 });
    const expiredToken = createJwt({ exp: Math.floor(Date.now() / 1000) - 60 });

    expect(decodeJwtPayload<{ exp: number }>(futureToken).exp).toBeGreaterThan(
      Math.floor(Date.now() / 1000),
    );
    expect(isIdTokenExpired(futureToken)).toBe(false);
    expect(isIdTokenExpired(expiredToken)).toBe(true);
  });

  it('returns false when the expected nonce is missing', () => {
    const token = createJwt({
      exp: Math.floor(Date.now() / 1000) + 60,
      nonce: 'abc',
    });

    expect(doesNonceMatch(token, null)).toBe(false);
    expect(doesNonceMatch(token, undefined)).toBe(false);
  });

  it('returns false when the token nonce is missing or mismatched', () => {
    const missingNonceToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const mismatchedNonceToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 60,
      nonce: 'abc',
    });

    expect(doesNonceMatch(missingNonceToken, 'abc')).toBe(false);
    expect(doesNonceMatch(mismatchedNonceToken, 'xyz')).toBe(false);
  });

  it('returns true when the token nonce matches the expected nonce', () => {
    const token = createJwt({
      exp: Math.floor(Date.now() / 1000) + 60,
      nonce: 'abc',
    });

    expect(doesNonceMatch(token, 'abc')).toBe(true);
  });

  it('reads the Check My Access auth config from public env vars', () => {
    expect(
      getCheckMyAccessConfig({
        PUBLIC_CHECK_MY_ACCESS_AUTH_ROOT: 'https://gen3.example.org',
        PUBLIC_CHECK_MY_ACCESS_CLIENT_ID: 'client-123',
      }),
    ).toEqual({
      authRoot: 'https://gen3.example.org',
      clientId: 'client-123',
    });
  });

  it('returns null when the Check My Access auth config is incomplete', () => {
    expect(
      getCheckMyAccessConfig({
        PUBLIC_CHECK_MY_ACCESS_AUTH_ROOT: 'https://gen3.example.org',
      }),
    ).toBeNull();
  });

  it('extracts and sorts approved project names', () => {
    expect(
      extractProjects({
        authz: {
          '/programs/foo/projects/ZETA': ['read'],
          '/programs/foo/projects/ALPHA': ['read'],
          '/programs/foo/users/test': ['read'],
        },
      }),
    ).toEqual(['ALPHA', 'ZETA']);
  });

  it('reads preview mode values from the url', () => {
    const url = new URL(
      'https://example.com/data/explore/?check-my-access-preview=projects&check-my-access-preview-name=Taylor%20Lee&check-my-access-preview-projects=TOPMed,HeartShare',
    );

    expect(getPreviewData(url)).toEqual({
      state: 'projects',
      userName: 'Taylor Lee',
      projects: ['TOPMed', 'HeartShare'],
    });
  });

  it('ignores unsupported preview states', () => {
    const url = new URL(
      'https://example.com/data/explore/?check-my-access-preview=unknown',
    );

    expect(getPreviewData(url)).toBeNull();
  });
});
