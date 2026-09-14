type UswdsTable = {
  on: (root?: HTMLElement) => void;
  off: (root?: HTMLElement) => void;
};

type WindowWithUswdsInit = Window & {
  bdcUswdsListenersReady?: boolean;
};

const SORTABLE_TABLE_SELECTOR = 'table[data-bdc-sortable]';
const SORTABLE_HEADER_SELECTOR = 'thead th';
const SORTABLE_COLUMNS_ATTR = 'data-bdc-sortable-columns';

function getSortableHeaders(table: HTMLTableElement): HTMLTableCellElement[] {
  const headers = Array.from(
    table.querySelectorAll<HTMLTableCellElement>(SORTABLE_HEADER_SELECTOR),
  );
  const sortableColumnIds = table.getAttribute(SORTABLE_COLUMNS_ATTR)?.trim();

  if (!sortableColumnIds) {
    return headers;
  }

  const columnIdSet = new Set(sortableColumnIds.split(/\s+/));

  return headers.filter((header) => {
    const columnId =
      header.id ||
      header.getAttribute('data-column-id') ||
      header.getAttribute('data-col-id');
    return Boolean(columnId && columnIdSet.has(columnId));
  });
}

let tableModulePromise: Promise<UswdsTable> | null = null;

function ensureSortableHeaderAttributes(root: ParentNode): void {
  const sortableTables = root.querySelectorAll<HTMLTableElement>(
    SORTABLE_TABLE_SELECTOR,
  );

  for (const table of sortableTables) {
    const headers = table.querySelectorAll<HTMLTableCellElement>(
      SORTABLE_HEADER_SELECTOR,
    );
    const sortableHeaders = new Set(getSortableHeaders(table));

    for (const header of headers) {
      if (sortableHeaders.has(header)) {
        header.setAttribute('data-sortable', '');
        header.setAttribute('role', 'columnheader');
      } else {
        header.removeAttribute('data-sortable');
      }
    }
  }
}

async function getTableModule(): Promise<UswdsTable> {
  if (!tableModulePromise) {
    tableModulePromise = import('@uswds/uswds/js/usa-table').then(
      (module) => module.default as UswdsTable,
    );
  }
  return tableModulePromise;
}

async function initSortableTables(): Promise<void> {
  const root = document.body;
  if (!root.querySelector(SORTABLE_TABLE_SELECTOR)) {
    return;
  }

  ensureSortableHeaderAttributes(root);
  const table = await getTableModule();
  table.off(root);
  table.on(root);
}

export function initUswds(): void {
  void initSortableTables();
}

const globalWindow = window as WindowWithUswdsInit;

if (!globalWindow.bdcUswdsListenersReady) {
  globalWindow.bdcUswdsListenersReady = true;
  document.addEventListener('astro:after-swap', initUswds);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUswds, { once: true });
} else {
  initUswds();
}
