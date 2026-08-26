import {
  type ButtonProps,
  Button as TrussworksButton,
} from '@trussworks/react-uswds';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type TrussworksVariantProps = Pick<
  ButtonProps,
  | 'secondary'
  | 'base'
  | 'accentStyle'
  | 'outline'
  | 'inverse'
  | 'size'
  | 'unstyled'
>;

type LinkButtonProps = TrussworksVariantProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'> & {
    href: string;
    children: ReactNode;
    type?: never;
    disabled?: never;
  };

type NativeButtonProps = ButtonProps & {
  href?: undefined;
};

export type Props = NativeButtonProps | LinkButtonProps;

const variantClassNames = ({
  secondary,
  base,
  accentStyle,
  outline,
  inverse,
  size,
  unstyled,
}: TrussworksVariantProps) =>
  [
    'usa-button',
    secondary && 'usa-button--secondary',
    base && 'usa-button--base',
    accentStyle === 'cool' && 'usa-button--accent-cool',
    accentStyle === 'warm' && 'usa-button--accent-warm',
    outline && 'usa-button--outline',
    inverse && 'usa-button--inverse',
    size === 'big' && 'usa-button--big',
    unstyled && 'usa-button--unstyled',
  ]
    .filter(Boolean)
    .join(' ');

export default function Button(props: Props) {
  if ('href' in props && props.href) {
    const {
      children,
      className,
      secondary,
      base,
      accentStyle,
      outline,
      inverse,
      size,
      unstyled,
      ...anchorProps
    } = props;

    return (
      <a
        {...anchorProps}
        className={[variantClassNames(props), className]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </a>
    );
  }

  return <TrussworksButton {...props} />;
}
