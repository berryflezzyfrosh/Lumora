import { ArrowUpRight, Lock } from 'lucide-react';
import { navigate } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { IMAGES } from '@/lib/images';

type Template = {
  title: string;
  category: string;
  duration: string;
  image: string;
  premium: boolean;
};

const templates: Template[] = [
  {
    title: 'Neon City Intro',
    category: 'Motion Graphics',
    duration: '0:12',
    image: IMAGES.templates.neonCityIntro,
    premium: false,
  },
  {
    title: 'Cinematic Teal and Orange',
    category: 'Cinematic Edits',
    duration: '0:30',
    image: IMAGES.templates.cinematicGrade,
    premium: true,
  },
  {
    title: 'Glowing Tube Lower Third',
    category: 'Typography',
    duration: '0:08',
    image: IMAGES.templates.glowingTubeLowerThird,
    premium: false,
  },
  {
    title: 'Fluid Velocity Reel',
    category: 'Visual Effects',
    duration: '0:20',
    image: IMAGES.templates.fluidVelocityReel,
    premium: true,
  },
];

const categories = ['Video Editing', 'Motion Graphics', 'Photography', 'Cinematic Edits', 'Typography', 'Visual Effects'];

export default function Templates() {
  const { user } = useAuth();

  return (
    <section id="templates" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">Popular templates</p>
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-5xl">Start from a finished look</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-muted">
            Open a template in the studio, swap in your own footage or photographs, and export.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category}
              className="rounded-full border border-surface-border bg-surface-panel px-3.5 py-1.5 text-xs font-medium text-ink-muted"
            >
              {category}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((template) => (
          <button
            key={template.title}
            type="button"
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
            className="group relative overflow-hidden rounded-3xl border border-surface-border bg-surface-panel text-left transition duration-500 hover:-translate-y-1.5 hover:border-brand-400/60 hover:shadow-[0_30px_60px_-30px_rgba(128,0,255,0.7)]"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={template.image}
                alt={template.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    template.premium ? 'bg-accent-500 text-black' : 'bg-success-500 text-white'
                  }`}
                >
                  {template.premium && <Lock className="h-3 w-3" />}
                  {template.premium ? 'Pro' : 'Free'}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">{template.category}</p>
                  <h3 className="mt-1 text-base font-semibold text-white">{template.title}</h3>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black opacity-0 transition duration-500 group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-xs text-ink-muted">
              <span>By LUMORA Studio</span>
              <span>{template.duration}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
