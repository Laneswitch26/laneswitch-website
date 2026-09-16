(() => {
  const checks = [...document.querySelectorAll('[data-accident-step]')];
  const bar = document.querySelector('[data-accident-progress]');
  const text = document.querySelector('[data-accident-progress-text]');
  const reset = document.querySelector('[data-accident-reset]');

  const update = () => {
    const completed = checks.filter((item) => item.checked).length;
    const percentage = checks.length ? Math.round((completed / checks.length) * 100) : 0;
    if (bar) bar.style.width = percentage + '%';
    if (text) text.textContent = completed + ' von ' + checks.length;
  };

  checks.forEach((item) => item.addEventListener('change', update));
  reset?.addEventListener('click', () => {
    checks.forEach((item) => { item.checked = false; });
    update();
    checks[0]?.focus();
  });
  update();
})();
