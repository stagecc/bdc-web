import { useEffect, useRef } from 'react';

const MODAL_OPEN_EVENT = 'bdc:modal-open';
const MODAL_CLOSE_EVENT = 'bdc:modal-close';

type ModalOpenDetail = {
  modalId: string;
  opener?: HTMLElement | null;
};

type ModalCloseDetail = {
  modalId?: string;
};

export function openDataAttributeModal(
  modalId: string,
  opener?: HTMLElement | null,
) {
  document.dispatchEvent(
    new CustomEvent<ModalOpenDetail>(MODAL_OPEN_EVENT, {
      detail: { modalId, opener },
    }),
  );
}

export function closeDataAttributeModal(modalId?: string) {
  document.dispatchEvent(
    new CustomEvent<ModalCloseDetail>(MODAL_CLOSE_EVENT, {
      detail: { modalId },
    }),
  );
}

interface UseDataAttributeModalControllerOptions {
  /**
   * Selector for modal wrapper elements. Default expects `[data-modal][id]`.
   */
  modalSelector?: string;
  /**
   * Selector for elements that open modals. Each trigger must include
   * `data-modal-open="<modal-id>"`.
   */
  openTriggerSelector?: string;
  /**
   * Selector for elements that close modals. Triggers can be inside a modal,
   * or provide `data-modal-close="<modal-id>"` for explicit targeting.
   */
  closeTriggerSelector?: string;
  /**
   * Selector used to detect overlay clicks for dismissing the modal.
   */
  overlaySelector?: string;
  /**
   * Class applied to `document.body` while any modal is open.
   */
  bodyActiveClass?: string;
  /**
   * Extra document-level event names that should close the current modal.
   * Useful for router/navigation lifecycle events.
   */
  closeOnEventNames?: string[];
}

const DEFAULT_MODAL_SELECTOR = '[data-modal][id]';
const DEFAULT_OPEN_TRIGGER_SELECTOR = '[data-modal-open]';
const DEFAULT_CLOSE_TRIGGER_SELECTOR = '[data-modal-close]';
const DEFAULT_OVERLAY_SELECTOR = '.usa-modal-overlay';
const DEFAULT_BODY_ACTIVE_CLASS = 'usa-js-modal--active';

function getFocusableCloseTarget(
  modal: HTMLElement,
  closeTriggerSelector: string,
) {
  return modal.querySelector<HTMLElement>(closeTriggerSelector);
}

function toAutoplaySrc(src: string) {
  if (!src) return src;

  try {
    const url = new URL(src);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('rel', '0');
    return url.toString();
  } catch {
    return `${src}${src.includes('?') ? '&' : '?'}autoplay=1`;
  }
}

function setModalVisibility(modal: HTMLElement, isOpen: boolean) {
  modal.classList.toggle('is-hidden', !isOpen);
  modal.classList.toggle('is-visible', isOpen);
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function updateModalMedia(modal: HTMLElement, isOpen: boolean) {
  if (modal.dataset.modalAutoplayMedia !== 'true') return;

  const iframes = modal.querySelectorAll<HTMLIFrameElement>('iframe[src]');

  for (const iframe of iframes) {
    const currentSrc = iframe.getAttribute('src') ?? '';
    const originalSrc = iframe.dataset.modalOriginalSrc ?? currentSrc;
    iframe.dataset.modalOriginalSrc = originalSrc;
    iframe.setAttribute(
      'src',
      isOpen ? toAutoplaySrc(originalSrc) : originalSrc,
    );
  }
}

function shouldKeepBodyModalClass(modalSelector: string) {
  return Boolean(document.querySelector(`${modalSelector}.is-visible`));
}

function isForceActionModal(modal: HTMLElement | null) {
  return modal?.dataset.modalForceAction === 'true';
}

export function useDataAttributeModalController({
  modalSelector = DEFAULT_MODAL_SELECTOR,
  openTriggerSelector = DEFAULT_OPEN_TRIGGER_SELECTOR,
  closeTriggerSelector = DEFAULT_CLOSE_TRIGGER_SELECTOR,
  overlaySelector = DEFAULT_OVERLAY_SELECTOR,
  bodyActiveClass = DEFAULT_BODY_ACTIVE_CLASS,
  closeOnEventNames = [],
}: UseDataAttributeModalControllerOptions = {}) {
  /**
   * Usage contract:
   * - Modal wrapper: `<div id="example-modal" data-modal ...>`
   * - Open trigger: `<button data-modal-open="example-modal">Open</button>`
   * - Close trigger: `<button data-modal-close>Close</button>`
   *
   * Optional media behavior:
   * - Add `data-modal-autoplay-media="true"` on the modal wrapper to toggle
   *   iframe autoplay on open and restore original src on close.
   *
   * Optional force-action behavior:
   * - Add `data-modal-force-action="true"` on the modal wrapper to disable
   *   Escape key and overlay-click dismissal.
   *
   * Optional imperative controls:
   * - `openDataAttributeModal(modalId, opener?)`
   * - `closeDataAttributeModal(modalId?)`
   */
  const activeModalRef = useRef<HTMLElement | null>(null);
  const activeOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const openModal = (modal: HTMLElement, opener: HTMLElement | null) => {
      activeModalRef.current = modal;
      activeOpenerRef.current = opener;
      setModalVisibility(modal, true);
      updateModalMedia(modal, true);
      document.body.classList.add(bodyActiveClass);
      getFocusableCloseTarget(modal, closeTriggerSelector)?.focus();
    };

    const closeModal = (modal: HTMLElement | null) => {
      if (!modal) return;

      setModalVisibility(modal, false);
      updateModalMedia(modal, false);

      if (!shouldKeepBodyModalClass(modalSelector)) {
        document.body.classList.remove(bodyActiveClass);
      }

      if (activeOpenerRef.current) {
        activeOpenerRef.current.focus();
      }

      if (activeModalRef.current === modal) {
        activeModalRef.current = null;
        activeOpenerRef.current = null;
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const openTrigger = target.closest<HTMLElement>(openTriggerSelector);
      if (openTrigger) {
        const modalId = openTrigger.dataset.modalOpen;
        if (!modalId) return;

        const modal = document.getElementById(modalId);
        if (!modal || !modal.matches(modalSelector)) return;

        event.preventDefault();
        openModal(modal, openTrigger);
        return;
      }

      const closeTrigger = target.closest<HTMLElement>(closeTriggerSelector);
      if (closeTrigger) {
        const explicitModalId = closeTrigger.dataset.modalClose;
        const parentModal = closeTrigger.closest<HTMLElement>(modalSelector);
        const explicitModal = explicitModalId
          ? document.getElementById(explicitModalId)
          : null;
        const modal =
          explicitModal instanceof HTMLElement ? explicitModal : parentModal;

        if (!modal) return;

        event.preventDefault();
        closeModal(modal);
        return;
      }

      const overlay = target.closest<HTMLElement>(overlaySelector);
      const modal = overlay?.closest<HTMLElement>(modalSelector);

      if (
        overlay &&
        modal &&
        target === overlay &&
        !isForceActionModal(modal)
      ) {
        event.preventDefault();
        closeModal(modal);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isForceActionModal(activeModalRef.current)) return;
      closeModal(activeModalRef.current);
    };

    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ModalOpenDetail>;
      const modalId = customEvent.detail?.modalId;
      if (!modalId) return;

      const modal = document.getElementById(modalId);
      if (!modal || !modal.matches(modalSelector)) return;

      const opener = customEvent.detail?.opener;
      openModal(modal, opener ?? null);
    };

    const handleCloseEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ModalCloseDetail>;
      const modalId = customEvent.detail?.modalId;

      if (modalId) {
        const modal = document.getElementById(modalId);
        if (!modal || !modal.matches(modalSelector)) return;
        closeModal(modal);
        return;
      }

      closeModal(activeModalRef.current);
    };

    const handleExternalCloseEvent = () => {
      closeModal(activeModalRef.current);
    };

    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener(
      MODAL_OPEN_EVENT,
      handleOpenEvent as EventListener,
    );
    document.addEventListener(
      MODAL_CLOSE_EVENT,
      handleCloseEvent as EventListener,
    );

    for (const eventName of closeOnEventNames) {
      document.addEventListener(eventName, handleExternalCloseEvent);
    }

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener(
        MODAL_OPEN_EVENT,
        handleOpenEvent as EventListener,
      );
      document.removeEventListener(
        MODAL_CLOSE_EVENT,
        handleCloseEvent as EventListener,
      );

      for (const eventName of closeOnEventNames) {
        document.removeEventListener(eventName, handleExternalCloseEvent);
      }

      document.body.classList.remove(bodyActiveClass);
    };
  }, [
    bodyActiveClass,
    closeOnEventNames,
    closeTriggerSelector,
    modalSelector,
    openTriggerSelector,
    overlaySelector,
  ]);
}
