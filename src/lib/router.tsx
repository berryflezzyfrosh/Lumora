import { useCallback, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

const NAVIGATE_EVENT = 'lumora:navigate';
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

function routePath(pathname: string) {
  if (!BASE_PATH) return pathname || '/';
  if (pathname === BASE_PATH || pathname === `${BASE_PATH}/`) return '/';
  return pathname.startsWith(`${BASE_PATH}/`) ? pathname.slice(BASE_PATH.length) : pathname;
}

function appPath(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${normalizedPath}` || '/';
}

export function appUrl(path: string) {
  return `${window.location.origin}${appPath(path)}`;
}

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

function getPathname() {
  return routePath(window.location.pathname);
}

export function usePathname() {
  return useSyncExternalStore(subscribe, getPathname, () => '/');
}

export function navigate(path: string, options: { replace?: boolean } = {}) {
  const destination = appPath(path);
  if (window.location.pathname === destination) return;
  if (options.replace) {
    window.history.replaceState(null, '', destination);
  } else {
    window.history.pushState(null, '', destination);
  }
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export function Link({ to, onClick, ...rest }: LinkProps) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      navigate(to);
    },
    [onClick, to],
  );

  return <a href={appPath(to)} onClick={handleClick} {...rest} />;
}
