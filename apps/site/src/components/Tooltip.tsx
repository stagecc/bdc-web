import { Icon, Tooltip as TrussTooltip } from '@trussworks/react-uswds';

interface Props {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ text, position = 'top' }: Props) {
  return (
    <TrussTooltip
      label={text}
      position={position}
      className="bg-transparent padding-0 cursor-pointer text-primary-dark margin-left-1 height-3 width-3"
      aria-label={text}
    >
      <Icon.InfoOutline aria-hidden size={3} />
    </TrussTooltip>
  );
}
