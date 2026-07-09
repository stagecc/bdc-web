/**
 * Icon.tsx
 *
 * React equivalent of Icon.astro for use inside React islands (.tsx components).
 * Uses the same USWDS sprite and class conventions as Icon.astro.
 *
 * Cannot import Icon.astro directly into React components — Astro components
 * are server-only and not valid React components. This shared .tsx version
 * bridges that gap.
 *
 * Props:
 *   name      — Icon name matching a symbol id in the USWDS sprite
 *   label     — Accessible label. If omitted, icon is treated as decorative
 *               (aria-hidden="true"). If provided, renders a <title> and role="img".
 *   size      — USWDS icon size token (3–9). Defaults to no size modifier.
 *   className — Additional CSS classes.
 */

import spriteUrl from '../assets/sprite.svg?url';

interface Props {
  name: string;
  label?: string;
  size?: 3 | 4 | 5 | 6 | 7 | 8 | 9;
  className?: string;
}

export default function Icon({ name, label, size, className = '' }: Props) {
  const isDecorative = !label;
  const sizeClass = size ? `usa-icon--size-${size}` : '';

  return (
    <svg
      className={`usa-icon ${sizeClass} ${className}`.trim()}
      aria-hidden={isDecorative ? 'true' : undefined}
      role={isDecorative ? 'img' : undefined}
      focusable="false"
    >
      {label && <title>{label}</title>}
      <use href={`${spriteUrl}#${name}`} />
    </svg>
  );
}
