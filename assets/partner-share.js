(() => {
  const dialog = document.querySelector('#partner-share-dialog');
  if (!dialog) return;
  const title = dialog.querySelector('h2').textContent.trim();
  const url = document.querySelector('link[rel="canonical"]').href;
  const text = dialog.querySelector('[data-partner-share-preview]').textContent.trim();
  const message = text + '\n\n' + url;
  const status = dialog.querySelector('[data-partner-share-status]');
  const share = dialog.querySelector('[data-partner-share]');
  const copy = dialog.querySelector('[data-partner-share-copy]');
  let opener;

  dialog.querySelector('[data-partner-share-whatsapp]').href = 'https://wa.me/?text=' + encodeURIComponent(message);
  dialog.querySelector('[data-partner-share-email]').href = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(message);
  document.querySelectorAll('[data-partner-share-open]').forEach((button) => {
    button.addEventListener('click', () => {
      opener = button;
      status.textContent = 'Wähle selbst, an wen du die Empfehlung senden möchtest.';
      dialog.showModal();
    });
  });
  dialog.querySelector('[data-partner-share-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => opener?.focus());

  const copyText = async (value, success) => {
    try {
      await navigator.clipboard.writeText(value);
      status.textContent = success;
    } catch (_) {
      status.textContent = 'Kopieren ist hier nicht verfügbar. Nutze WhatsApp oder E-Mail.';
    }
  };
  share.addEventListener('click', async () => {
    if (!navigator.share) {
      await copyText(message, 'Empfehlung und Link kopiert. Du kannst sie jetzt einfügen.');
      return;
    }
    try {
      await navigator.share({ title, text, url });
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = 'Teilen ist hier nicht verfügbar. Nutze WhatsApp, E-Mail oder kopiere den Link.';
    }
  });
  copy.addEventListener('click', () => copyText(url, 'Link kopiert. Du kannst ihn jetzt einfügen.'));
})();
