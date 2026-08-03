import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = ['a', 'br', 'em', 'li', 'ol', 'p', 'strong', 'ul'];
const ALLOWED_ATTR = ['href', 'rel', 'target', 'title'];

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'style'],
    ALLOW_DATA_ATTR: false,
  });
}
