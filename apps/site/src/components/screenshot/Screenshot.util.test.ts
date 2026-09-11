import { describe, expect, it } from 'vitest';
import {
  hasReducedMotionFallback,
  inferScreenshotMediaType,
} from './Screenshot.util';

describe('inferScreenshotMediaType', () => {
  it('returns explicit mediaType when provided', () => {
    expect(inferScreenshotMediaType('/video.any', 'video/custom')).toBe(
      'video/custom',
    );
  });

  it('infers webm type from file extension', () => {
    expect(inferScreenshotMediaType('/assets/analyze-hero.webm')).toBe(
      'video/webm',
    );
  });

  it('infers mp4 type from file extension', () => {
    expect(inferScreenshotMediaType('/assets/analyze-hero.mp4')).toBe(
      'video/mp4',
    );
  });
});

describe('hasReducedMotionFallback', () => {
  it('returns true for video media with reduced motion source', () => {
    expect(
      hasReducedMotionFallback({
        media: 'video',
        src: '/assets/analyze-hero.webm',
        reducedMotionSrc: '/assets/analyze-hero-poster.png',
      }),
    ).toBe(true);
  });

  it('returns false for video media without reduced motion source', () => {
    expect(
      hasReducedMotionFallback({
        media: 'video',
        src: '/assets/analyze-hero.webm',
      }),
    ).toBe(false);
  });

  it('returns false for image media even with reduced motion source', () => {
    expect(
      hasReducedMotionFallback({
        media: 'image',
        src: '/assets/still.png',
        reducedMotionSrc: '/assets/still.png',
      }),
    ).toBe(false);
  });
});
