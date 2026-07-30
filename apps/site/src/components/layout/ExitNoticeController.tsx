import {
  closeDataAttributeModal,
  openDataAttributeModal,
} from '@bdc/ui-react/modal/useDataAttributeModalController';
import { Button } from '@trussworks/react-uswds';
import { useEffect, useState } from 'react';
import { shouldRequireExitNotice } from './externalNotice';

const EXIT_NOTICE_MODAL_ID = 'external-link-exit-notice';

export function ExitNoticeController() {
  const [pendingExternalHref, setPendingExternalHref] = useState<string | null>(
    null,
  );
  const [pendingExternalTarget, setPendingExternalTarget] = useState<
    string | null
  >(null);

  useEffect(() => {
    const handleExternalNotice = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const target = event.target;
      const targetElement =
        target instanceof Element
          ? target
          : target instanceof Node
            ? target.parentElement
            : null;
      if (!targetElement) return;

      const anchor = targetElement.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const needsNotice = shouldRequireExitNotice(
        anchor,
        window.location.origin,
      );
      if (!needsNotice) return;

      event.preventDefault();

      setPendingExternalHref(anchor.href);
      setPendingExternalTarget(anchor.getAttribute('target'));
      openDataAttributeModal(EXIT_NOTICE_MODAL_ID, anchor);
    };

    document.addEventListener('click', handleExternalNotice, true);
    return () =>
      document.removeEventListener('click', handleExternalNotice, true);
  }, []);

  const continueToExternalSite = () => {
    if (!pendingExternalHref) return;

    if (pendingExternalTarget === '_blank') {
      window.open(pendingExternalHref, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(pendingExternalHref);
    }

    setPendingExternalHref(null);
    setPendingExternalTarget(null);
    closeDataAttributeModal(EXIT_NOTICE_MODAL_ID);
  };

  const cancelExternalNavigation = () => {
    setPendingExternalHref(null);
    setPendingExternalTarget(null);
    closeDataAttributeModal(EXIT_NOTICE_MODAL_ID);
  };

  return (
    <div
      className="usa-modal-wrapper is-hidden"
      id={EXIT_NOTICE_MODAL_ID}
      data-modal
      data-modal-force-action="true"
      aria-hidden="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="external-link-exit-notice-heading"
      aria-describedby="external-link-exit-notice-description"
    >
      <div className="usa-modal-overlay" tabIndex={-1}>
        <div className="usa-modal usa-modal--sm">
          <div className="usa-modal__content">
            <div className="usa-modal__main">
              <h2
                id="external-link-exit-notice-heading"
                className="usa-modal__heading"
              >
                Leaving NHLBI BioData Catalyst<sup>&reg;</sup>
              </h2>
              <p
                id="external-link-exit-notice-description"
                className="margin-top-2"
              >
                You are leaving the BDC website and going to a website that is not operated by the federal government.              </p>
              <p>
                Links to non-federal websites are provided for your convenience. Their inclusion does not constitute an endorsement by the federal government of the organization, its products or services, or the information found on the site.              </p>
              <p>
                You will be subject to the destination&apos;s privacy policy
                after leaving BDC.
              </p>
              <p>
                The destination website is not subject to the same federal information quality, privacy, security, or accessibility policies as this website.              </p>
              <p className="text-bold margin-bottom-3">
                Do you want to continue?
              </p>
              <div className="display-flex flex-wrap gap-2">
                <Button type="button" onClick={continueToExternalSite}>
                  Continue
                </Button>
                <Button
                  type="button"
                  outline
                  onClick={cancelExternalNavigation}
                >
                  Stay on this site
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
