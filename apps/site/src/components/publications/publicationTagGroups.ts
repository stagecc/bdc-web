import type TagPill from '@bdc/ui-react/tag/TagPill';
import type { ComponentProps } from 'react';

type TagTone = NonNullable<ComponentProps<typeof TagPill>['tone']>;

export type PublicationTagGroupKey =
  | 'researchCommunity'
  | 'researchArea'
  | 'bdcContribution';

type PublicationTagGroupConfig = {
  key: PublicationTagGroupKey;
  label: string;
  tone: TagTone;
};

export const publicationTagGroups: PublicationTagGroupConfig[] = [
  { key: 'researchCommunity', label: 'Research Community', tone: 'cool' },
  { key: 'researchArea', label: 'Research Area', tone: 'warm' },
  { key: 'bdcContribution', label: 'BDC Contribution', tone: 'neutral' },
];

export const publicationTagGroupToneByKey: Record<
  PublicationTagGroupKey,
  TagTone
> = {
  researchCommunity: 'cool',
  researchArea: 'warm',
  bdcContribution: 'neutral',
};
