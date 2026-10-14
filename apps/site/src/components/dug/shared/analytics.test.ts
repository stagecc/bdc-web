import { describe, expect, it, vi } from 'vitest';
import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import { trackDugDownloadCollection } from './analytics';

vi.mock('../../../util/google-analytics/pushAnalyticsEvent', () => ({
  pushAnalyticsEvent: vi.fn(),
}));

const pushAnalyticsEventMock = vi.mocked(pushAnalyticsEvent);

describe('dug analytics helpers', () => {
  it('tracks collection downloads with a location', () => {
    trackDugDownloadCollection(
      {
        concepts: [{ id: 'C1', name: 'Concept one' }],
        studies: [{ id: 'S1', name: 'Study one' }],
        variables: [{ id: 'V1', name: 'Variable one' }],
      },
      'dug-next-steps',
    );

    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'dug-download-collection',
      location: 'dug-next-steps',
      dugConceptIds: ['C1'],
      dugStudyIds: ['S1'],
      dugVariableIds: ['V1'],
    });
  });
});
