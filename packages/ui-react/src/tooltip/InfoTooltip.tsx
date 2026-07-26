import Icon from '../icon/Icon';
import Tooltip from './Tooltip';

type IconName = keyof typeof Icon;

type Props = {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: IconName;
};

export default function InfoTooltip({
  text,
  position = 'top',
  icon = 'InfoOutline',
}: Props) {
  const IconComponent = Icon[icon];

  return (
    <Tooltip
      text={text}
      position={position}
      className="bg-transparent padding-0 cursor-pointer text-primary-dark margin-left-05"
    >
      <IconComponent aria-hidden size={2} />
    </Tooltip>
  );
}
