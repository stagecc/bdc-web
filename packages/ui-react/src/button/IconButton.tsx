import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Icon, { type IconName } from '../icon/Icon';

type Tone = 'secondary' | 'warm' | 'cool' | 'neutral' | 'primary';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  icon: IconName;
  label: string;
  iconSize?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  small?: boolean;
  tone?: Tone;
  srText?: string;
  children?: ReactNode;
};

const toneClasses: Record<Tone, string> = {
  secondary:
    'bg-base-lightest hover:bg-base-lighter text-secondary-darker   hover:text-secondary-darker',
  warm: 'bg-base-lightest hover:bg-base-lighter text-accent-warm-darker hover:text-accent-warm-darker',
  cool: 'bg-base-lightest hover:bg-base-lighter text-accent-cool-darker hover:text-accent-cool-darker',
  neutral:
    'bg-base-lightest hover:bg-base-lighter text-base-light         hover:text-base-light',
  primary:
    'bg-base-lightest hover:bg-base-lighter text-primary-dark       hover:text-primary-dark',
};

export default function IconButton({
  icon,
  label,
  iconSize,
  small = false,
  tone = 'secondary',
  srText,
  className,
  children,
  ...buttonProps
}: Props) {
  const IconComponent = Icon[icon];
  const resolvedIconSize = iconSize ?? (small ? 2 : 3);
  const sizeClass = small ? 'width-3 height-3' : 'width-4 height-4';

  return (
    <button
      type="button"
      {...buttonProps}
      aria-label={label}
      className={[
        'usa-button usa-button--unstyled display-inline-flex flex-align-center flex-justify-center radius-pill',
        sizeClass,
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <IconComponent
        aria-hidden
        size={resolvedIconSize}
        style={{ color: 'currentColor', fill: 'currentColor' }}
      />
      {children}
      {srText && <span className="usa-sr-only">{srText}</span>}
    </button>
  );
}
