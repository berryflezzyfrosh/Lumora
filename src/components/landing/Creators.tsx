import { BadgeCheck, Share2, TrendingUp } from 'lucide-react';
import { IMAGES } from '@/lib/images';

const highlights = [
  {
    icon: Share2,
    title: 'Publish your templates',
    description: 'Package your edits as templates other creators can open, customise and use in their own projects.',
  },
  {
    icon: BadgeCheck,
    title: 'Get proper attribution',
    description: 'Every template and post carries your name and profile, so your work always leads back to you.',
  },
  {
    icon: TrendingUp,
    title: 'Grow your audience',
    description: 'Discover trending edits, follow creators you admire and build a following around your style.',
  },
];

const portraits = IMAGES.creators;

export default function Creators() {
  return (
    <section id="creators" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">Creator highlights</p>
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-5xl">Built for creators who ship work</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-muted">
            LUMORA is where your edits get seen, your templates get used and your audience finds you.
          </p>

          <ul className="mt-10 space-y-6">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-text ring-1 ring-brand-400/30">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {portraits.map((src, index) => (
            <div
              key={src}
              className={`relative aspect-[3/4] overflow-hidden rounded-3xl border border-surface-border shadow-xl transition duration-700 hover:-translate-y-2 ${
                index === 1 ? 'mt-10' : ''
              }`}
            >
              <img src={src} alt="Creator filming content" loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
