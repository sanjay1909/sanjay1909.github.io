const button = document.getElementById('fullscreen');
const status = document.getElementById('status');

if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
  button.hidden = false;
  button.addEventListener('click', async () => {
    status.textContent = '';
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      status.textContent = 'Full screen is unavailable here. Use your browser’s full-screen control instead.';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    button.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
  });
}
