(function () {
  'use strict';

  function blockIfMatches(event) {
    const key = String(event.key || '').toLowerCase();
    const ctrl = event.ctrlKey || false;
    const shift = event.shiftKey || false;

    const blocked =
      key === 'f12' ||
      (ctrl && shift && (key === 'i' || key === 'j' || key === 'c')) ||
      (ctrl && key === 'u');

    if (blocked) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  document.addEventListener('keydown', blockIfMatches, true);
})();
