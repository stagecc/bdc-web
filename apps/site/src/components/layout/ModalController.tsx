import { useDataAttributeModalController } from '@bdc/ui-react/modal/useDataAttributeModalController';

const CLOSE_ON_EVENT_NAMES = ['astro:after-swap'];

export function ModalController() {
  // Site adapter for the shared modal hook.
  // Close active modals during Astro view transitions to avoid stale overlays.
  useDataAttributeModalController({
    closeOnEventNames: CLOSE_ON_EVENT_NAMES,
  });

  return null;
}
