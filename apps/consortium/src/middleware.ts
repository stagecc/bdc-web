import { defineMiddleware } from 'astro:middleware';
import { session } from './lib/auth';

const publicPages = new Set(['/', '/april-2026-meeting', '/_image']);
const authEndpoints = new Set([
  '/auth/login',
  '/auth/callback',
  '/auth/logout',
  '/auth/error',
]);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname.replace(/\/+$/, '') || '/';
  context.locals.user = await session(context.cookies);
  let response: Response;
  if (
    !publicPages.has(path) &&
    !authEndpoints.has(path) &&
    !context.locals.user
  ) {
    response = context.redirect(
      `/auth/login?returnTo=${encodeURIComponent(context.url.pathname + context.url.search)}`,
      302,
    );
  } else {
    response = await next();
  }
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
});
