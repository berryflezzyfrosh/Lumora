import { useEffect, useState, type MouseEvent } from 'react';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import Logo from '@/components/Logo';
import { Link, navigate, usePathname } from '@/lib/router';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';

const sectionLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Templates', href: '#templates' },
  { label: 'Community', href: '#community' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const goToSection = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false);
    if (pathname !== '/') return;
    event.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isLanding = pathname === '/';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || !isLanding
          ? 'border-b border-surface-border bg-surface-base/85 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo size="sm" />

        {isLanding && (
          <ul className="hidden items-center gap-1 lg:flex">
            {sectionLinks.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={goToSection(item.href)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition duration-200 hover:bg-surface-subtle hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-surface-panel text-ink transition duration-300 hover:-translate-y-0.5 hover:border-brand-400"
          >
            <span className="transition duration-500 group-hover:rotate-12">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </span>
          </button>

          {!loading && user ? (
            <Link to="/dashboard" className="btn-primary hidden !px-5 !py-2.5 sm:inline-flex">
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink transition hover:text-brand-text sm:inline-flex">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary hidden !px-5 !py-2.5 sm:inline-flex">
                Sign up
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-surface-panel text-ink lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      <div
        className={`overflow-hidden border-t border-surface-border bg-surface-base transition-all duration-300 lg:hidden ${
          menuOpen ? 'max-h-[28rem] opacity-100' : 'max-h-0 border-transparent opacity-0'
        }`}
      >
        <div className="flex flex-col gap-1 px-4 py-4">
          {isLanding &&
            sectionLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={goToSection(item.href)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-surface-subtle"
              >
                {item.label}
              </a>
            ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {user ? (
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-primary col-span-2 !py-3">
                Open dashboard
              </button>
            ) : (
              <>
                <button type="button" onClick={() => navigate('/login')} className="btn-secondary !py-3">
                  Log in
                </button>
                <button type="button" onClick={() => navigate('/signup')} className="btn-primary !py-3">
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
