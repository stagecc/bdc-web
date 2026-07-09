import type { CollectionEntry } from 'astro:content';
import Icon from '@components/Icon.tsx';

type Props = {
  pub: CollectionEntry<'publications'>['data'] & { date: string };
};

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
    <li className="usa-collection__item bdc-pub-card margin-y-3">
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
        <ul className="usa-collection__meta bdc-pub-card__meta">
          <li className="usa-collection__meta-item display-flex flex-align-center bdc-pub-card__meta-item">
            <Icon name="calendar_today" className="bdc-pub-card__icon" />
            <time dateTime={pub.date}>{formattedDate}</time>
          </li>
          <li className="usa-collection__meta-item display-flex flex-align-center bdc-pub-card__meta-item">
            <Icon name="local_library" className="bdc-pub-card__icon" />
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
          <p className="margin-top-1 bdc-pub-card__categories">
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
