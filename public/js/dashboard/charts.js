import Chart from 'chart.js/auto';
import { getEfficiency, getDispatchHistory } from './api.js';

let efficiencyChart = null;
let dispatchChart = null;

/**
 * Refreshes CSS-derived colors (call after theme change).
 * @returns {Object<string, string>} Updated color palette
 */
export function refreshChartColors() {
  return {
    primary: getCssVar('--primary'),
    success: getCssVar('--chart-2'),
    warning: getCssVar('--chart-1'),
    danger: getCssVar('--destructive'),
    muted: getCssVar('--muted-foreground'),
    text: getCssVar('--foreground'),
    border: getCssVar('--border'),
  };
}

/**
 * Destroys existing charts to prepare for re-initialization.
 */
export function destroyCharts() {
  if (efficiencyChart) {
    efficiencyChart.destroy();
    efficiencyChart = null;
  }
  if (dispatchChart) {
    dispatchChart.destroy();
    dispatchChart = null;
  }
}

/**
 * Re-initializes all charts with fresh colors after theme change.
 * @returns {Promise<void>}
 */
export async function reinitCharts() {
  destroyCharts();
  await Promise.all([
    initEfficiencyGauge(),
    initDispatchChart()
  ]);
}

/**
 * Retrieves a CSS custom property value from the document root.
 * @param {string} name - CSS variable name (e.g., '--primary')
 * @returns {string} The CSS variable value
 */
function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Gets fresh CSS-derived colors - called at render time to support theme changes.
 * @returns {Object<string, string>} Color palette object
 */
function getChartColors() {
  return {
    primary: getCssVar('--primary'),
    success: getCssVar('--chart-2'),
    warning: getCssVar('--chart-1'),
    danger: getCssVar('--destructive'),
    muted: getCssVar('--muted-foreground'),
    text: getCssVar('--foreground'),
    border: getCssVar('--border'),
  };
}

/**
 * Displays a loading placeholder message on a canvas element.
 * @param {string} canvasId - The ID of the canvas element
 * @param {string} [message='Loading...'] - Message to display
 */
function showPlaceholder(canvasId, message = 'Loading...') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const colors = getChartColors();
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.muted;
  ctx.font = '14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

/**
 * Calculates the stocks efficiency rate as a percentage.
 * @param {number} dispatched - Total quantity dispatched
 * @param {number} received - Total quantity received
 * @returns {number} Efficiency percentage (0-100)
 */
function calculateEfficiency(dispatched, received) {
  if (received === 0) return 0;
  return Math.min(100, Math.round((dispatched / received) * 100));
}

/**
 * Initializes the doughnut gauge chart showing stocks efficiency rate.
 * Renders a half-doughnut with color coding based on efficiency thresholds:
 * - >= 70%: green (success)
 * - 40-69%: orange (warning)
 * - < 40%: red (danger)
 * @returns {Promise<void>}
 */
export async function initEfficiencyGauge() {
  const canvas = document.getElementById('efficiency-gauge');
  if (!canvas) return;

  showPlaceholder('efficiency-gauge', 'Loading efficiency...');

  try {
    const data = await getEfficiency();
    const efficiency = calculateEfficiency(data.dispatched, data.received);
    const colors = getChartColors();

    const ctx = canvas.getContext('2d');

    efficiencyChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Efficiency', 'Remaining'],
        datasets: [{
          data: [efficiency, 100 - efficiency],
          backgroundColor: [
            efficiency >= 70 ? colors.success : efficiency >= 40 ? colors.warning : colors.danger,
            colors.border
          ],
          borderWidth: 0,
          cutout: '75%'
        }]
      },
      options: {
        responsive: true,
        aspectRatio: 1,
        circumference: 180,
        rotation: -90,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        }
      },
      plugins: [{
        id: 'efficiency-label',
        beforeDraw(chart) {
          const { ctx, width, height } = chart;
          ctx.save();
          ctx.font = 'bold 32px system-ui';
          ctx.fillStyle = colors.text;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${efficiency}%`, width / 2, height / 2 - 10);
          ctx.font = '12px system-ui';
          ctx.fillStyle = colors.muted;
          ctx.fillText('Efficiency', width / 2, height / 2 + 15);
          ctx.restore();
        }
      }]
    });
  } catch (err) {
    console.error('Failed to load efficiency:', err);
    showPlaceholder('efficiency-gauge', 'Failed to load');
  }
}

/**
 * Fetches dispatch history data for a given time range.
 * @param {string} [range='month'] - Time range: 'today', 'week', 'month', '3months', 'year'
 * @returns {Promise<{labels: string[], values: number[]}>} Chart-ready data
 */
export async function loadDispatchData(range = 'month') {
  const response = await getDispatchHistory(range);
  const data = response.data || [];

  const labels = data.map(d => d.date);
  const values = data.map(d => d.total_quantity);

  return { labels, values };
}

/**
 * Initializes the bar chart showing product dispatch history over time.
 * Uses the selected time range from the dropdown, defaults to 'month'.
 * @returns {Promise<void>}
 */
export async function initDispatchChart() {
  const canvas = document.getElementById('dispatch-chart');
  const select = document.getElementById('dispatch-range');
  if (!canvas) return;

  showPlaceholder('dispatch-chart', 'Loading dispatch history...');

  try {
    const range = select?.value || 'month';
    const { labels, values } = await loadDispatchData(range);
    const colors = getChartColors();

    const ctx = canvas.getContext('2d');

    dispatchChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Quantity Dispatched',
          data: values,
          backgroundColor: colors.primary,
          borderRadius: 4,
          barPercentage: 0.8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.text,
            padding: 12,
            cornerRadius: 6,
            callbacks: {
              label(ctx) {
                return `${ctx.parsed.y.toLocaleString()} units`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.muted, font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: colors.border },
            ticks: {
              color: colors.muted,
              callback(val) { return val.toLocaleString(); }
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to load dispatch:', err);
    showPlaceholder('dispatch-chart', 'Failed to load');
  }
}

/**
 * Initializes the dropdown event handler for switching dispatch history time ranges.
 * When the user changes the dropdown, the bar chart updates with new data.
 */
export function initDispatchDropdown() {
  const select = document.getElementById('dispatch-range');
  if (!select) return;

  select.addEventListener('change', async () => {
    if (!dispatchChart) return;

    const range = select.value;
    showPlaceholder('dispatch-chart', 'Loading...');

    try {
      const { labels, values } = await loadDispatchData(range);
      dispatchChart.data.labels = labels;
      dispatchChart.data.datasets[0].data = values;
      dispatchChart.update();
    } catch (err) {
      console.error('Failed to update chart:', err);
    }
  });
}