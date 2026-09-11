export interface ScreenshotMediaOptions {
  media: 'image' | 'video';
  src: string;
  mediaType?: string;
  reducedMotionSrc?: string;
}

export function inferScreenshotMediaType(
  src: string,
  mediaType?: string,
): string | undefined {
  if (mediaType) {
    return mediaType;
  }

  if (src.endsWith('.webm')) {
    return 'video/webm';
  }

  if (src.endsWith('.mp4')) {
    return 'video/mp4';
  }

  return undefined;
}

export function hasReducedMotionFallback(
  options: ScreenshotMediaOptions,
): boolean {
  return options.media === 'video' && Boolean(options.reducedMotionSrc);
}
