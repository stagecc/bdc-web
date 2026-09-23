export function assertOverviewHeadingPreserved(
  sourceHtml,
  outputMarkdown,
  pageRef,
) {
  if (!hasExactOverviewHeading(sourceHtml)) return;
  if (hasExactOverviewHeading(outputMarkdown)) return;

  throw new Error(
    `Overview heading was present in source but missing in output for ${pageRef}`,
  );
}

function hasExactOverviewHeading(value) {
  return (
    hasExactOverviewHtmlHeading(value) || hasExactOverviewMarkdownHeading(value)
  );
}

function hasExactOverviewHtmlHeading(value) {
  const matches = value.match(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi) ?? [];

  for (const match of matches) {
    const text = match
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    if (text === 'overview') return true;
  }

  return false;
}

function hasExactOverviewMarkdownHeading(value) {
  return (
    /^\s{0,3}#{1,6}\s+overview\s*$/im.test(value) ||
    /^\s*overview\s*\n[=-]{3,}\s*$/im.test(value)
  );
}
