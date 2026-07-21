export const isExternalUrl = (url: string): boolean =>
  url.startsWith('https://') || url.startsWith('http://');
