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
      className={`usa-icon usa-icon--size-${size} bdc-pub-card__icon`}
      aria-hidden="true"
      focusable="false"
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
    <li className="usa-collection__item maxw-full margin-y-3">
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
            <Icon name="calendar_today" />
            <time dateTime={pub.date}>{formattedDate}</time>
          </li>
          <li className="usa-collection__meta-item display-flex flex-align-center bdc-pub-card__meta-item">
            <Icon name="local_library" />
            {pub.journalName}
          </li>
        </ul>
        {pub.status && (
          <div className="margin-top-1">
            <span className="usa-tag padding-x-2 padding-y-05 font-body-2xs">
              {pub.status}
            </span>
          </div>
        )}
        {metaRows.length > 0 && (
          <p className="margin-top-1 margin-bottom-0 font-body-xs line-height-body-5">
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
