import { createHash, randomBytes } from 'node:crypto';
import type { AstroCookies } from 'astro';
import {
  createRemoteJWKSet,
  EncryptJWT,
  type JWTPayload,
  jwtDecrypt,
  jwtVerify,
} from 'jose';

const issuer =
  'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_hdBiEx6vB';
const domain = 'https://us-east-1hdbiex6vb.auth.us-east-1.amazoncognito.com';
const clientId = 'gf6fmaqtmunhit58cimq6e18c';
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
export const names = {
  access: 'bdc_access',
  refresh: 'bdc_refresh',
  transaction: 'bdc_login',
};

export class AuthConfigurationError extends Error {}

export function origin(url: URL) {
  if (import.meta.env.DEV && ['localhost', '127.0.0.1'].includes(url.hostname))
    return url.origin;
  const configured = process.env.AUTH_ORIGIN;
  if (configured) {
    const parsed = new URL(configured);
    if (
      parsed.protocol !== 'https:' ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) {
      throw new AuthConfigurationError('AUTH_ORIGIN must be an HTTPS origin');
    }
    return parsed.origin;
  }
  throw new AuthConfigurationError('AUTH_ORIGIN is required');
}

function key() {
  if (import.meta.env.DEV && !process.env.AUTH_SESSION_SECRET) {
    process.env.AUTH_SESSION_SECRET = randomBytes(32).toString('hex');
    console.info('[auth] Using a temporary development session key.');
  }
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret))
    throw new AuthConfigurationError(
      'AUTH_SESSION_SECRET must be 32 random bytes encoded as hex',
    );
  return Buffer.from(secret, 'hex');
}

export const random = () => randomBytes(32).toString('base64url');
export const challenge = (verifier: string) =>
  createHash('sha256').update(verifier).digest('base64url');
export function returnPath(value: string | null) {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\r\n]/.test(value)
  )
    return '/';
  const parsed = new URL(value, 'https://local.invalid');
  if (
    parsed.origin !== 'https://local.invalid' ||
    parsed.pathname.startsWith('/auth/')
  )
    return '/';
  return parsed.pathname + parsed.search;
}

export async function seal(payload: JWTPayload, seconds: number) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .encrypt(key());
}
export async function unseal(value: string) {
  return (
    await jwtDecrypt(value, key(), {
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256GCM'],
    })
  ).payload;
}
export function setCookie(
  cookies: AstroCookies,
  name: string,
  value: string,
  seconds: number,
  url: URL,
) {
  if (Buffer.byteLength(value) > 3800)
    throw new Error('Authentication cookie exceeds size limit');
  cookies.set(name, value, {
    httpOnly: true,
    secure: origin(url).startsWith('https:'),
    sameSite: 'lax',
    path: '/',
    maxAge: seconds,
  });
}
export function clearSession(cookies: AstroCookies) {
  cookies.delete(names.access, { path: '/' });
  cookies.delete(names.refresh, { path: '/' });
}
export async function verifyAccess(token: string) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    algorithms: ['RS256'],
    requiredClaims: ['exp', 'sub'],
  });
  if (payload.token_use !== 'access' || payload.client_id !== clientId)
    throw new Error('Invalid access token');
  return payload;
}
export async function session(cookies: AstroCookies) {
  const token = cookies.get(names.access)?.value;
  if (!token) return null;
  try {
    return await verifyAccess(token);
  } catch {
    return null;
  }
}
export function loginUrl(
  base: string,
  state: string,
  nonce: string,
  verifier: string,
) {
  const url = new URL('/oauth2/authorize', domain);
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid email',
    redirect_uri: `${base}/auth/callback`,
    state,
    nonce,
    code_challenge: challenge(verifier),
    code_challenge_method: 'S256',
  }).toString();
  return url.href;
}
export async function exchange(
  code: string,
  verifier: string,
  base: string,
  nonce: string,
) {
  const response = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      code_verifier: verifier,
      redirect_uri: `${base}/auth/callback`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Token exchange failed');
  const tokens = await response.json();
  const { payload: id } = await jwtVerify(tokens.id_token, jwks, {
    issuer,
    audience: clientId,
    algorithms: ['RS256'],
    requiredClaims: ['exp', 'sub'],
  });
  const access = await verifyAccess(tokens.access_token);
  if (
    id.token_use !== 'id' ||
    id.nonce !== nonce ||
    id.sub !== access.sub ||
    typeof tokens.refresh_token !== 'string'
  )
    throw new Error('Invalid login response');
  return {
    access: tokens.access_token as string,
    refresh: tokens.refresh_token as string,
    seconds: Math.max(
      0,
      Math.floor((access.exp as number) - Date.now() / 1000),
    ),
  };
}
export async function revoke(refresh: string) {
  const response = await fetch(`${domain}/oauth2/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: refresh, client_id: clientId }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Revocation failed');
}
export function logoutUrl(base: string) {
  const url = new URL('/logout', domain);
  url.search = new URLSearchParams({
    client_id: clientId,
    logout_uri: `${base}/`,
  }).toString();
  return url.href;
}
