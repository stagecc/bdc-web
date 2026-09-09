import type { DugCollection } from './collection';

type Props = {
  collection: DugCollection;
  onRemoveCollectionItem?: (type: keyof DugCollection, id: string) => void;
};

type CollectionSection = {
  key: keyof DugCollection;
  label: string;
  items: DugCollection[keyof DugCollection];
};

export default function DugCollectionContents({
  collection,
  onRemoveCollectionItem,
}: Props) {
  const sections: CollectionSection[] = [
    { key: 'concepts', label: 'Concepts', items: collection.concepts },
    { key: 'studies', label: 'Studies', items: collection.studies },
    { key: 'variables', label: 'Variables', items: collection.variables },
  ];

  return (
    <>
      {sections.map((section, index) => (
        <details
          key={section.key}
          open={index === 0}
          className="border border-base-lighter radius-md bg-base-lightest padding-x-1 padding-y-105 margin-bottom-1"
        >
          <summary className="text-bold cursor-pointer radius-sm padding-x-05">
            {section.label} ({section.items.length})
          </summary>
          <ul className="usa-list padding-left-05 margin-y-05 margin-x-05">
            {section.items.map((item) => (
              <li
                key={`${section.key}-${item.id}`}
                className="display-flex flex-justify flex-align-center padding-left-0 margin-y-05"
              >
                <span className="flex-1">{item.name}</span>
                {onRemoveCollectionItem && (
                  <button
                    type="button"
                    className="usa-button usa-button--unstyled font-body-2xs text-secondary-dark text-no-wrap"
                    onClick={() => onRemoveCollectionItem(section.key, item.id)}
                    aria-label={`Remove ${item.name} from ${section.key} collection`}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
            {section.items.length === 0 && (
              <li className="usa-list--unstyled text-base-dark">
                None selected.
              </li>
            )}
          </ul>
        </details>
      ))}
    </>
  );
}
