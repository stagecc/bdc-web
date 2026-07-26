import type { CollectionEntry } from 'astro:content';
import Card from '@bdc/ui-react/card/Card';
import Icon from '@bdc/ui-react/icon/Icon';
import Link from '@bdc/ui-react/link/Link';
import TagPill from '@bdc/ui-react/tag/TagPill';
import type { ComponentProps } from 'react';
import { publicationTagGroups } from './publicationTagGroups';

type Props = {
  pub: CollectionEntry<'publications'>['data'] & { date: string };
};

type TagTone = NonNullable<ComponentProps<typeof TagPill>['tone']>;

type TagGroup = {
  label: string;
  values: string[];
  tone: TagTone;
};

export default function PublicationCard({ pub }: Props) {
  if (!pub) return null;

  const publicationDate = new Date(pub.date);
  const formattedDate = Number.isNaN(publicationDate.getTime())
    ? 'Date unavailable'
    : publicationDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const tagGroups = publicationTagGroups
    .map((group) => {
      const values = pub[group.key];
      return values?.length ? { ...group, values } : null;
    })
    .filter((group): group is TagGroup => group !== null);

  return (
    <Card
      as="article"
      variant="panel"
      className="margin-y-2 tablet:margin-0 tablet:margin-bottom-2"
    >
      <h3 className="font-heading-md margin-top-0 margin-bottom-1">
        <Link to={pub.url} className="usa-link--external">
          {pub.title}
        </Link>
      </h3>

      <div className="font-body-2xs text-base-dark display-block tablet:display-flex tablet:flex-justify margin-bottom-1">
        <div className="display-flex flex-align-center">
          <Icon.Public aria-hidden />
          <span className="margin-left-05 text-italic">{pub.journalName}</span>
        </div>

        <div className="display-flex flex-align-center margin-top-05 tablet:margin-top-0">
          <Icon.CalendarToday aria-hidden />
          <time className="margin-left-05" dateTime={pub.date}>
            {formattedDate}
          </time>
          {pub.status && (
            <>
              <span className="margin-x-1">•</span>
              <span>{pub.status}</span>
            </>
          )}
        </div>
      </div>

      {tagGroups.length > 0 && (
        <div className="margin-0 display-flex flex-wrap flex-align-start margin-left-neg-1">
          {tagGroups.map((group) => (
            <span key={group.label}>
              {group.values.map((value) => (
                <TagPill
                  key={`${group.label},${value}`}
                  label={value}
                  tone={group.tone}
                  className="margin-left-1"
                />
              ))}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
