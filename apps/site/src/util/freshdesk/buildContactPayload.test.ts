import { describe, expect, it } from 'vitest';
import { buildContactPayload } from './buildContactPayload';

describe('buildContactPayload', () => {
  it('returns email only when name is not provided', () => {
    const payload = buildContactPayload({ email: 'jane@university.edu' });
    expect(payload).toEqual({ email: 'jane@university.edu' });
    expect(payload.name).toBeUndefined();
  });

  it('includes name when provided', () => {
    const payload = buildContactPayload({
      email: 'jane@university.edu',
      name: 'Jane Researcher',
    });
    expect(payload).toEqual({
      email: 'jane@university.edu',
      name: 'Jane Researcher',
    });
  });

  it('trims whitespace from name', () => {
    const payload = buildContactPayload({
      email: 'jane@university.edu',
      name: '  Jane Researcher  ',
    });
    expect(payload.name).toBe('Jane Researcher');
  });

  it('omits name when it is an empty string', () => {
    const payload = buildContactPayload({
      email: 'jane@university.edu',
      name: '',
    });
    expect(payload.name).toBeUndefined();
  });

  it('omits name when it is only whitespace', () => {
    const payload = buildContactPayload({
      email: 'jane@university.edu',
      name: '   ',
    });
    expect(payload.name).toBeUndefined();
  });
});
