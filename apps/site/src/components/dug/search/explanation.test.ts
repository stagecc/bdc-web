import { describe, expect, it } from 'vitest';
import { summarizeDugExplanation } from './explanation';

describe('summarizeDugExplanation', () => {
  it('groups score contributions by known Dug fields', () => {
    const summary = summarizeDugExplanation({
      value: 10,
      description: 'sum of:',
      details: [
        {
          value: 4,
          description:
            'weight(name:"asthma" in 0) [PerFieldSimilarity], result of:',
        },
        {
          value: 3,
          description:
            'weight(description:asthma in 0) [PerFieldSimilarity], result of:',
        },
        {
          value: 3,
          description:
            'weight(search_terms:airway disease in 0) [PerFieldSimilarity], result of:',
        },
      ],
    });

    expect(summary.totalScore).toBe(10);
    expect(summary.items.map((item) => item.title)).toEqual([
      'Name',
      'Description',
      'Synonymous terms',
    ]);
    expect(summary.items.map((item) => item.percentage)).toEqual([40, 30, 30]);
    expect(summary.items[0].matchedTerms).toEqual(['asthma']);
  });

  it('marks unparsable explanations as other signals with a parse warning', () => {
    const summary = summarizeDugExplanation({
      value: 8,
      description: 'max of:',
      details: [
        {
          value: 8,
          description: 'score(doc=42,freq=1.0), computed as boost',
        },
      ],
    });

    expect(summary.items).toHaveLength(1);
    expect(summary.items[0].title).toBe('Other signals');
    expect(summary.items[0].hasParseWarning).toBe(true);
    expect(summary.items[0].percentage).toBe(100);
  });

  it('parses nested Dug scoring trees without counting boost/idf/tf internals', () => {
    const summary = summarizeDugExplanation({
      value: 330.03802,
      description: 'sum of:',
      details: [
        {
          value: 49.731,
          description:
            'weight(description:brain in 2635) [PerFieldSimilarity], result of:',
          details: [
            {
              value: 49.731,
              description:
                'score(freq=3.0), computed as boost * idf * tf from:',
              details: [
                { value: 24.2, description: 'boost', details: [] },
                { value: 3.8, description: 'idf', details: [] },
                { value: 0.5, description: 'tf', details: [] },
              ],
            },
          ],
        },
        {
          value: 120.73679,
          description:
            'weight(name:brain in 2635) [PerFieldSimilarity], result of:',
          details: [],
        },
        {
          value: 83.34906,
          description:
            'weight(search_terms:brain in 2635) [PerFieldSimilarity], result of:',
          details: [],
        },
      ],
    });

    expect(summary.items.map((item) => item.title)).toEqual([
      'Name',
      'Synonymous terms',
      'Description',
    ]);
    expect(
      summary.items.find((item) => item.id === 'name')?.matchedTerms,
    ).toEqual(['brain']);
    expect(
      summary.items.find((item) => item.id === 'name')?.hasParseWarning,
    ).toBe(false);
    expect(summary.items.some((item) => item.id === 'unknown')).toBe(false);
  });

  it('returns an empty summary when explanation is missing', () => {
    expect(summarizeDugExplanation(undefined)).toEqual({
      totalScore: 0,
      items: [],
    });
  });
});
