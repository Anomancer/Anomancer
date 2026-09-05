const installButtons = [...document.querySelectorAll('[data-install-app]')];
const installDialog = document.querySelector('#installHelpDialog');
const connectionLabels = [...document.querySelectorAll('[data-connection-state]')];
let installPrompt = null;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function updateInstallUi() {
  const installed = isStandalone();
  document.documentElement.classList.toggle('lighthouse-installed', installed);
  for (const button of installButtons) {
    button.hidden = installed;
    button.textContent = installPrompt ? 'Asenna sovellus' : 'Asennusohje';
  }
}

function updateConnectionUi() {
  const online = navigator.onLine;
  document.documentElement.classList.toggle('lighthouse-offline', !online);
  for (const label of connectionLabels) {
    label.textContent = online ? 'Palvelu tavoitettavissa' : 'Ei verkkoyhteyttä';
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
  const hadServiceWorkerController = Boolean(navigator.serviceWorker.controller);
  let controllerReloaded = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadServiceWorkerController || controllerReloaded) return;
    const dirty = Boolean(
      window.anomancerAdminBridge?.hasAnyUnsavedChanges?.() ||
      window.anomancerNarramancer?.hasUnsavedChanges?.() ||
      window.anomancerMancer?.hasUnsavedChanges?.()
    );
    if (dirty) {
      window.anomancerFeedback?.show?.(
        'Uusi sovellusversio on valmis. Tallenna työ ja päivitä sivu.',
        { tone: 'warning', source: 'PWA', timeout: 0 }
      );
      return;
    }
    controllerReloaded = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/lighthouse-sw.js', {
      scope: '/lighthouse',
      updateViaCache: 'none'
    }).then(registration => registration.update()).catch(() => null);
  });
}

updateInstallUi();
updateConnectionUi();
