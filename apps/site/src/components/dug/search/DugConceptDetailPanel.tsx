import IconButton from '@bdc/ui-react/button/IconButton';
import type { RefObject } from 'react';
import type { DugConcept, DugStudy, DugVariable } from './api';
import DugExplanationPanel from './DugExplanationPanel';
import styles from './DugSearchApp.module.scss';

type DetailTab = 'studies' | 'explanation';

type Props = {
  selectedResult: DugConcept | null;
  isClosing: boolean;
  onClose: () => void;
  onExited: () => void;
  modalPanelRef: RefObject<HTMLDivElement | null>;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  activeDetailTab: DetailTab;
  onChangeDetailTab: (tab: DetailTab) => void;
  studiesLoading: boolean;
  studiesError: string | null;
  studies: DugStudy[];
  onToggleStudy: (study: DugStudy) => void;
  studyInCollection: (studyId: string) => boolean;
  onToggleVariable: (variable: DugVariable) => void;
  variableInCollection: (variableId: string) => boolean;
};

export default function DugConceptDetailPanel({
  selectedResult,
  isClosing,
  onClose,
  onExited,
  modalPanelRef,
  closeButtonRef,
  activeDetailTab,
  onChangeDetailTab,
  studiesLoading,
  studiesError,
  studies,
  onToggleStudy,
  studyInCollection,
  onToggleVariable,
  variableInCollection,
}: Props) {
  if (!selectedResult) {
    return null;
  }

  return (
    <div
      className={`${styles.detailOverlayAnim} ${
        isClosing ? styles.detailOverlayClosing : ''
      } position-fixed top-0 right-0 bottom-0 left-0 z-top display-flex flex-align-end flex-justify-center padding-0 desktop:flex-align-stretch desktop:flex-justify-end desktop:padding-y-2 desktop:padding-left-2 desktop:padding-right-0`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dug-modal-title"
    >
      <button
        type="button"
        className="position-absolute top-0 right-0 bottom-0 left-0 bg-black opacity-70"
        onClick={onClose}
        aria-label="Close detail dialog"
      />
      <div
        className={`${styles.modalPanel} ${styles.detailPanelSurface} ${
          isClosing ? styles.detailPanelClosing : ''
        } position-relative overflow-auto bg-white shadow-5`}
        ref={modalPanelRef}
        tabIndex={-1}
        role="document"
        onAnimationEnd={(event) => {
          if (isClosing && event.currentTarget === event.target) {
            onExited();
          }
        }}
      >
        <div className="position-sticky top-0 display-flex flex-justify flex-align-start padding-2 bg-base-lightest border-bottom border-base-lighter">
          <div className="flex-1">
            <h2
              id="dug-modal-title"
              className="margin-top-0 margin-bottom-05 line-height-sans-2"
            >
              {selectedResult.name}
            </h2>
            <p className="margin-y-0 text-base-dark font-mono-2xs">
              {selectedResult.id}
            </p>
          </div>
          <button
            type="button"
            className="usa-button usa-button--unstyled text-bold"
            onClick={onClose}
            ref={closeButtonRef}
          >
            Close
          </button>
        </div>

        <div className="padding-x-2 padding-top-1">
          <p className="margin-top-0">
            {selectedResult.description || 'No description available.'}
          </p>
        </div>

        <div className="display-flex flex-wrap padding-x-2 padding-bottom-2">
          <button
            type="button"
            className={`usa-button margin-right-1 margin-bottom-1 ${
              activeDetailTab === 'studies' ? '' : 'usa-button--outline'
            }`}
            onClick={() => onChangeDetailTab('studies')}
            aria-pressed={activeDetailTab === 'studies'}
          >
            Studies ({studiesLoading ? '...' : studies.length})
          </button>
          <button
            type="button"
            className={`usa-button margin-bottom-1 ${
              activeDetailTab === 'explanation' ? '' : 'usa-button--outline'
            }`}
            onClick={() => onChangeDetailTab('explanation')}
            aria-pressed={activeDetailTab === 'explanation'}
          >
            Explanation
          </button>
        </div>

        {activeDetailTab === 'studies' && (
          <div className="padding-x-2 padding-bottom-2">
            {studiesLoading && (
              <p className="margin-y-0">Loading related studies...</p>
            )}
            {studiesError && (
              <p className="text-secondary-dark margin-y-0">{studiesError}</p>
            )}
            {!studiesLoading && !studiesError && studies.length === 0 && (
              <p className="margin-y-0">
                No associated studies were found for this concept.
              </p>
            )}
            {!studiesLoading && !studiesError && studies.length > 0 && (
              <div className="display-flex flex-column gap-1">
                {studies.map((study) => (
                  <details
                    key={`${study.source}-${study.c_id}`}
                    className="border border-base-lighter radius-sm padding-1 cursor-pointer bg-base-lightest"
                  >
                    <summary className="text-bold line-height-sans-3">
                      {study.c_name}
                    </summary>
                    <div className="display-flex flex-justify flex-align-center margin-top-1 margin-bottom-1 gap-1">
                      <p className="margin-y-0">
                        Study ID:{' '}
                        <a
                          href={study.c_link}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {study.c_id}
                        </a>{' '}
                        <span className="text-base-dark">- {study.source}</span>
                      </p>
                      <IconButton
                        icon="Bookmark"
                        tone={
                          studyInCollection(study.c_id)
                            ? 'secondary'
                            : 'neutral'
                        }
                        onClick={() => onToggleStudy(study)}
                        aria-pressed={studyInCollection(study.c_id)}
                        label={
                          studyInCollection(study.c_id)
                            ? `Remove ${study.c_name} study`
                            : `Add ${study.c_name} study`
                        }
                        srText={
                          studyInCollection(study.c_id)
                            ? 'Remove study'
                            : 'Add study'
                        }
                      />
                    </div>
                    <ul className="usa-list margin-top-0 margin-bottom-0">
                      {study.elements.map((variable) => (
                        <li key={`${study.c_id}-${variable.id}`}>
                          <span className="text-bold">
                            {variable.name || variable.id}
                          </span>
                          <span className="text-base-dark">
                            {' '}
                            ({variable.id})
                          </span>
                          <IconButton
                            className="margin-left-1"
                            small
                            icon="Bookmark"
                            tone={
                              variableInCollection(variable.id)
                                ? 'secondary'
                                : 'neutral'
                            }
                            onClick={() => onToggleVariable(variable)}
                            aria-pressed={variableInCollection(variable.id)}
                            label={
                              variableInCollection(variable.id)
                                ? `Remove ${variable.name || variable.id} variable`
                                : `Add ${variable.name || variable.id} variable`
                            }
                            srText={
                              variableInCollection(variable.id)
                                ? 'Remove variable'
                                : 'Add variable'
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'explanation' && (
          <DugExplanationPanel explanation={selectedResult.explanation} />
        )}
      </div>
    </div>
  );
}
