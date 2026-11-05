import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const authority =
  import.meta.env.PUBLIC_COGNITO_AUTHORITY ??
  'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_hdBiEx6vB';
const clientId =
  import.meta.env.PUBLIC_COGNITO_CLIENT_ID ?? 'gf6fmaqtmunhit58cimq6e18c';
const cognitoDomain =
  import.meta.env.PUBLIC_COGNITO_DOMAIN ??
  'https://us-east-1hdbiex6vb.auth.us-east-1.amazoncognito.com';

function redirectUri() {
  return (
    import.meta.env.PUBLIC_COGNITO_REDIRECT_URI ?? `${window.location.origin}/`
  );
}

function logoutUri() {
  return (
    import.meta.env.PUBLIC_COGNITO_LOGOUT_URI ?? `${window.location.origin}/`
  );
}

let userManager: UserManager | undefined;

function getUserManager() {
  if (!userManager) {
    userManager = new UserManager({
      authority,
      client_id: clientId,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: 'email openid phone',
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    });
  }
  return userManager;
}

export async function signIn() {
  await getUserManager().signinRedirect();
}

export async function signOutRedirect() {
  const manager = getUserManager();
  manager.stopSilentRenew();
  try {
    await manager.revokeTokens(['refresh_token']);
    await manager.removeUser();
  } catch (error) {
    manager.startSilentRenew();
    throw error;
  }
  const url = `${cognitoDomain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(logoutUri())}`;
  window.location.href = url;
}

let callbackInFlight: Promise<boolean> | undefined;

export function handleAuthCallback(): Promise<boolean> {
  if (callbackInFlight) return callbackInFlight;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('code') && !url.searchParams.has('error')) {
    return Promise.resolve(false);
  }

  callbackInFlight = (async () => {
    try {
      await getUserManager().signinRedirectCallback(url.href);
      return true;
    } finally {
      for (const key of [
        'code',
        'state',
        'error',
        'error_description',
        'error_uri',
        'session_state',
      ]) {
        url.searchParams.delete(key);
      }
      if (window.location.pathname === url.pathname) {
        window.history.replaceState(
          window.history.state,
          '',
          url.pathname + url.search + url.hash,
        );
      }
    }
  })().finally(() => {
    callbackInFlight = undefined;
  });
  return callbackInFlight;
}

export async function getCurrentUser() {
  return getUserManager().getUser();
}

export function subscribeAuthState(
  onChange: (signedIn: boolean) => void,
  onError: (message: string) => void,
): () => void {
  const manager = getUserManager();
  let revision = 0;
  let active = true;
  const refresh = async () => {
    const current = ++revision;
    try {
      const user = await manager.getUser();
      if (active && current === revision)
        onChange(Boolean(user && !user.expired));
    } catch {
      if (active && current === revision) {
        onChange(false);
        onError(
          'Unable to read your sign-in session. Please try logging in again.',
        );
      }
    }
  };
  const removers = [
    manager.events.addUserLoaded(refresh),
    manager.events.addUserUnloaded(refresh),
    manager.events.addAccessTokenExpired(() => {
      ++revision;
      onChange(false);
      onError('Your session has expired. Please log in again.');
    }),
    manager.events.addSilentRenewError(() => {
      onError(
        'Your session could not be renewed. Please log in again if it expires.',
      );
      return refresh();
    }),
  ];
  const storageKey = `oidc.user:${authority}:${clientId}`;
  const onStorage = (event: StorageEvent) => {
    if (
      event.storageArea !== window.localStorage ||
      (event.key !== null && event.key !== storageKey)
    )
      return;
    if (event.key === null || event.newValue === null) {
      void manager.events.unload();
    } else {
      void refresh();
    }
  };
  window.addEventListener('storage', onStorage);
  void refresh();
  return () => {
    active = false;
    ++revision;
    removers.forEach((remove) => {
      remove();
    });
    window.removeEventListener('storage', onStorage);
  };
}
