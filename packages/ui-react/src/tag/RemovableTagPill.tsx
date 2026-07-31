import type { ComponentProps } from 'react';
import Button from '../button/Button';
import Tag from './Tag';

type Props = {
  label: string;
  onRemove: () => void;
  ariaLabel?: string;
  className?: string;
  tone?: ComponentProps<typeof Tag>['tone'];
};

const hoverToneClasses: Record<
  NonNullable<ComponentProps<typeof Tag>['tone']>,
  string
> = {
  secondary: 'hover:bg-secondary-light',
  warm: 'hover:bg-accent-warm-light',
  cool: 'hover:bg-accent-cool-light',
  neutral: 'hover:bg-base-lighter',
};

export default function RemovableTagPill({
  label,
  onRemove,
  ariaLabel,
  className,
  tone = 'secondary',
}: Props) {
  return (
    <Button
      onClick={onRemove}
      type="button"
      unstyled
      className={[
        'usa-button usa-button--unstyled display-inline-flex flex-align-center text-no-underline hover:text-no-underline margin-right-05 margin-bottom-05',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel ?? `Remove filter: ${label}`}
    >
      <Tag
        tone={tone}
        className={`display-inline-flex flex-align-center ${hoverToneClasses[tone]}`}
        label={
          <>
            {label}
            <span aria-hidden="true" className="margin-left-05">
              ×
            </span>
          </>
        }
      />
    </Button>
  );
}
