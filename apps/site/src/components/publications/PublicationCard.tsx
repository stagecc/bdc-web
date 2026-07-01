import type { CollectionEntry } from 'astro:content';

type Props = {
  pub: CollectionEntry<'publications'>['data'] & { date: string };
};

export default function PublicationCard({ pub }: Props) {
  const formattedDate = new Date(pub.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const metaRows = [
    pub.status ? { label: 'Status', values: [pub.status] } : null,
    pub.researchCommunity?.length
      ? { label: 'Research Community', values: pub.researchCommunity }
      : null,
    pub.researchArea?.length
      ? { label: 'Research Area', values: pub.researchArea }
      : null,
    pub.bdcContribution?.length
      ? { label: 'BDC Contribution', values: pub.bdcContribution }
      : null,
  ].filter(Boolean) as { label: string; values: string[] }[];

  return (
    <li className="usa-collection__item" style={{ maxWidth: '100%' }}>
      <div className="usa-collection__body">
        <h4 className="usa-collection__heading">
          <a
            href={pub.url}
            className="usa-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {pub.title}
          </a>
        </h4>
        <ul className="usa-collection__meta">
          <li className="usa-collection__meta-item">
            <time dateTime={pub.date}>{formattedDate}</time>
          </li>
          <li className="usa-collection__meta-item">{pub.journalName}</li>
        </ul>
        {metaRows.length > 0 && (
          <p style={{ marginTop: '6px', fontSize: '13px', lineHeight: '1.6' }}>
            {metaRows.map((row, i) => (
              <span key={row.label}>
                <span className="text-base-dark">{row.label}: </span>
                <span className="text-base" style={{ fontStyle: 'italic' }}>
                  {row.values.join('; ')}
                </span>
                {i < metaRows.length - 1 && (
                  <span className="text-base-light margin-x-1">|</span>
                )}
              </span>
            ))}
          </p>
        )}
      </div>
    </li>
  );
}
