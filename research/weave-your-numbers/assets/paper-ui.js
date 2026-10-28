(() => {
  const theme = document.getElementById('theme-toggle');
  theme.addEventListener('click', () => {
    const light = document.documentElement.dataset.theme !== 'light';
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    theme.setAttribute('aria-pressed', String(light));
    theme.textContent = light ? 'Dark slate' : 'Light paper';
  });
  document.getElementById('copy-citation').addEventListener('click', async () => {
    const status = document.getElementById('citation-status');
    try {
      await navigator.clipboard.writeText(document.getElementById('bibtex').textContent);
      status.textContent = 'Citation copied.';
    } catch {
      status.textContent = 'Select the citation text or download the BibTeX file.';
    }
  });
})();
