/**
 * Reusable data table controller for client-side and server-side sort/filter.
 *
 * Client-side mode (default):
 *   - All data fetched once, sorting/filtering done in memory
 *   - Used by: inventory, suppliers, users
 *
 * Server-side mode:
 *   - Each filter/sort change triggers a new fetch
 *   - Used by: audit-logs (paginated, unbounded data)
 *
 * Both modes sync URL params via history.pushState for bookmarkability.
 */

let _debounceTimer = null;

/**
 * Debounce a function with a shared timer.
 *
 * @code UTIL-debounce
 * @param {() => void} fn
 * @param {number} ms
 */
function debounce(fn, ms) {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(fn, ms);
}

/**
 * Sync table filter params to the URL.
 *
 * @code UTIL-syncUrlParams
 * @param {Record<string, string>} params
 */
function syncUrlParams(params) {
  const url = new URL(window.location.href);
  const existing = Object.fromEntries(url.searchParams);
  const current = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));

  if (JSON.stringify(existing) === JSON.stringify(current)) {
    return;
  }

  const newUrl = new URL(window.location.pathname, window.location.origin);
  Object.entries(current).forEach(([k, v]) => newUrl.searchParams.set(k, v));
  window.history.pushState({ dt: current }, '', newUrl.toString());
}

/**
 * Read table filter params from the URL.
 *
 * @code UTIL-readUrlParams
 * @returns {Record<string, string>}
 */
function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    search: params.get('search') || '',
    sort: params.get('sort') || '',
    dir: params.get('dir') || '',
    page: params.get('page') || '1',
    action: params.get('action') || '',
    user_id: params.get('user_id') || '',
    date_from: params.get('date_from') || '',
    date_to: params.get('date_to') || '',
    category: params.get('category') || '',
    status: params.get('status') || '',
    type: params.get('type') || '',
    stock_status: params.get('stock_status') || '',
  };
}

/**
 * Render a sort indicator on a column header.
 *
 * @code UTIL-renderSortIndicator
 * @param {HTMLElement} btn
 * @param {boolean} isActive
 * @param {string} direction
 */
export function renderSortIndicator(btn, isActive, direction) {
  const existing = btn.querySelector('[data-sort-icon]');
  if (existing) existing.remove();

  if (!isActive) return;

  const icon = document.createElement('span');
  icon.setAttribute('data-sort-icon', '');
  icon.className = 'text-muted-foreground/80 dark:text-muted-foreground';
  icon.textContent = direction === 'asc' ? '\u2191' : '\u2193';
  btn.appendChild(icon);
}

/**
 * Sort rows for a table column.
 *
 * @code UTIL-applyColumnSort
 * @param {Array<Record<string, unknown>>} data
 * @param {string} key
 * @param {string} direction
 * @returns {Array<Record<string, unknown>>}
 */
function applyColumnSort(data, key, direction) {
  const dir = direction === 'asc' ? 1 : -1;

  return [...data].sort((a, b) => {
    let va = a[key];
    let vb = b[key];

    if (va == null) va = '';
    if (vb == null) vb = '';

    // Skip numeric check for date-like strings (YYYY-MM-DD or with time)
    const isDateLike = /^\d{4}-\d{2}-\d{2}/.test(va) && /^\d{4}-\d{2}-\d{2}/.test(vb);

    if (!isDateLike) {
      const na = parseFloat(va);
      const nb = parseFloat(vb);
      if (!isNaN(na) && !isNaN(nb)) {
        return (na - nb) * dir;
      }
    }

    return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
  });
}

/**
 * Render a Basecoat-styled select.
 *
 * @code UTIL-renderBasecoatSelect
 * @param {object} config
 * @param {string} config.id - Unique ID for the select element
 * @param {string} config.key - Filter key (used as data-filter attribute)
 * @param {string} config.placeholder - Placeholder/default label
 * @param {Array<{value: string, label: string}>} config.options
 * @param {string} [config.value] - Pre-selected value
 * @returns {string}
 */
export function renderBasecoatSelect(config = {}) {
  const { id = '', key = '', placeholder = 'Select...', options = [], value = '' } = config;

  const allOptions = options[0]?.value === '' ? options : [{ value: '', label: placeholder }, ...options];
  const optsHtml = allOptions.map((opt) => {
    const selected = opt.value === value ? ' selected' : '';
    return `<option value="${opt.value}"${selected}>${opt.label}</option>`;
  }).join('');

  return `<select id="${id}" data-filter="${key}" class="select">${optsHtml}</select>`;
}

/**
 * Render the filter bar HTML.
 *
 * @code UTIL-renderFilterBar
 * @param {object} config
 * @param {string} [config.searchPlaceholder]
 * @param {Array<{key: string, label: string, options: Array<{value: string, label: string}>}>} [config.selects]
 * @param {Array<{key: string, label: string, type: 'date'}>} [config.inputs]
 * @param {string} [config.id]
 * @returns {string}
 */
export function renderFilterBar(config = {}) {
  const placeholder = config.searchPlaceholder || 'Search...';
  const selects = config.selects || [];
  const inputs = config.inputs || [];
  const id = config.id || 'filter-bar';

  let html = `<div class="filter-bar" data-filter-bar="${id}">`;
  html += `<div class="flex flex-wrap items-center gap-3 my-4">`;

  html += `
    <div class="relative flex-1 min-w-48 max-w-xs">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="search" data-filter-search class="input pl-9" placeholder="${placeholder}" />
    </div>`;

  selects.forEach((s) => {
    const allOptions = [{ value: '', label: s.label }, ...s.options];
    const optionsHtml = allOptions.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('');
    html += `<select data-filter="${s.key}" class="select w-44">${optionsHtml}</select>`;
  });

  inputs.forEach((inp) => {
    html += `<input type="${inp.type}" data-filter="${inp.key}" class="input w-40 py-2 h-9" placeholder="${inp.label}" />`;
  });

  html += `
    <button type="button" data-filter-clear class="btn-ghost text-sm h-9 px-3 hidden">
      Clear filters
    </button>`;
  html += `</div></div>`;

  return html;
}

/**
 * Reset all select filters in a bar.
 *
 * @param {HTMLElement} bar
 */
/**
 * Reset all select filters in a bar.
 *
 * @code UTIL-resetSelects
 * @param {HTMLElement} bar
 */
function resetSelects(bar) {
  bar.querySelectorAll('select[data-filter]').forEach((s) => { s.value = ''; });
}

/**
 * Create a client-side data table controller.
 *
 * @code UTIL-createClientTable
 * @param {object} config
 * @param {string} config.container - CSS selector for the table body or grid container
 * @param {() => Promise<Array>} config.fetchFn - Function to fetch raw data
 * @param {(data: Array) => string} config.renderFn - Function to render data to HTML
 * @param {Array<{key: string, column: string}>} [config.sortableColumns] - Mapping of column keys to data keys
 * @param {object} [config.filterBar] - Filter bar config for renderFilterBar()
 * @param {(data: Array, filters: object) => Array} [config.filterFn] - Custom filter function
 * @param {() => void} [config.afterRender] - Called after each render (for re-binding event listeners)
 * @param {string} [config.id] - Unique ID for URL sync
 * @returns {object}
 */
export function createClientTable(config) {
  const { container, fetchFn, renderFn, sortableColumns = [], filterBar, filterFn, afterRender, id = 'table' } = config;

  let allData = [];
  let state = {
    search: '',
    sort: '',
    sortKey: '',
    dir: '',
    filters: {},
  };

  /**
   * Get the table container element.
   *
   * @code UTIL-clientGetContainer
   * @returns {HTMLElement | null}
   */
  function getContainer() {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    return el;
  }

  /**
   * Get filtered and sorted data.
   *
   * @code UTIL-clientGetFilteredData
   * @returns {Array<Record<string, unknown>>}
   */
  function getFilteredData() {
    let data = [...allData];

    const filterState = { search: state.search, ...state.filters };

    if (typeof filterFn === 'function') {
      data = filterFn(data, filterState);
    } else if (state.search !== '') {
      const q = state.search.toLowerCase();
      data = data.filter((item) => {
        return Object.values(item).some((v) => {
          if (v == null) return false;
          return String(v).toLowerCase().includes(q);
        });
      });
    }

    if (state.sortKey !== '') {
      data = applyColumnSort(data, state.sortKey, state.dir);
    }

    return data;
  }

  /**
   * Render the client table.
   *
   * @code UTIL-clientRender
   */
  function render() {
    const el = getContainer();
    if (!el) return;

    const filtered = getFilteredData();
    el.innerHTML = renderFn(filtered);
    updateClearButton();
    if (typeof afterRender === 'function') afterRender(filtered);

    const section = el.closest('section') || el.parentElement;
    section?.dispatchEvent(new CustomEvent('table:rendered', {
      detail: {
        id,
        container: el,
      },
    }));
  }

  /**
   * Update visibility of the clear button.
   *
   * @code UTIL-clientUpdateClear
   */
  function updateClearButton() {
    const el = getContainer();
    if (!el) return;
    const section = el.closest('section') || el.parentElement;
    const bar = section?.querySelector(`[data-filter-bar="${id}"]`);
    if (!bar) return;
    const clearBtn = bar.querySelector('[data-filter-clear]');
    if (!clearBtn) return;

    const hasFilters = state.search !== '' || state.sort !== '';
    clearBtn.classList.toggle('hidden', !hasFilters);
  }

  /**
   * Bind search input events.
   *
   * @code UTIL-clientBindSearch
   * @param {HTMLElement} bar
   */
  function bindSearch(bar) {
    const input = bar.querySelector('[data-filter-search]');
    if (!input) return;

    input.value = state.search;
    input.addEventListener('input', () => {
      state.search = input.value;
      syncUrlParams({ search: state.search, sort: state.sort, dir: state.dir });
      debounce(() => render(), 250);
    });
  }

  /**
   * Bind clear button events.
   *
   * @code UTIL-clientBindClear
   * @param {HTMLElement} bar
   */
  function bindClear(bar) {
    const btn = bar.querySelector('[data-filter-clear]');
    if (!btn) return;

    btn.addEventListener('click', () => {
      state.search = '';
      state.sort = '';
      state.sortKey = '';
      state.dir = '';
      state.filters = {};

      const searchInput = bar.querySelector('[data-filter-search]');
      if (searchInput) searchInput.value = '';

      resetSelects(bar);
      bar.querySelectorAll('input[data-filter]').forEach((i) => {
        if (i.type !== 'search') i.value = '';
      });

      const el = getContainer();
      const sec = el?.closest('section') || el?.parentElement;
      sec?.querySelectorAll('th[data-sort] button[data-sort-btn]').forEach((b) => {
        renderSortIndicator(b, false, '');
      });

      syncUrlParams({ search: '', sort: '', dir: '' });
      render();
    });
  }

  /**
   * Load data for the client table.
   *
   * @code UTIL-clientLoad
   * @returns {Promise<void>}
   */
  async function load() {
    try {
      allData = await fetchFn();
      render();
    } catch (error) {
      console.error(`DataTable [${id}] failed to load:`, error);
      const el = getContainer();
      if (el) {
        el.innerHTML = `<tr><td colspan="99" class="py-8 text-center text-destructive">Failed to load data. Please try again.</td></tr>`;
      }
    }
  }

  /**
   * Insert the filter bar UI.
   *
   * @code UTIL-clientInsertFilterBar
   * @param {HTMLElement} section
   * @param {HTMLElement} el
   */
  function insertFilterBar(section, el) {
    const placeholder = section?.querySelector(`[data-filter-bar-placeholder="${id}"]`);
    if (placeholder) {
      placeholder.innerHTML = renderFilterBar({ ...filterBar, id });
      placeholder.removeAttribute('data-filter-bar-placeholder');
      placeholder.removeAttribute('class');
      return;
    }

    const wrapper = el.closest('.overflow-x-auto') || el.closest('table') || el.parentElement;
    if (wrapper) {
      wrapper.insertAdjacentHTML('beforebegin', renderFilterBar({ ...filterBar, id }));
    } else {
      section.insertAdjacentHTML('afterbegin', renderFilterBar({ ...filterBar, id }));
    }
  }

  /**
   * Initialize the client table.
   *
   * @code UTIL-clientInit
   */
  function init() {
    const urlParams = readUrlParams();
    state.search = urlParams.search || '';
    state.sort = urlParams.sort || '';
    state.dir = urlParams.dir || '';
    state.sortKey = urlParams.sort || '';

    // Populate filter values from URL params
    if (filterBar?.selects) {
      filterBar.selects.forEach(s => {
        const key = s.key;
        if (urlParams[key]) {
          state.filters[key] = urlParams[key];
        }
      });
    }

    const el = getContainer();
    if (!el) return;

    const section = el.closest('section') || el.parentElement;

    if (filterBar && section) {
      insertFilterBar(section, el);
    }

    load();

    requestAnimationFrame(() => {
      if (!el) return;

      const sec = el.closest('section') || el.parentElement;
      const bar = sec?.querySelector(`[data-filter-bar="${id}"]`);
      if (bar) {
        bindSearch(bar);
        bindClear(bar);

        bar.querySelectorAll('select[data-filter]').forEach((select) => {
          select.addEventListener('change', () => {
            const key = select.getAttribute('data-filter');
            state.filters[key] = select.value;
            syncUrlParams({ [key]: select.value });
            render();
          });
        });
      }

      sortableColumns.forEach(({ key, column }) => {
        const btn = sec?.querySelector(`button[data-sort-btn="${key}"]`);
        if (!btn) return;

        const isActive = state.sort === key;
        renderSortIndicator(btn, isActive, isActive ? state.dir : '');

        btn.addEventListener('click', (e) => {
          e.stopPropagation();

          if (state.sort === key) {
            state.dir = state.dir === 'asc' ? 'desc' : 'asc';
          } else {
            state.sort = key;
            state.sortKey = column || key;
            state.dir = 'asc';
          }

          sec.querySelectorAll('th[data-sort] button[data-sort-btn]').forEach((other) => {
            if (other !== btn) renderSortIndicator(other, false, '');
          });

          renderSortIndicator(btn, true, state.dir);
          syncUrlParams({ search: state.search, sort: state.sort, dir: state.dir });
          render();
        });
      });
    });
  }

  return { load, refresh: load, render, init, getState: () => ({ ...state }), setData: (d) => { allData = d; render(); } };
}

/**
 * Create a server-side data table controller (for paginated data).
 *
 * @code UTIL-createServerTable
 * @param {object} config
 * @returns {object}
 */
export function createServerTable(config) {
  const { container, fetchFn, renderFn, renderPagination, filterBar, afterRender, id = 'server-table' } = config;

  let state = {
    search: '',
    sort: '',
    dir: '',
    page: 1,
    action: '',
    user_id: '',
    date_from: '',
    date_to: '',
  };

  let filterOptions = { actions: [], users: [] };

  /**
   * Get the server table container element.
   *
   * @code UTIL-serverGetContainer
   * @returns {HTMLElement | null}
   */
  function getContainer() {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    return el;
  }

  /**
   * Load data for the server table.
   *
   * @code UTIL-serverLoad
   * @param {number} [page]
   * @returns {Promise<void>}
   */
  async function load(page) {
    if (page !== undefined) state.page = page;

    const el = getContainer();
    if (!el) return;

    const params = {
      search: state.search,
      sort: state.sort,
      dir: state.dir,
      page: state.page,
      action: state.action,
      user_id: state.user_id,
      date_from: state.date_from,
      date_to: state.date_to,
    };

    try {
      const result = await fetchFn(params);

      if (!result?.success) {
        throw new Error(result?.message || 'Server returned error');
      }

      const logs = result.logs || result.data || [];
      el.innerHTML = renderFn(logs);

      if (typeof afterRender === 'function') afterRender(logs);

      if (result.pagination && renderPagination) {
        const pagEl = document.getElementById('pagination-container');
        if (pagEl) {
          pagEl.innerHTML = renderPagination(result.pagination, 'pagination-container');
          bindPagination(pagEl);
        }
      }

      if (result.filters) {
        filterOptions = result.filters;
        rebuildFilterSelects();
      }

      updateClearButton();
    } catch (error) {
      console.error(`ServerTable [${id}] failed:`, error);
      el.innerHTML = `<tr><td colspan="99" class="py-8 text-center text-destructive">Failed to load data. Please try again.</td></tr>`;
    }
  }

  /**
   * Bind pagination events.
   *
   * @code UTIL-serverBindPagination
   * @param {HTMLElement} pagEl
   */
  function bindPagination(pagEl) {
    pagEl.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-page]');
      if (!button || button.hasAttribute('disabled')) return;
      const page = parseInt(button.getAttribute('data-page'), 10);
      if (page > 0) load(page);
    });
  }

  /**
   * Update visibility of the clear button.
   *
   * @code UTIL-serverUpdateClear
   */
  function updateClearButton() {
    const el = getContainer();
    if (!el) return;
    const section = el.closest('section') || el.parentElement;
    const bar = section?.querySelector(`[data-filter-bar="${id}"]`);
    if (!bar) return;
    const clearBtn = bar.querySelector('[data-filter-clear]');
    if (!clearBtn) return;

    const hasFilters = state.search !== '' || state.sort !== '' || state.action !== '' || state.user_id !== '' || state.date_from !== '' || state.date_to !== '';
    clearBtn.classList.toggle('hidden', !hasFilters);
  }

  /**
   * Rebuild filter select options.
   *
   * @code UTIL-serverRebuildFilters
   */
  function rebuildFilterSelects() {
    const el = getContainer();
    if (!el) return;
    const section = el.closest('section') || el.parentElement;
    const bar = section?.querySelector(`[data-filter-bar="${id}"]`);
    if (!bar) return;

    if (filterOptions.actions && filterOptions.actions.length > 0) {
      const actionSelect = bar.querySelector('select[data-filter="action"]');
      if (actionSelect) {
        const current = actionSelect.value;
        actionSelect.innerHTML = '<option value="">All actions</option>';
        filterOptions.actions.forEach((a) => {
          const opt = document.createElement('option');
          opt.value = a;
          opt.textContent = a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          actionSelect.appendChild(opt);
        });
        actionSelect.value = current;
      }
    }

    if (filterOptions.users && filterOptions.users.length > 0) {
      const userSelect = bar.querySelector('select[data-filter="user_id"]');
      if (userSelect) {
        const current = userSelect.value;
        userSelect.innerHTML = '<option value="">All users</option>';
        filterOptions.users.forEach((u) => {
          const opt = document.createElement('option');
          opt.value = u.user_id;
          opt.textContent = u.name;
          userSelect.appendChild(opt);
        });
        userSelect.value = current;
      }
    }
  }

  /**
   * Bind search input events.
   *
   * @code UTIL-serverBindSearch
   * @param {HTMLElement} bar
   */
  function bindSearch(bar) {
    const input = bar.querySelector('[data-filter-search]');
    if (!input) return;

    input.value = state.search;
    input.addEventListener('input', () => {
      state.search = input.value;
      state.page = 1;
      syncUrlParams({ search: state.search, sort: state.sort, dir: state.dir, action: state.action, user_id: state.user_id });
      debounce(() => load(1), 300);
    });
  }

  /**
   * Bind clear button events.
   *
   * @code UTIL-serverBindClear
   * @param {HTMLElement} bar
   */
  function bindClear(bar) {
    const btn = bar.querySelector('[data-filter-clear]');
    if (!btn) return;

    btn.addEventListener('click', () => {
      state = { search: '', sort: '', dir: '', page: 1, action: '', user_id: '', date_from: '', date_to: '' };

      const searchInput = bar.querySelector('[data-filter-search]');
      if (searchInput) searchInput.value = '';
      resetSelects(bar);
      bar.querySelectorAll('input[data-filter]').forEach((i) => {
        if (i.type !== 'search') i.value = '';
      });

      const el = getContainer();
      const sec = el?.closest('section') || el?.parentElement;
      sec?.querySelectorAll('th[data-sort] button[data-sort-btn]').forEach((b) => renderSortIndicator(b, false, ''));

      syncUrlParams({ search: '', sort: '', dir: '', action: '', user_id: '', date_from: '', date_to: '' });
      load(1);
    });
  }

  /**
   * Insert the filter bar UI.
   *
   * @code UTIL-serverInsertFilterBar
   * @param {HTMLElement} section
   * @param {HTMLElement} el
   */
  function insertFilterBar(section, el) {
    const placeholder = section?.querySelector(`[data-filter-bar-placeholder="${id}"]`);
    if (placeholder) {
      placeholder.innerHTML = renderFilterBar({ ...filterBar, id });
      placeholder.removeAttribute('data-filter-bar-placeholder');
      placeholder.classList.remove('min-h-[4.25rem]');
      return;
    }

    const wrapper = el.closest('.overflow-x-auto') || el.closest('table') || el.parentElement;
    if (wrapper) {
      wrapper.insertAdjacentHTML('beforebegin', renderFilterBar({ ...filterBar, id }));
    } else {
      section.insertAdjacentHTML('afterbegin', renderFilterBar({ ...filterBar, id }));
    }
  }

  /**
   * Initialize the server table.
   *
   * @code UTIL-serverInit
   */
  function init() {
    const urlParams = readUrlParams();
    state.search = urlParams.search || '';
    state.sort = urlParams.sort || '';
    state.dir = urlParams.dir || '';
    state.page = parseInt(urlParams.page, 10) || 1;
    state.action = urlParams.action || '';
    state.user_id = urlParams.user_id || '';
    state.date_from = urlParams.date_from || '';
    state.date_to = urlParams.date_to || '';

    const el = getContainer();
    if (!el) return;

    const section = el.closest('section') || el.parentElement;

    if (filterBar && section) {
      insertFilterBar(section, el);
    }

    load(1);

    requestAnimationFrame(() => {
      const sec = el.closest('section') || el.parentElement;
      const bar = sec?.querySelector(`[data-filter-bar="${id}"]`);
      if (bar) {
        bindSearch(bar);
        bindClear(bar);

        bar.querySelectorAll('select[data-filter]').forEach((select) => {
          select.addEventListener('change', () => {
            const key = select.getAttribute('data-filter');
            state[key] = select.value;
            state.page = 1;
            syncUrlParams({ [key]: select.value, page: 1 });
            load(1);
          });
        });

        bar.querySelectorAll('input[data-filter]').forEach((input) => {
          if (input.type === 'date') {
            input.value = state[input.getAttribute('data-filter')] || '';
            input.addEventListener('change', () => {
              const key = input.getAttribute('data-filter');
              state[key] = input.value;
              state.page = 1;
              load(1);
            });
          }
        });
      }

      const sortKeys = ['created_at', 'action', 'description', 'user_name'];
      sortKeys.forEach((key) => {
        const btn = sec?.querySelector(`button[data-sort-btn="${key}"]`);
        if (!btn) return;

        const isActive = state.sort === key;
        renderSortIndicator(btn, isActive, isActive ? state.dir : '');

        btn.addEventListener('click', (e) => {
          e.stopPropagation();

          if (state.sort === key) {
            state.dir = state.dir === 'asc' ? 'desc' : 'asc';
          } else {
            state.sort = key;
            state.dir = 'asc';
          }

          sec.querySelectorAll('th[data-sort] button[data-sort-btn]').forEach((other) => {
            if (other !== btn) renderSortIndicator(other, false, '');
          });

          renderSortIndicator(btn, true, state.dir);
          state.page = 1;
          syncUrlParams({ search: state.search, sort: state.sort, dir: state.dir });
          load(1);
        });
      });
    });
  }

  return { load, init, getState: () => ({ ...state }) };
}
