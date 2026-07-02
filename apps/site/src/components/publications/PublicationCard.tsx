import type { CollectionEntry } from 'astro:content';

type Props = {
  pub: CollectionEntry<'publications'>['data'] & { date: string };
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Published: { bg: '#c3dbff', color: '#000f2a' },
  PrePrint: { bg: '#90cc90', color: '#000f2a' },
  Other: { bg: '#dddddd', color: '#000f2a' },
};

export default function PublicationCard({ pub }: Props) {
  const formattedDate = new Date(pub.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const statusStyle = pub.status
    ? (STATUS_COLORS[pub.status] ?? { bg: '#565c65', color: '#ffffff' })
    : null;

  const metaRows = [
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
        <p
          className="margin-top-1"
          style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: 0 }}
        >
          {pub.status && statusStyle && (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: statusStyle.bg,
                color: statusStyle.color,
                verticalAlign: 'middle',
                marginRight: '8px',
              }}
            >
              {pub.status}
            </span>
          )}
          {metaRows.map((row, i) => (
            <span key={row.label}>
              <span className="text-base-dark">{row.label}: </span>
              <span className="text-base">{row.values.join(' · ')}</span>
              {i < metaRows.length - 1 && (
                <span className="text-base-light margin-x-1">|</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </li>
  );
}
