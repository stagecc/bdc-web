import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  inheritColor?: boolean;
  children: ReactNode;
};

export default function Link({
  to,
  inheritColor = false,
  className,
  children,
  rel,
  target,
  ...rest
}: Props) {
  const isExternal = to.startsWith('https://') || to.startsWith('http://');
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
      {...rest}
    >
      {children}
    </a>
  );
}
