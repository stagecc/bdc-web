import { useEffect, useMemo, useState } from 'react';

const COLLECTION_KEY = 'dug-collection';

type DugCollectionItem = {
  id: string;
  name: string;
};

type DugCollection = {
  concepts: DugCollectionItem[];
  studies: DugCollectionItem[];
  variables: DugCollectionItem[];
};

const EMPTY_COLLECTION: DugCollection = {
  concepts: [],
  studies: [],
  variables: [],
};

const STEPS: Array<{
  title: string;
  relevantTypes: Array<keyof DugCollection>;
  description: string;
}> = [
  {
    title: 'Check your data access',
    relevantTypes: ['studies'],
    description:
      'Use your selected studies to confirm whether your team has the right access approvals in dbGaP and BDC workspaces.',
  },
  {
    title: 'Build a cohort for analysis',
    relevantTypes: ['concepts', 'studies', 'variables'],
    description:
      'Use selected concepts and variables to define a cohort strategy, then align that strategy with available study datasets.',
  },
  {
    title: 'Begin analyzing in BDC',
    relevantTypes: ['studies', 'variables'],
    description:
      'Move selected study and variable context into your analysis planning workflow, then launch work in a BDC workspace.',
  },
];

function loadCollection(): DugCollection {
  try {
    const item = window.localStorage.getItem(COLLECTION_KEY);
    if (!item) {
      return EMPTY_COLLECTION;
    }

    const parsed = JSON.parse(item) as Partial<DugCollection>;
    return {
      concepts: parsed.concepts ?? [],
      studies: parsed.studies ?? [],
      variables: parsed.variables ?? [],
    };
  } catch {
    return EMPTY_COLLECTION;
  }
}

export default function DugNextStepsApp() {
  const [collection, setCollection] = useState<DugCollection>(EMPTY_COLLECTION);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setCollection(loadCollection());
  }, []);

  const selectedStep = STEPS[activeIndex];

  const selectedData = useMemo(() => {
    return selectedStep.relevantTypes.flatMap((type) =>
      collection[type].map((item) => item.id),
    );
  }, [collection, selectedStep]);

  const totalCount =
    collection.concepts.length +
    collection.studies.length +
    collection.variables.length;

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
      <section className="desktop:grid-col-5">
        <div className="border border-base-lighter radius-md padding-2 bg-white">
          <h2 className="font-heading-md margin-top-0">Your collection</h2>
          <p className="margin-top-0">
            {totalCount} selected item{totalCount === 1 ? '' : 's'} from Dug.
          </p>

          <details open>
            <summary className="text-bold">
              Concepts ({collection.concepts.length})
            </summary>
            <ul className="usa-list margin-top-1 margin-bottom-1">
              {collection.concepts.map((item) => (
                <li key={`concept-${item.id}`}>{item.name}</li>
              ))}
              {collection.concepts.length === 0 && <li>None selected.</li>}
            </ul>
          </details>

          <details>
            <summary className="text-bold">
              Studies ({collection.studies.length})
            </summary>
            <ul className="usa-list margin-top-1 margin-bottom-1">
              {collection.studies.map((item) => (
                <li key={`study-${item.id}`}>{item.name}</li>
              ))}
              {collection.studies.length === 0 && <li>None selected.</li>}
            </ul>
          </details>

          <details>
            <summary className="text-bold">
              Variables ({collection.variables.length})
            </summary>
            <ul className="usa-list margin-top-1 margin-bottom-1">
              {collection.variables.map((item) => (
                <li key={`var-${item.id}`}>{item.name}</li>
              ))}
              {collection.variables.length === 0 && <li>None selected.</li>}
            </ul>
          </details>

          <button
            type="button"
            className="usa-button usa-button--outline margin-top-2 width-full"
            onClick={downloadCollection}
            disabled={totalCount === 0}
          >
            Download list
          </button>
          <a
            href="/data/explore/dug"
            className="usa-button width-full margin-top-1"
          >
            Return to search
          </a>
        </div>
      </section>

      <section className="desktop:grid-col-7">
        <div className="border border-base-lighter radius-md padding-2 bg-white">
          <h2 className="font-heading-md margin-top-0">Next steps</h2>
          <p className="margin-top-0">
            Choose an option to focus your saved results on the next action.
          </p>

          <div className="display-flex flex-column gap-1 margin-bottom-2">
            {STEPS.map((step, index) => (
              <button
                key={step.title}
                type="button"
                className={`usa-button text-left ${
                  index === activeIndex ? '' : 'usa-button--outline'
                }`}
                onClick={() => setActiveIndex(index)}
              >
                {step.title}
              </button>
            ))}
          </div>

          <div className="border border-base-lighter radius-sm padding-2 bg-base-lightest">
            <h3 className="font-heading-sm margin-top-0">
              {selectedStep.title}
            </h3>
            <p>{selectedStep.description}</p>
            <p className="text-bold margin-bottom-05">Relevant IDs</p>
            {selectedData.length === 0 ? (
              <p className="margin-y-0 text-italic">
                No saved IDs for this step yet.
              </p>
            ) : (
              <ul className="usa-list margin-top-1 margin-bottom-0">
                {selectedData.map((id) => (
                  <li key={`${selectedStep.title}-${id}`}>{id}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
