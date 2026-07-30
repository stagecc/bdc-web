import type { AnchorHTMLAttributes, ReactNode } from 'react';

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

const isGovHostname = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase().replace(/\.+$/, '');
  return normalized === 'gov' || normalized.endsWith('.gov');
};

const requiresExitNotice = (url: string): boolean => {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  return HTTP_PROTOCOLS.has(parsed.protocol) && !isGovHostname(parsed.hostname);
};

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  inheritColor?: boolean;
  exitNotice?: 'auto' | 'always' | 'never';
  children: ReactNode;
};

export default function Link({
  to,
  inheritColor = false,
  exitNotice = 'auto',
  className,
  children,
  rel,
  target,
  'data-requires-exit-notice': exitNoticeDataAttribute,
  ...rest
}: Props) {
  const isExternal = to.startsWith('https://') || to.startsWith('http://');
  const shouldRequireExitNotice =
    exitNotice === 'always'
      ? true
      : exitNotice === 'never'
        ? false
        : requiresExitNotice(to);
  const classes = [
    className,
    'usa-link',
    inheritColor && 'link--inherit-style',
    isExternal && 'usa-link--external',
  ]
    .filter(Boolean)
    .join(' ');

  const externalRel = rel ?? (isExternal ? 'noopener noreferrer' : undefined);
  const externalTarget = target ?? (isExternal ? '_blank' : undefined);

  return (
    <a
      href={to}
      className={classes}
      rel={externalRel}
      target={externalTarget}
      data-requires-exit-notice={
        shouldRequireExitNotice
          ? 'true'
          : (exitNoticeDataAttribute as string | undefined)
      }
      {...rest}
    >
      {children}
    </a>
  );
}
