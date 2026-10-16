import { describe, expect, it } from 'vitest';
import { getEventEndDateTime, isPastEvent } from './eventDateTime';

describe('getEventEndDateTime', () => {
  it('treats a single-day event as current until the next day', () => {
    const endDateTime = getEventEndDateTime({
      date: new Date('2025-09-11'),
    });

    expect(endDateTime.toISOString()).toBe('2025-09-12T00:00:00.000Z');
  });

  it('uses the final day for multi-day events', () => {
    const endDateTime = getEventEndDateTime({
      date: new Date('2025-05-14'),
      endDate: new Date('2025-05-16'),
    });

    expect(endDateTime.toISOString()).toBe('2025-05-17T00:00:00.000Z');
  });
});

describe('isPastEvent', () => {
  it('keeps an event active for the full event day', () => {
    expect(
      isPastEvent(
        {
          date: new Date('2025-09-11'),
        },
        new Date('2025-09-11T23:59:00.000Z'),
      ),
    ).toBe(false);
  });

  it('marks an event as past on the following day', () => {
    expect(
      isPastEvent(
        {
          date: new Date('2025-09-11'),
        },
        new Date('2025-09-12T00:01:00.000Z'),
      ),
    ).toBe(true);
  });
});
