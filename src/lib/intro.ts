const INTRO_PLAYED_KEY = 'lumora-intro-played';

function readItem(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be disabled; the intro simply plays again next time.
  }
}

export function shouldPlayIntro() {
  return readItem(window.sessionStorage, INTRO_PLAYED_KEY) !== '1';
}

export function markIntroPlayed() {
  writeItem(window.sessionStorage, INTRO_PLAYED_KEY, '1');
}

export function entryRedirect(signedIn: boolean, pathname: string, isAdmin = false): string | null {
  if (signedIn && ['/', '/login', '/signup'].includes(pathname)) return isAdmin ? '/admin' : '/dashboard';
  return null;
}
