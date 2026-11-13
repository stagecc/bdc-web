const origin = process.env.AUTH_ORIGIN;
if (
  !origin ||
  new URL(origin).origin !== origin ||
  !origin.startsWith('https://')
) {
  throw new Error(
    'Set AUTH_ORIGIN to the HTTPS site origin, without a trailing slash.',
  );
}
if (!/^[a-f0-9]{64}$/i.test(process.env.AUTH_SESSION_SECRET || '')) {
  throw new Error(
    'Set AUTH_SESSION_SECRET to 32 cryptographically random bytes encoded as hex.',
  );
}
