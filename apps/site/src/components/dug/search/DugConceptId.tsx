import Link from '@bdc/ui-react/link/Link';

type Props = {
  id: string;
  conceptAction?: string;
  className?: string;
};

export default function DugConceptId({ id, conceptAction, className }: Props) {
  const idElement = <code className={className}>{id}</code>;

  if (!conceptAction) {
    return idElement;
  }

  return (
    <Link to={conceptAction} aria-label={`${id} ontology record`}>
      {idElement}
    </Link>
  );
}
