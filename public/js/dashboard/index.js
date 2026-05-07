import { initStats } from './stats.js';
import { initEfficiencyGauge, initDispatchChart, initDispatchDropdown, reinitCharts } from './charts.js';

/**
 * Initializes the complete dashboard including stats, charts, and event handlers.
 * Loads all data in parallel for optimal performance.
 * @returns {Promise<void>}
 */
export async function initDashboard() {
  await Promise.all([
    initStats(),
    initEfficiencyGauge(),
    initDispatchChart()
  ]);
}

/**
 * Listens for dark mode theme changes and re-renders charts with new colors.
 */
function initThemeListener() {
  document.addEventListener('basecoat:theme', () => {
    setTimeout(() => reinitCharts(), 10);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    initDispatchDropdown();
    initThemeListener();
  });
} else {
  initDashboard();
  initDispatchDropdown();
  initThemeListener();
}