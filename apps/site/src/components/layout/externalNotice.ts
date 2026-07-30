import { requiresExitNotice } from '../../util/url';

type ExitNoticeAnchor = {
  dataset: {
    requiresExitNotice?: string;
  };
  href: string;
};

export const shouldRequireExitNotice = (
  anchor: ExitNoticeAnchor,
  currentOrigin: string,
): boolean =>
  anchor.dataset.requiresExitNotice === 'true' ||
  requiresExitNotice(anchor.href, {
    currentOrigin,
  });
