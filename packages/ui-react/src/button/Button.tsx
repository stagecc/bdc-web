import {
  type ButtonProps,
  Button as TrussworksButton,
} from '@trussworks/react-uswds';

export default function Button(props: ButtonProps) {
  return <TrussworksButton {...props} />;
}
