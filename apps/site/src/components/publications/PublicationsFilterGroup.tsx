import Button from '@bdc/ui-react/button/Button';
import InfoTooltip from '@bdc/ui-react/tooltip/InfoTooltip';
import { useState } from 'react';

type Props = {
  legend: string;
  options: Map<string, number>;
  selected: string[];
  collapsible?: boolean;
  idNamespace?: string;
  onToggle: (value: string) => void;
  threshold?: number;
  tooltips?: Record<string, string>;
};

export default function PublicationsFilterGroup({
  legend,
  options,
  selected,
  collapsible = false,
  idNamespace = '',
  onToggle,
  threshold = 5,
  tooltips = {},
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(
    !collapsible || selected.length > 0,
  );

  if (options.size === 0) return null;

  const entries = [...options.entries()];
  const hiddenCount = entries.filter(
    ([value], idx) => idx >= threshold && !selected.includes(value),
  ).length;
  const needsTruncation = hiddenCount > 0;
  const visibleEntries = showAll
    ? entries
    : entries.filter(
        ([value], idx) => idx < threshold || selected.includes(value),
      );
  const groupId = `${idNamespace}filter-group-${legend.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section
      className="padding-y-2 border-bottom-1px border-base-lighter"
      aria-labelledby={groupId}
    >
      <div className="display-flex flex-justify flex-align-center margin-x-3">
        <h3 id={groupId} className="usa-legend text-bold margin-y-0">
          {legend}
        </h3>
        {collapsible && (
          <Button
            type="button"
            unstyled
            className="usa-button usa-button--unstyled font-body-xs"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-controls={`${groupId}-content`}
          >
            {isExpanded ? 'Hide' : 'Show'}
            {selected.length > 0 ? ` (${selected.length})` : ''}
          </Button>
        )}
      </div>

      <div id={`${groupId}-content`} hidden={!isExpanded}>
        {visibleEntries.map(([value, count]) => {
          const id = `${idNamespace}filter-${legend.toLowerCase().replace(/\s+/g, '-')}-${value.toLowerCase().replace(/\s+/g, '-')}`;
          const tooltipText = tooltips[value];
          const isDisabled = count === 0 && !selected.includes(value);

          return (
            <div key={value} className="usa-checkbox margin-x-3">
              <input
                className="usa-checkbox__input"
                type="checkbox"
                id={id}
                name={`${idNamespace}filter-${legend.toLowerCase().replace(/\s+/g, '-')}`}
                value={value}
                checked={selected.includes(value)}
                onChange={() => onToggle(value)}
                disabled={isDisabled}
              />
              <label
                className={`usa-checkbox__label${isDisabled ? ' text-base-light' : ''} font-ui-xs`}
                htmlFor={id}
              >
                {value}
                {tooltipText && <InfoTooltip text={tooltipText} />}
                <span className="text-base-light"> ({count})</span>
              </label>
            </div>
          );
        })}
        {needsTruncation && (
          <Button
            type="button"
            unstyled
            className="usa-button usa-button--unstyled font-body-xs margin-top-2 margin-x-3"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? 'Show less' : `Show ${hiddenCount} more`}
          </Button>
        )}
      </div>
    </section>
  );
}
