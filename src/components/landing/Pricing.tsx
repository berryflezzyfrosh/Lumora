import { Check } from 'lucide-react';
import { navigate } from '@/lib/router';
import { useAuth } from '@/lib/auth';

const freeFeatures = [
  '1GB cloud storage',
  'Basic video and photo editing',
  'Limited AI features',
  'Community access',
  'Free templates',
  'Standard export options',
];

const proFeatures = [
  'Unlimited cloud storage (fair use)',
  'Advanced AI tools and motion mimic',
  'Advanced masking and premium effects',
  'Premium transitions and templates',
  'Priority processing where available',
  'Higher export options and 4K',
];

export default function Pricing() {
  const { user } = useAuth();

  return (
    <section id="pricing" className="border-y border-surface-border bg-surface-subtle py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">Subscription plans</p>
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-5xl">Start free, go Pro when you need more</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-muted">
            Every account begins on the free plan with no card required.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-surface-border bg-surface-panel p-8">
            <h3 className="text-xl font-semibold text-ink">Free</h3>
            <p className="mt-2 text-sm text-ink-muted">Everything you need to learn and publish.</p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-ink">$0</span>
              <span className="text-sm text-ink-muted">/ forever</span>
            </p>
            <ul className="mt-8 flex-1 space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              className="btn-secondary mt-8 w-full"
            >
              {user ? 'Go to dashboard' : 'Create free account'}
            </button>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-3xl border border-brand-400/60 bg-surface-panel p-8 shadow-[0_30px_80px_-30px_rgba(128,0,255,0.7)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
            <span className="absolute right-6 top-6 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-semibold text-white">
              Most powerful
            </span>
            <h3 className="relative text-xl font-semibold text-ink">LUMORA Pro</h3>
            <p className="relative mt-2 text-sm text-ink-muted">Advanced AI and unlimited room to create.</p>
            <p className="relative mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-ink">Coming soon</span>
            </p>
            <ul className="relative mt-8 flex-1 space-y-3">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" />
                  {feature}
                </li>
              ))}
            </ul>
            <button type="button" disabled className="btn-primary relative mt-8 w-full">
              Upgrade to Pro
            </button>
            <p className="relative mt-3 text-center text-xs text-ink-muted">Secure payments are not yet available.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
