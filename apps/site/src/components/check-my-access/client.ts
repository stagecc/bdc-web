import {
  buildCheckMyAccessUrl,
  CHECK_MY_ACCESS_NONCE_STORAGE_KEY,
  CHECK_MY_ACCESS_STORAGE_KEY,
  type CheckMyAccessPreviewData,
  type CheckMyAccessStoredAuth,
  type CheckMyAccessTokens,
  type CheckMyAccessUser,
  createNonce,
  doesNonceMatch,
  downloadProjectsCsv,
  extractProjects,
  getCheckMyAccessConfig,
  getPreviewData,
  isIdTokenExpired,
  parseHashTokens,
} from './lib';

declare global {
  interface Window {
    __bdcCheckMyAccessBooted?: boolean;
  }
}

type ViewState =
  | { kind: 'logged-out' }
  | { kind: 'processing'; detail?: string }
  | { kind: 'projects'; userName: string; projects: string[] }
  | { kind: 'empty'; userName: string }
  | { kind: 'session-error' }
  | { kind: 'lookup-error'; userName?: string };

interface CheckMyAccessRoot {
  content: HTMLElement;
  previewBadge: HTMLElement;
  root: HTMLElement;
  title: HTMLElement;
}

const SELECTOR = '[data-check-my-access]';

const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: {
    className?: string;
    text?: string;
    attrs?: Record<string, string>;
  } = {},
) => {
  const element = document.createElement(tagName);
  if (options.className) {
    element.className = options.className;
  }
  if (options.text) {
    element.textContent = options.text;
  }
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });
  }
  return element;
};

const createActionRow = () =>
  createElement('div', {
    className: 'display-flex flex-wrap gap-2 margin-top-2',
  });

const createButton = (
  label: string,
  action: 'login' | 'retry-lookup' | 'download',
  outline = false,
) => {
  return createElement('button', {
    className: outline ? 'usa-button usa-button--outline' : 'usa-button',
    text: label,
    attrs: {
      type: 'button',
      'data-check-my-access-action': action,
    },
  });
};

const createSupportLink = () => {
  return createElement('a', {
    className: 'usa-button usa-button--outline',
    text: 'Get Help',
    attrs: {
      href: '/help/get-help',
    },
  });
};

const focusTitle = (title: HTMLElement) => {
  requestAnimationFrame(() => {
    title.focus();
  });
};

const clearHash = () => {
  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, document.title, cleanUrl);
};

const loadStoredAuth = (): CheckMyAccessStoredAuth | null => {
  const stored = window.localStorage.getItem(CHECK_MY_ACCESS_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<CheckMyAccessStoredAuth>;
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.idToken !== 'string'
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      idToken: parsed.idToken,
      nonce: typeof parsed.nonce === 'string' ? parsed.nonce : undefined,
    };
  } catch {
    return null;
  }
};

const saveStoredAuth = (tokens: CheckMyAccessTokens, nonce?: string | null) => {
  window.localStorage.setItem(
    CHECK_MY_ACCESS_STORAGE_KEY,
    JSON.stringify({
      ...tokens,
      nonce: nonce ?? undefined,
    }),
  );
};

const clearStoredAuth = () => {
  window.localStorage.removeItem(CHECK_MY_ACCESS_STORAGE_KEY);
};

const clearStoredNonce = () => {
  window.sessionStorage.removeItem(CHECK_MY_ACCESS_NONCE_STORAGE_KEY);
};

const fetchFenceUser = async (
  authRoot: string,
  tokens: CheckMyAccessTokens,
) => {
  const response = await fetch(`${authRoot}/user/user/`, {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Fence lookup failed with status ${response.status}`);
  }

  return (await response.json()) as CheckMyAccessUser;
};

const renderState = (
  elements: CheckMyAccessRoot,
  state: ViewState,
  isPreview = false,
) => {
  const { content, previewBadge, title } = elements;
  content.replaceChildren();
  content.setAttribute(
    'aria-busy',
    state.kind === 'processing' ? 'true' : 'false',
  );
  previewBadge.hidden = !isPreview;

  if (state.kind === 'logged-out') {
    title.textContent = 'Check My Access';
    const description = createElement('p', {
      className: 'margin-top-0 margin-bottom-0',
      text: 'Sign in with your eRA Commons account to see which approved projects you can access.',
    });
    const actionRow = createActionRow();
    actionRow.append(createButton('Check My Access', 'login'));
    content.append(description, actionRow);
    return;
  }

  if (state.kind === 'processing') {
    title.textContent = 'Check My Access';
    const status = createElement('div', {
      className: 'padding-2 radius-md bg-primary-lighter text-base-darkest',
      attrs: {
        role: 'status',
      },
    });
    status.append(
      createElement('p', {
        className: 'margin-top-0 margin-bottom-1 text-bold',
        text: 'Signing you in and checking your access...',
      }),
      createElement('p', {
        className: 'margin-top-0 margin-bottom-0',
        text:
          state.detail ??
          'This page is processing the return from authentication and loading your project approvals.',
      }),
    );
    content.append(status);
    focusTitle(title);
    return;
  }

  if (state.kind === 'projects') {
    title.textContent = 'My Access';
    const signedIn = createElement('p', {
      className: 'margin-top-0 margin-bottom-1',
      text: `You are logged in as ${state.userName}.`,
    });
    const summary = createElement('p', {
      className: 'margin-top-0 margin-bottom-1 text-bold',
      text: `You have access to ${state.projects.length} project${state.projects.length === 1 ? '' : 's'}.`,
    });
    const listWrapper = createElement('div', {
      className:
        'margin-top-1 margin-bottom-0 padding-right-1 overflow-auto border border-base-lighter radius-md bg-white',
      attrs: {
        style: 'max-height: 16rem;',
      },
    });
    const list = createElement('ul', {
      className: 'usa-list margin-top-0 margin-bottom-0',
    });
    state.projects.forEach((project) => {
      list.append(
        createElement('li', {
          text: project,
        }),
      );
    });
    listWrapper.append(list);
    const actionRow = createActionRow();
    actionRow.append(createButton('Download Project List', 'download', true));
    content.append(signedIn, summary, listWrapper, actionRow);
    focusTitle(title);
    return;
  }

  if (state.kind === 'empty') {
    title.textContent = 'My Access';
    content.append(
      createElement('p', {
        className: 'margin-top-0 margin-bottom-1',
        text: `You are logged in as ${state.userName}.`,
      }),
      createElement('p', {
        className: 'margin-top-0 margin-bottom-1 text-bold',
        text: "You don't have access to any projects yet.",
      }),
      createElement('p', {
        className: 'margin-top-0 margin-bottom-0',
        text: 'You may still need dbGaP approval before project access appears here.',
      }),
    );
    focusTitle(title);
    return;
  }

  title.textContent = 'Check My Access';
  const message =
    state.kind === 'session-error'
      ? "We couldn't complete sign-in. Your session may have expired."
      : "We signed you in, but couldn't retrieve your access information.";

  const detail =
    state.kind === 'session-error'
      ? 'Try signing in again to start a fresh access check.'
      : 'Retry to run the access lookup again, or contact support if the problem continues.';

  const alert = createElement('div', {
    className: 'padding-2 radius-md bg-secondary-lighter text-base-darkest',
    attrs: {
      role: 'alert',
    },
  });
  alert.append(
    createElement('p', {
      className: 'margin-top-0 margin-bottom-1 text-bold',
      text: message,
    }),
    createElement('p', {
      className: 'margin-top-0 margin-bottom-0',
      text: detail,
    }),
  );

  const actionRow = createActionRow();
  actionRow.append(
    createButton(
      state.kind === 'session-error' ? 'Try Again' : 'Retry',
      state.kind === 'session-error' ? 'login' : 'retry-lookup',
    ),
  );
  if (state.kind === 'lookup-error') {
    actionRow.append(createSupportLink());
  }

  content.append(alert, actionRow);
  focusTitle(title);
};

const renderPreviewState = (
  elements: CheckMyAccessRoot,
  preview: CheckMyAccessPreviewData,
  setPreviewData: (userName: string, projects: string[]) => void,
) => {
  switch (preview.state) {
    case 'logged-out':
      renderState(elements, { kind: 'logged-out' }, true);
      return;
    case 'processing':
      renderState(
        elements,
        {
          kind: 'processing',
          detail: 'Preview mode is showing the post-login processing state.',
        },
        true,
      );
      return;
    case 'projects':
      setPreviewData(preview.userName, preview.projects);
      renderState(
        elements,
        {
          kind: 'projects',
          userName: preview.userName,
          projects: preview.projects,
        },
        true,
      );
      return;
    case 'empty':
      renderState(
        elements,
        {
          kind: 'empty',
          userName: preview.userName,
        },
        true,
      );
      return;
    case 'session-error':
      renderState(elements, { kind: 'session-error' }, true);
      return;
    case 'lookup-error':
      renderState(
        elements,
        {
          kind: 'lookup-error',
          userName: preview.userName,
        },
        true,
      );
      return;
  }
};

const mountCheckMyAccess = async (root: HTMLElement) => {
  if (root.dataset.checkMyAccessMounted === 'true') {
    return;
  }

  root.dataset.checkMyAccessMounted = 'true';
  const content = root.querySelector<HTMLElement>(
    '[data-check-my-access-content]',
  );
  const previewBadge = root.querySelector<HTMLElement>(
    '[data-check-my-access-preview-badge]',
  );
  const title = root.querySelector<HTMLElement>('[data-check-my-access-title]');

  if (!content || !previewBadge || !title) {
    return;
  }

  const elements: CheckMyAccessRoot = {
    content,
    previewBadge,
    root,
    title,
  };

  let latestTokens: CheckMyAccessTokens | null = null;
  let latestUserName = '';
  let latestProjects: string[] = [];
  const config = getCheckMyAccessConfig();
  const preview = getPreviewData(new URL(window.location.href));

  const startLogin = () => {
    if (!config) {
      renderState(elements, { kind: 'session-error' });
      return;
    }

    const nonce = createNonce();
    window.sessionStorage.setItem(CHECK_MY_ACCESS_NONCE_STORAGE_KEY, nonce);
    const authUrl = buildCheckMyAccessUrl(
      new URL(window.location.href),
      nonce,
      config,
    );
    window.location.assign(authUrl);
  };

  const handleLookup = async (tokens: CheckMyAccessTokens) => {
    if (!config) {
      throw new Error('Check My Access config missing');
    }

    renderState(elements, { kind: 'processing' });
    latestTokens = tokens;

    const user = await fetchFenceUser(config.authRoot, tokens);
    const userName = user.name?.trim() || 'Authenticated user';
    const projects = extractProjects(user);

    latestUserName = userName;
    latestProjects = projects;

    if (projects.length > 0) {
      renderState(elements, { kind: 'projects', userName, projects });
      return;
    }

    renderState(elements, { kind: 'empty', userName });
  };

  root.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.closest<HTMLElement>('[data-check-my-access-action]')
      ?.dataset.checkMyAccessAction;

    if (!action) {
      return;
    }

    if (action === 'login') {
      startLogin();
      return;
    }

    if (action === 'download') {
      if (latestProjects.length > 0) {
        downloadProjectsCsv(latestUserName, latestProjects);
      }
      return;
    }

    if (action === 'retry-lookup' && latestTokens) {
      try {
        await handleLookup(latestTokens);
      } catch {
        renderState(elements, {
          kind: 'lookup-error',
          userName: latestUserName || undefined,
        });
      }
    }
  });

  if (preview) {
    renderPreviewState(elements, preview, (userName, projects) => {
      latestUserName = userName;
      latestProjects = projects;
    });
    return;
  }

  try {
    const returnedTokens = parseHashTokens(window.location.hash);
    const expectedNonce = window.sessionStorage.getItem(
      CHECK_MY_ACCESS_NONCE_STORAGE_KEY,
    );

    if (returnedTokens) {
      renderState(elements, { kind: 'processing' });
      if (!config) {
        clearStoredAuth();
        clearStoredNonce();
        clearHash();
        renderState(elements, { kind: 'session-error' });
        return;
      }

      if (
        isIdTokenExpired(returnedTokens.idToken) ||
        !doesNonceMatch(returnedTokens.idToken, expectedNonce)
      ) {
        clearStoredAuth();
        clearStoredNonce();
        clearHash();
        renderState(elements, { kind: 'session-error' });
        return;
      }

      saveStoredAuth(returnedTokens, expectedNonce);
      clearStoredNonce();
      clearHash();

      await handleLookup(returnedTokens);
      return;
    }

    const storedAuth = loadStoredAuth();
    if (!storedAuth) {
      renderState(elements, { kind: 'logged-out' });
      return;
    }

    if (!config) {
      clearStoredAuth();
      clearStoredNonce();
      renderState(elements, { kind: 'session-error' });
      return;
    }

    if (
      isIdTokenExpired(storedAuth.idToken) ||
      !doesNonceMatch(storedAuth.idToken, storedAuth.nonce)
    ) {
      clearStoredAuth();
      clearStoredNonce();
      renderState(elements, { kind: 'session-error' });
      return;
    }

    await handleLookup(storedAuth);
  } catch {
    renderState(elements, {
      kind: 'lookup-error',
      userName: latestUserName || undefined,
    });
  }
};

export const bootCheckMyAccess = () => {
  const mountAll = () => {
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((root) => {
      void mountCheckMyAccess(root);
    });
  };

  if (!window.__bdcCheckMyAccessBooted) {
    document.addEventListener('astro:page-load', mountAll);
    window.__bdcCheckMyAccessBooted = true;
  }

  mountAll();
};
