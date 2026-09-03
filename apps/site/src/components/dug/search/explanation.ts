type ExplanationNode = {
  value?: unknown;
  description?: unknown;
  details?: unknown;
};

type ScoreLeaf = {
  value: number;
  source: string;
  fieldMatch: string | null;
  termMatch: string | null;
};

export type ExplanationSummaryItem = {
  id: string;
  title: string;
  description: string;
  score: number;
  percentage: number;
  matchedTerms: string[];
  hasParseWarning: boolean;
};

export type ExplanationSummary = {
  totalScore: number;
  items: ExplanationSummaryItem[];
};

const FIELD_PATTERN =
  /^weight\((?<fieldName>[^:]+):(?<searchTerm>.+) in \d+\) \[[^\]]+\], result of:$/;

const FIELD_COPY: Record<string, { title: string; description: string }> = {
  name: {
    title: 'Name',
    description: 'Matches between your query and concept names.',
  },
  description: {
    title: 'Description',
    description: 'Matches between your query and concept descriptions.',
  },
  search_terms: {
    title: 'Synonymous terms',
    description: 'Matches on alternate terms and synonyms for this concept.',
  },
  optional_terms: {
    title: 'Related terms',
    description: 'Matches on terms associated with related concepts.',
  },
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toNodes(value: unknown): ExplanationNode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => Boolean(asObject(item))) as ExplanationNode[];
}

function normalizeTerm(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  return value;
}

function parseLeaf(node: ExplanationNode): ScoreLeaf | null {
  const value = asNumber(node.value);
  if (value <= 0) {
    return null;
  }

  const source = asString(node.description);
  const match = source.match(FIELD_PATTERN);

  if (!match?.groups) {
    return null;
  }

  const rawField = match.groups.fieldName.trim();
  const fieldMatch = rawField.split('.')[0];
  const termMatch = normalizeTerm(match.groups.searchTerm.trim());

  return {
    value,
    source,
    fieldMatch,
    termMatch,
  };
}

function collectKnownLeaves(node: ExplanationNode): ScoreLeaf[] {
  const parsed = parseLeaf(node);
  if (parsed) {
    return [parsed];
  }

  const nested = toNodes(node.details);
  if (nested.length === 0) {
    return [];
  }

  return nested.flatMap((child) => collectKnownLeaves(child));
}

export function summarizeDugExplanation(explanation: unknown): ExplanationSummary {
  const root = asObject(explanation);
  if (!root) {
    return { totalScore: 0, items: [] };
  }

  const rootNode = root as ExplanationNode;
  const allLeaves = collectKnownLeaves(rootNode);
  const fallbackValue = asNumber(rootNode.value);
  if (allLeaves.length === 0 && fallbackValue > 0) {
    allLeaves.push({
      value: fallbackValue,
      source: asString(rootNode.description),
      fieldMatch: null,
      termMatch: null,
    });
  }

  if (allLeaves.length === 0) {
    return { totalScore: 0, items: [] };
  }

  const grouped = allLeaves.reduce<
    Map<
      string,
      {
        score: number;
        matchedTerms: Set<string>;
        hasParseWarning: boolean;
      }
    >
  >((acc, leaf) => {
    const key = leaf.fieldMatch ?? 'unknown';
    const group = acc.get(key) ?? {
      score: 0,
      matchedTerms: new Set<string>(),
      hasParseWarning: false,
    };

    group.score += leaf.value;
    if (leaf.termMatch) {
      group.matchedTerms.add(leaf.termMatch);
    }

    if (!leaf.fieldMatch) {
      group.hasParseWarning = true;
    }

    acc.set(key, group);
    return acc;
  }, new Map());

  const computedTotal = Array.from(grouped.values()).reduce(
    (sum, group) => sum + group.score,
    0,
  );
  const rootTotal = asNumber(rootNode.value);
  const totalScore = rootTotal > 0 ? rootTotal : computedTotal;

  const items = Array.from(grouped.entries())
    .map(([field, group]) => {
      const copy = FIELD_COPY[field] ?? {
        title: 'Other signals',
        description:
          'Additional ranking signals contributed to this concept result.',
      };

      const percentage =
        totalScore > 0
          ? Math.max(0, Math.min(100, Math.round((group.score / totalScore) * 100)))
          : 0;

      return {
        id: field,
        title: copy.title,
        description: copy.description,
        score: group.score,
        percentage,
        matchedTerms: Array.from(group.matchedTerms).sort((a, b) =>
          a.localeCompare(b),
        ),
        hasParseWarning: group.hasParseWarning,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    totalScore,
    items,
  };
}
