const installButtons = [...document.querySelectorAll('[data-install-app]')];
const installDialog = document.querySelector('#installHelpDialog');
const connectionLabels = [...document.querySelectorAll('[data-connection-state]')];
let installPrompt = null;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function updateInstallUi() {
  const installed = isStandalone();
  document.documentElement.classList.toggle('lahetyskone-installed', installed);
  for (const button of installButtons) {
    button.hidden = installed;
    button.textContent = installPrompt ? 'Asenna sovellus' : 'Asennusohje';
  }
}

function updateConnectionUi() {
  const online = navigator.onLine;
  document.documentElement.classList.toggle('lahetyskone-offline', !online);
  for (const label of connectionLabels) {
    label.textContent = online ? 'Yhteys valmis' : 'Ei verkkoyhteyttä';
    label.dataset.state = online ? 'online' : 'offline';
  }
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  updateInstallUi();
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  updateInstallUi();
});

for (const button of installButtons) {
  button.addEventListener('click', async () => {
    if (!installPrompt) {
      installDialog?.showModal();
      return;
    }
    const prompt = installPrompt;
    installPrompt = null;
    await prompt.prompt();
    await prompt.userChoice.catch(() => null);
    updateInstallUi();
  });
}

document.querySelector('#installHelpClose')?.addEventListener('click', () => installDialog?.close());
window.addEventListener('online', updateConnectionUi);
window.addEventListener('offline', updateConnectionUi);
window.matchMedia('(display-mode: standalone)').addEventListener?.('change', updateInstallUi);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/lahetyskone-sw.js', { scope: '/lahetyskone' }).catch(() => null);
  });
}

updateInstallUi();
updateConnectionUi();
