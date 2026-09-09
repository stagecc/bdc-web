import { useEffect, useRef, useState } from 'react';
import type { DugConcept, DugStudy } from '../api';
import { fetchStudies } from '../api';

type DetailTab = 'studies' | 'explanation';

export function useDugDetailPanel(query: string) {
  const [selectedResult, setSelectedResult] = useState<DugConcept | null>(null);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('studies');
  const [studies, setStudies] = useState<DugStudy[]>([]);
  const [studiesLoading, setStudiesLoading] = useState(false);
  const [studiesError, setStudiesError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalPanelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedResult) {
      return;
    }

    const controller = new AbortController();

    setActiveDetailTab('studies');
    setStudies([]);
    setStudiesError(null);
    setStudiesLoading(true);

    fetchStudies(selectedResult.id, query, controller.signal)
      .then((data) => setStudies(data))
      .catch((nextError: unknown) => {
        if ((nextError as Error).name === 'AbortError') {
          return;
        }

        setStudiesError('Unable to load related studies.');
      })
      .finally(() => setStudiesLoading(false));

    return () => controller.abort();
  }, [query, selectedResult]);

  useEffect(() => {
    if (!selectedResult) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedResult(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedResult]);

  useEffect(() => {
    if (!selectedResult) {
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      lastFocusedElementRef.current = document.activeElement;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleTabTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalPanelRef.current) {
        return;
      }

      const focusable = Array.from(
        modalPanelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 20);

    document.addEventListener('keydown', handleTabTrap);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleTabTrap);
      document.body.style.overflow = previousOverflow;
      lastFocusedElementRef.current?.focus();
    };
  }, [selectedResult]);

  const openDetailPanel = (result: DugConcept) => {
    setIsDetailClosing(false);
    setSelectedResult(result);
  };

  const closeDetailPanel = () => {
    if (!selectedResult || isDetailClosing) {
      return;
    }

    setIsDetailClosing(true);
  };

  const handleDetailPanelExited = () => {
    if (!isDetailClosing) {
      return;
    }

    setSelectedResult(null);
    setIsDetailClosing(false);
  };

  return {
    selectedResult,
    isDetailClosing,
    openDetailPanel,
    activeDetailTab,
    setActiveDetailTab,
    studies,
    studiesLoading,
    studiesError,
    modalPanelRef,
    closeButtonRef,
    closeDetailPanel,
    handleDetailPanelExited,
  };
}
