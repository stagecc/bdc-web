import type { APIRoute } from 'astro';
import {
  AuthConfigurationError,
  clearSession,
  exchange,
  loginUrl,
  logoutUrl,
  names,
  origin,
  random,
  returnPath,
  revoke,
  seal,
  setCookie,
  unseal,
} from '../../lib/auth';

export const ALL: APIRoute = async ({
  request,
  url,
  params,
  cookies,
  redirect,
}) => {
  const action = params.action;
  if (action === 'error' && request.method === 'GET') {
    return new Response(
      '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Sign-in could not be completed</title><h1>Sign-in could not be completed</h1><p>Please try again. If the problem continues, contact the consortium administrator.</p><a href="/auth/login">Try logging in again</a> · <a href="/">Return home</a></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
  if (!['login', 'callback', 'logout'].includes(action || ''))
    return new Response('Not found', { status: 404 });
  if (request.method !== (action === 'logout' ? 'POST' : 'GET'))
    return new Response('Method not allowed', { status: 405 });
  try {
    const base = origin(url);
    if (action === 'login') {
      const state = random();
      const nonce = random();
      const verifier = random();
      const transaction = await seal(
        {
          state,
          nonce,
          verifier,
          returnTo: returnPath(url.searchParams.get('returnTo')),
        },
        600,
      );
      setCookie(cookies, names.transaction, transaction, 600, url);
      return redirect(loginUrl(base, state, nonce, verifier), 302);
    }
    if (action === 'callback') {
      const value = cookies.get(names.transaction)?.value;
      cookies.delete(names.transaction, { path: '/' });
      if (!value) throw new Error('Missing login transaction');
      const transaction = await unseal(value);
      if (
        typeof transaction.state !== 'string' ||
        transaction.state !== url.searchParams.get('state') ||
        url.searchParams.has('error')
      )
        throw new Error('Invalid login transaction');
      const code = url.searchParams.get('code');
      if (
        !code ||
        typeof transaction.verifier !== 'string' ||
        typeof transaction.nonce !== 'string'
      )
        throw new Error('Missing authorization code');
      const tokens = await exchange(
        code,
        transaction.verifier,
        base,
        transaction.nonce,
      );
      const refresh = await seal({ token: tokens.refresh }, 86400);
      setCookie(cookies, names.refresh, refresh, 86400, url);
      setCookie(cookies, names.access, tokens.access, tokens.seconds, url);
      return redirect(
        returnPath(
          typeof transaction.returnTo === 'string'
            ? transaction.returnTo
            : null,
        ),
        303,
      );
    }
    if (request.headers.get('origin') !== base)
      return new Response('Forbidden', { status: 403 });
    const stored = cookies.get(names.refresh)?.value;
    if (stored) {
      let token: unknown;
      try {
        token = (await unseal(stored)).token;
      } catch {}
      if (typeof token === 'string') await revoke(token);
    }
    clearSession(cookies);
    return redirect(logoutUrl(base), 303);
  } catch (error) {
    if (import.meta.env.DEV && error instanceof AuthConfigurationError) {
      return new Response(
        `Local authentication configuration error: ${error.message}`,
        {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        },
      );
    }
    if (action === 'logout') {
      return new Response(
        '<!doctype html><html lang="en"><meta charset="utf-8"><title>Logout failed</title><h1>Logout could not be completed</h1><p>Please retry.</p><form method="post" action="/auth/logout"><button>Retry logout</button></form><a href="/">Return home</a></html>',
        {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        },
      );
    }
    return redirect('/auth/error', 303);
  }
};
