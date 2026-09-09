import Button from '@bdc/ui-react/button/Button';
import Card from '@bdc/ui-react/card/Card';
import Icon from '@bdc/ui-react/icon/Icon';
import Link from '@bdc/ui-react/link/Link';
import { useMemo, useState } from 'react';
import {
  type DugCollection,
  DugCollectionContents,
  trackDugNextStepsSelectStep,
  useDugCollection,
} from '../shared';

const STEPS: Array<{
  title: string;
  relevantTypes: Array<keyof DugCollection>;
  why: string;
  description: string;
  resources: Array<{ label: string; href: string }>;
}> = [
  {
    title: 'Check data access',
    relevantTypes: ['studies'],
    why: 'Confirm access requirements before planning analysis work.',
    description:
      'Use your selected studies to confirm whether your team has the right access approvals in dbGaP and BDC workspaces.',
    resources: [
      { label: 'Review data sharing and access', href: '/data/share' },
      { label: 'Get help with access questions', href: '/help/get-help' },
    ],
  },
  {
    title: 'Build a cohort',
    relevantTypes: ['concepts', 'studies', 'variables'],
    why: 'Translate selected Dug concepts into an analysis-ready cohort plan.',
    description:
      'Use selected concepts and variables to define a cohort strategy, then align that strategy with available study datasets.',
    resources: [
      { label: 'Explore studies and communities', href: '/about/studies' },
      { label: 'Refine Dug search terms', href: '/data/explore/dug' },
    ],
  },
  {
    title: 'Begin analyzing',
    relevantTypes: ['studies', 'variables'],
    why: 'Move from planning into secure, reproducible analysis workflows.',
    description:
      'Move selected study and variable context into your analysis planning workflow, then launch work in a BDC workspace.',
    resources: [
      { label: 'Explore analysis options', href: '/data/analyze' },
      { label: 'Learn about costs and funding', href: '/help/costs' },
    ],
  },
];

export default function DugNextStepsApp() {
  const { collection, collectionCount } = useDugCollection();
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedStep = STEPS[activeIndex];

  const selectedData = useMemo(() => {
    return selectedStep.relevantTypes.flatMap((type) =>
      collection[type].map((item) => item.id),
    );
  }, [collection, selectedStep]);

  const getStepData = (step: (typeof STEPS)[number]) =>
    step.relevantTypes.flatMap((type) =>
      collection[type].map((item) => item.id),
    );

  const selectStep = (index: number) => {
    setActiveIndex(index);
    trackDugNextStepsSelectStep({
      stepTitle: STEPS[index].title,
      stepIndex: index,
      location: 'dug-next-steps',
      conceptCount: collection.concepts.length,
      studyCount: collection.studies.length,
      variableCount: collection.variables.length,
    });
  };

  const downloadCollection = () => {
    const blob = new Blob([JSON.stringify(collection, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `BDC-Collection_${new Date().toISOString()}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="grid-row grid-gap-3">
      <section className="desktop:grid-col-8">
        <div className="display-flex flex-justify flex-align-start gap-1 margin-bottom-1">
          <h2 className="font-heading-lg margin-top-0 margin-bottom-0">
            Plan your next action
          </h2>
          <Link to="/data/explore/dug" className="font-body-2xs margin-top-05">
            Return to search
          </Link>
        </div>
        <p className="margin-top-0 margin-bottom-2">
          Choose a decision card to map your saved results to the next BDC step.
        </p>

        <div className="grid-row grid-gap-2">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className={
                index === 2
                  ? 'tablet:grid-col-12 desktop:grid-col-4'
                  : 'tablet:grid-col-6 desktop:grid-col-4'
              }
            >
              <Card
                as="button"
                type="button"
                onClick={() => selectStep(index)}
                aria-pressed={index === activeIndex}
                aria-controls="dug-next-step-details"
                variant="panel"
                className={`cursor-pointer height-full padding-2 border ${
                  index === activeIndex
                    ? 'border-primary bg-primary-lightest shadow-2'
                    : 'border-base-lighter shadow-1 hover:border-primary-lighter'
                }`}
              >
                <h3 className="font-heading-md margin-top-0 margin-bottom-1">
                  {step.title}
                </h3>
                <p>{step.why}</p>
              </Card>
            </div>
          ))}
        </div>

        <Card
          as="article"
          id="dug-next-step-details"
          variant="panel"
          className="margin-top-3 padding-2 border border-base-lighter bg-base-lightest shadow-1"
          aria-live="polite"
        >
          <h3 className="font-heading-lg text-primary-dark margin-top-0">
            {selectedStep.title}
          </h3>
          <p className="margin-top-0 text-bold">{selectedStep.why}</p>
          <p>{selectedStep.description}</p>
          <p className="text-bold margin-bottom-05">Recommended resources</p>
          <ul className="usa-list margin-top-1">
            {selectedStep.resources.map((resource) => (
              <li key={`${selectedStep.title}-${resource.href}`}>
                <a href={resource.href}>{resource.label}</a>
              </li>
            ))}
          </ul>
          <div className="margin-top-2 padding-top-2 border-top border-base-lighter">
            <p className="text-bold margin-bottom-05">Relevant IDs</p>
            {selectedData.length === 0 ? (
              <p className="margin-y-0 text-italic">
                No saved IDs for this step yet.
              </p>
            ) : (
              <ul className="usa-list margin-top-1 margin-bottom-0 add-list-reset">
                {getStepData(selectedStep).map((id) => (
                  <li
                    key={`${selectedStep.title}-${id}`}
                    className="font-mono-sm bg-base-lighter padding-05 radius-md"
                  >
                    {id}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </section>

      <section className="desktop:grid-col-4">
        <div className="border border-base-lighter radius-lg padding-2 bg-white shadow-1">
          <div className="display-flex flex-align-center margin-bottom-1">
            <h2 className="font-heading-md margin-0">Saved Dug Collection</h2>
          </div>
          <p className="margin-top-0 margin-bottom-1 text-center">
            {collectionCount} selected item{collectionCount === 1 ? '' : 's'}{' '}
            from Dug
          </p>

          {collectionCount === 0 ? (
            <div className="border border-base-lighter radius-sm padding-2 bg-base-lightest">
              <Button
                href="/data/explore/dug"
                outline
                className="width-full radius-pill"
              >
                Return to search
              </Button>
            </div>
          ) : (
            <DugCollectionContents collection={collection} />
          )}

          <Button
            type="button"
            outline
            className="margin-top-2 radius-pill width-full"
            onClick={downloadCollection}
            disabled={collectionCount === 0}
          >
            <Icon.FileDownload aria-hidden />
            <span className="margin-left-1">Download collection</span>
          </Button>
        </div>
      </section>
    </div>
  );
}
