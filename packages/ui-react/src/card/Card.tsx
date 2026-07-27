import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type Variant = 'feature' | 'dataset' | 'panel' | 'testimonial' | 'overview';

type Props<T extends ElementType = 'article'> = {
  variant?: Variant;
  as?: T;
  border?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export default function Card<T extends ElementType = 'article'>({
  variant = 'feature',
  as,
  border = true,
  className,
  children,
  ...rest
}: Props<T>) {
  const Tag = (as ?? 'article') as ElementType;
  const classes = [
    'card',
    `card--${variant}`,
    'bg-white radius-lg',
    'width-full',
    border && 'border border-base-lighter',
    variant === 'dataset' && 'overflow-hidden',
    ['feature', 'panel', 'testimonial', 'overview'].includes(variant) &&
      'padding-2',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
