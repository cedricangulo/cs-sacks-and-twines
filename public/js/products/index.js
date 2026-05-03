import { readUrlParams, syncUrlParams, applyFiltersAndSort, renderFilteredGrid, updateClearButton, renderFilterBar, getSelectValue, bindFilterBar, initProductsPage } from './events.js';
import { initDispatchButton } from './submit.js';

initProductsPage();
initDispatchButton();