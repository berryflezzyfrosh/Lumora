import Logo from '@/components/Logo';
import { Link } from '@/lib/router';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Studio', to: '/dashboard' },
      { label: 'Templates', to: '#templates' },
      { label: 'AI Tools', to: '#ai-tools' },
      { label: 'Pricing', to: '#pricing' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Creators', to: '#creators' },
      { label: 'Showcase', to: '#community' },
      { label: 'FAQ', to: '#faq' },
    ],
  },
];

function FooterLink({ to, label }: { to: string; label: string }) {
  const className = 'text-sm text-ink-muted transition hover:text-brand-text';
  if (to.startsWith('#')) {
    return (
      <a href={to} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface-subtle">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-5">
            <Logo size="sm" />
            <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
              LUMORA — Create Beyond Imagination. Professional editing, AI-powered creation and a community
              of creators, in one place.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-sm font-semibold text-ink">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink to={link.to} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-surface-border pt-8 text-sm text-ink-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} LUMORA. All rights reserved.</p>
          <p>Create Beyond Imagination.</p>
        </div>
      </div>
    </footer>
  );
}
