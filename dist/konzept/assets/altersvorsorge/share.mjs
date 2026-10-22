// Share only the public calculator entry, never form values or arbitrary URL parameters.
export function calculatorShareUrl(href) {
  const url = new URL(href);
  const audience = url.searchParams.get('zielgruppe') === 'fahrschulen' ? 'fahrschulen' : 'fahrschueler';
  url.search = '';
  url.hash = '';
  url.searchParams.set('zielgruppe', audience);
  return url.href;
}
export async function shareCalculator(nav, url) {
  if (typeof nav.share === 'function') {
    try {
      await nav.share({title: 'LANE SWITCH – Förderrechner Altersvorsorge 2027', url});
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    if (typeof nav.clipboard?.writeText !== 'function') return 'manual';
    await nav.clipboard.writeText(url);
    return 'copied';
  } catch { return 'manual'; }
}
export function setupShare(doc, nav, href) {
  const button = doc.getElementById('share-calculator');
  const status = doc.getElementById('share-status');
  const fallback = doc.getElementById('share-fallback');
  const field = doc.getElementById('share-url');
  const url = calculatorShareUrl(href);
  field.value = url;
  button.hidden = false;
  button.addEventListener('click', async () => {
    button.disabled = true;
    status.textContent = '';
    fallback.hidden = true;
    const outcome = await shareCalculator(nav, url);
    button.disabled = false;
    status.textContent = {shared: 'Teilen abgeschlossen.', cancelled: '', copied: 'Link kopiert. Er kann jetzt weitergegeben werden.', manual: 'Bitte den markierten Link kopieren und weitergeben.'}[outcome];
    if (outcome === 'manual') {
      fallback.hidden = false;
      field.focus();
      field.select();
    }
  });
}
