import type { CollectionEntry } from 'astro:content';
import spriteUrl from '../../assets/sprite.svg?url';

type Props = {
  pub: CollectionEntry<'publications'>['data'] & { date: string };
};

function Icon({
  name,
  size = 3,
}: {
  name: string;
  size?: 3 | 4 | 5 | 6 | 7 | 8 | 9;
}) {
  return (
    <svg
      className={`usa-icon usa-icon--size-${size}`}
      aria-hidden="true"
      focusable="false"
      style={{ marginBottom: '2px', marginRight: '4px' }}
    >
      <use href={`${spriteUrl}#${name}`} />
    </svg>
  );
}

export default function PublicationCard({ pub }: Props) {
  const formattedDate = new Date(pub.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const statusSlug = pub.status?.toLowerCase().replace(/\s+/g, '-');

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
    <li
      className="usa-collection__item margin-y-3"
      style={{ maxWidth: '100%' }}
    >
      <div className="usa-collection__body">
        <h4 className="usa-collection__heading">
          <a
            href={pub.url}
            className="usa-link usa-link--external"
            target="_blank"
            rel="noopener noreferrer"
          >
            {pub.title}
          </a>
        </h4>
        <ul
          className="usa-collection__meta margin-top-2"
          style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}
        >
          <li
            className="usa-collection__meta-item display-flex flex-align-center"
            style={{ fontWeight: 800, gap: '4px' }}
          >
            <Icon name="calendar_today" size={2} />
            <time dateTime={pub.date}>{formattedDate}</time>
          </li>
          <li
            className="usa-collection__meta-item display-flex flex-align-center"
            style={{ fontWeight: 800, gap: '4px' }}
          >
            <Icon name="local_library" size={2} />
            {pub.journalName}
          </li>
        </ul>
        {pub.status && (
          <div className="margin-top-1">
            <span
              className={`usa-tag bdc-tag--status bdc-tag--status-${statusSlug}`}
            >
              {pub.status}
            </span>
          </div>
        )}
        {metaRows.length > 0 && (
          <p
            className="margin-top-1"
            style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: 0 }}
          >
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
        )}
      </div>
    </li>
  );
}
