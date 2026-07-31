import { Accordion as TrussworksAccordion } from '@trussworks/react-uswds';
import type { ComponentProps } from 'react';

type Props = Pick<
  ComponentProps<typeof TrussworksAccordion>,
  'items' | 'bordered' | 'multiselectable'
>;

export default function Accordion({
  items,
  bordered = true,
  multiselectable = true,
}: Props) {
  return (
    <TrussworksAccordion
      items={items}
      bordered={bordered}
      multiselectable={multiselectable}
    />
  );
}
