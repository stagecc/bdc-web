import Button from '@bdc/ui-react/button/Button';
import IconButton from '@bdc/ui-react/button/IconButton';
import Icon from '@bdc/ui-react/icon/Icon';
import { useState } from 'react';
import { type DugCollection, DugCollectionContents } from '../shared';

type Props = {
  collection: DugCollection;
  collectionCount: number;
  onDownloadCollection: () => void;
  onRemoveCollectionItem: (type: keyof DugCollection, id: string) => void;
  onClearCollection: () => void;
  onCheckoutCollection: () => void;
};

export default function DugCollectionPanel({
  collection,
  collectionCount,
  onDownloadCollection,
  onRemoveCollectionItem,
  onClearCollection,
  onCheckoutCollection,
}: Props) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="border border-base-lighter radius-lg padding-2 bg-white shadow-1">
      <div className="display-flex flex-justify flex-align-center gap-1 margin-bottom-1">
        <h2 className="font-heading-md margin-0">Saved for Next Steps</h2>
        <div className="display-flex flex-align-center margin-top-05">
          <IconButton
            icon="HelpOutline"
            tone={showHelp ? 'secondary' : 'neutral'}
            onClick={() => setShowHelp((value) => !value)}
            aria-expanded={showHelp}
            aria-controls="dug-collection-help"
            label={showHelp ? 'Hide collection help' : 'Show collection help'}
          />
        </div>
      </div>

      {showHelp && (
        <div
          id="dug-collection-help"
          className="border border-primary-lighter radius-md bg-primary-lightest padding-1 margin-y-2"
        >
          <p className="margin-top-0 margin-bottom-05 text-bold font-body-sm">
            How this works
          </p>
          <p className="margin-bottom-1 font-body-xs">
            Use bookmark buttons{' '}
            <Icon.Bookmark aria-hidden className="text-primary-dark" /> in
            search results and concept details to save concepts, studies, and
            variables here.
          </p>
          <p className="margin-y-0 font-body-xs">
            Then choose <span className="text-bold">Plan Next Steps</span> for
            guidance on access and analysis.
          </p>
        </div>
      )}

      <p className="margin-top-0 margin-bottom-1 text-center">
        {collectionCount} selected item{collectionCount === 1 ? '' : 's'} from
        Dug
      </p>

      <DugCollectionContents
        collection={collection}
        onRemoveCollectionItem={onRemoveCollectionItem}
      />

      <div className="display-flex flex-column margin-top-4">
        <Button
          href="/data/explore/dug/next-steps"
          className="margin-bottom-1 radius-pill"
          onClick={onCheckoutCollection}
        >
          <Icon.NavigateFarNext aria-hidden />
          <span className="margin-left-1">Plan next steps</span>
        </Button>
        <Button
          type="button"
          outline
          className="margin-bottom-1 radius-pill"
          onClick={onDownloadCollection}
          disabled={collectionCount === 0}
        >
          <Icon.FileDownload aria-hidden />
          <span className="margin-left-1">Download collection</span>
        </Button>
        {collectionCount > 0 && (
          <button
            type="button"
            className="usa-button usa-button--unstyled font-body-xs flex-justify-end margin-top-2"
            onClick={onClearCollection}
          >
            Clear collection
          </button>
        )}
      </div>
    </div>
  );
}
