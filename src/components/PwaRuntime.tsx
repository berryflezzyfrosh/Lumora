import { useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff } from 'lucide-react';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function PwaRuntime() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
        .then((nextRegistration) => {
          setRegistration(nextRegistration);
          const watchUpdate = () => {
            const worker = nextRegistration.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateReady(true);
              }
            });
          };
          nextRegistration.addEventListener('updatefound', watchUpdate);
          if (nextRegistration.waiting && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        })
        .catch((error: unknown) => {
          console.error('[pwa.serviceWorker.register]', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const applyUpdate = () => {
    const waitingWorker = registration?.waiting;
    if (!waitingWorker) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {offline && (
        <div role="status" className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-panel px-4 py-2 text-xs font-medium text-ink shadow-lg">
          <WifiOff className="h-4 w-4 text-brand-text" />
          Offline mode
        </div>
      )}
      {updateReady && (
        <button type="button" onClick={applyUpdate} className="btn-secondary inline-flex items-center gap-2 shadow-lg">
          <RefreshCw className="h-4 w-4" />
          Update LUMORA
        </button>
      )}
      {installPrompt && (
        <button type="button" onClick={() => void install()} className="btn-primary inline-flex items-center gap-2 shadow-lg">
          <Download className="h-4 w-4" />
          Install LUMORA
        </button>
      )}
    </div>
  );
}
