import { Icon as TrussworksIcon } from '@trussworks/react-uswds';
import type { SVGProps } from 'react';
import { customIcons } from './custom-icons';

type IconComponent = (
  props: SVGProps<SVGSVGElement> & {
    size?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    label?: string;
  },
) => JSX.Element;

const toPascalCase = (value: string) =>
  value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((token) => `${token.charAt(0).toUpperCase()}${token.slice(1)}`)
    .join('');

const createCustomIconComponent = (name: string): IconComponent => {
  const definition = customIcons[name];

  return ({ size = 3, label, className, ...rest }) => {
    const isDecorative = !label && !rest['aria-label'];
    const sizeClass = size ? `usa-icon--size-${size}` : '';
    const classes = ['usa-icon', sizeClass, className]
      .filter(Boolean)
      .join(' ');

    return (
      <svg
        {...rest}
        className={classes}
        aria-hidden={isDecorative ? true : undefined}
        role={isDecorative ? undefined : 'img'}
        focusable="false"
        viewBox={definition.viewBox ?? '0 0 24 24'}
      >
        {label && <title>{label}</title>}
        {definition.paths.map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    );
  };
};

const customIconEntries = Object.entries(customIcons).flatMap(([name]) => {
  const component = createCustomIconComponent(name);
  const pascalName = toPascalCase(name);

  return [
    [pascalName, component],
    [name, component],
  ] as const;
});

const Icon = {
  ...(TrussworksIcon as Record<string, IconComponent>),
  ...Object.fromEntries(customIconEntries),
} as const;

export type IconName = keyof typeof Icon;

export function IconGlyph({
  name,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement> & {
    size?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    label?: string;
  }) {
  const IconComponent = Icon[name];
  return <IconComponent {...props} />;
}

export default Icon;
