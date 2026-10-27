(() => {
  const theme = document.getElementById('theme-toggle');
  const copy = document.getElementById('copy-citation');
  const citation = document.getElementById('bibtex');
  const status = document.getElementById('citation-status');

  theme.addEventListener('click', () => {
    const light = document.documentElement.dataset.theme !== 'light';
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    theme.setAttribute('aria-pressed', String(light));
    theme.textContent = light ? 'Dark slate' : 'Light paper';
  });

  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(citation.textContent);
      status.textContent = 'Citation copied.';
    } catch {
      status.textContent = 'Select the citation text or download the BibTeX file.';
    }
  });
})();
