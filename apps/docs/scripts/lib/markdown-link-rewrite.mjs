export function rewriteMarkdownLinkDestinations(content, rewriteDestination) {
  return content.replace(/\]\((<[^>]+>|[^)]+)\)/g, (match, rawTarget) => {
    const trimmed = rawTarget.trim().replace(/^<|>$/g, '');
    if (!trimmed) return match;

    const rewritten = rewriteDestination(trimmed);
    if (!rewritten) return match;

    return `](${formatMarkdownDestination(rewritten)})`;
  });
}

function formatMarkdownDestination(destination) {
  return /\s/.test(destination) ? `<${destination}>` : destination;
}
