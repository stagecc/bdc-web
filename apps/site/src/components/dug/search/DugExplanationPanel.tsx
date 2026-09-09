import Card from '@bdc/ui-react/card/Card';
import { useMemo } from 'react';
import {
  type ExplanationSummaryItem,
  summarizeDugExplanation,
} from './explanation';

type Props = {
  explanation: unknown;
};

function termsText(item: ExplanationSummaryItem): string {
  if (item.matchedTerms.length === 0) {
    return 'No direct term matches were parsed for this signal.';
  }

  const shownTerms = item.matchedTerms.slice(0, 4);
  const remainingCount = item.matchedTerms.length - shownTerms.length;

  const list = shownTerms.map((term) => `"${term}"`).join(', ');
  if (remainingCount <= 0) {
    return `Matched terms: ${list}`;
  }

  return `Matched terms: ${list}, +${remainingCount} more`;
}

export default function DugExplanationPanel({ explanation }: Props) {
  const summary = useMemo(
    () => summarizeDugExplanation(explanation),
    [explanation],
  );

  if (summary.items.length === 0) {
    return (
      <div className="padding-x-2 padding-bottom-2 margin-top-1">
        <p className="margin-y-0">
          Dug did not return enough scoring detail for this concept.
        </p>
      </div>
    );
  }

  return (
    <div className="padding-x-2 padding-bottom-2 margin-top-1">
      <p className="margin-top-0">
        Dug ranks concept results using matches in concept names, descriptions,
        and related search terms. The breakdown below shows which signal groups
        contributed most to this result.
      </p>
      <ul className="usa-list usa-list--unstyled margin-top-2 margin-bottom-0 display-flex flex-column gap-2">
        {summary.items.map((item) => (
          <Card
            as="li"
            variant="panel"
            key={item.id}
            className="bg-base-lightest margin-y-1"
          >
            <div className="display-flex flex-justify flex-align-end gap-1">
              <h3 className="font-heading-sm margin-y-0">{item.title}</h3>
              <strong className="font-body-md text-primary-dark">
                {item.percentage}%
              </strong>
            </div>
            <p className="margin-top-05 margin-bottom-1 text-base">
              {item.description}
            </p>
            <div
              className="bg-base-lighter radius-pill"
              aria-hidden="true"
              style={{ height: '0.5rem' }}
            >
              <div
                className="bg-primary radius-pill"
                style={{
                  height: '100%',
                  width: `${item.percentage}%`,
                  minWidth: item.percentage > 0 ? '0.5rem' : undefined,
                }}
              />
            </div>
            <p className="margin-top-1 margin-bottom-0 font-body-xs text-base-dark">
              {termsText(item)}
            </p>
            {item.hasParseWarning && (
              <p className="margin-top-1 margin-bottom-0 font-body-xs text-secondary-dark">
                Some ranking details could not be categorized automatically.
              </p>
            )}
          </Card>
        ))}
      </ul>
      <details className="margin-top-2">
        <summary className="cursor-pointer text-bold font-body-sm">
          View raw scoring details
        </summary>
        <pre className="bg-base-darkest text-base-lightest radius-sm padding-2 overflow-auto font-mono-2xs margin-bottom-0 margin-top-1">
          {JSON.stringify(explanation ?? {}, null, 2)}
        </pre>
      </details>
    </div>
  );
}
