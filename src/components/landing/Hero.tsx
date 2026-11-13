import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Link, navigate } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { IMAGES } from '@/lib/images';

const highlights = ['Multi-track timeline', 'Photo and motion studio', 'Creator community'];

export default function Hero() {
  const { user } = useAuth();

  const startEditing = () => navigate(user ? '/dashboard' : '/signup');

  return (
    <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-28">
      <div className="absolute inset-0 -z-10">
        <img
          src={IMAGES.hero}
          alt=""
          className="h-full w-full object-cover opacity-30 dark:opacity-25"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-base/20 via-surface-base/75 to-surface-base" />
        <div className="surface-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/30 blur-[120px] animate-glow-pulse" />

      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-panel/70 px-4 py-1.5 text-xs font-semibold text-ink backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-brand-text" />
Video, photo and motion in one workspace
        </div>

        <h1
          className="animate-fade-up mt-8 max-w-4xl text-4xl font-bold text-ink [animation-delay:120ms] sm:text-6xl lg:text-7xl"
        >
          Everything You Need to Create{' '}
          <span className="text-gradient-brand">Without Limits.</span>
        </h1>

        <p className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-ink-muted [animation-delay:240ms] sm:text-lg">
          Edit videos, create stunning visuals, animate images and bring your imagination to life with LUMORA's
          powerful creative tools and AI technology.
        </p>

        <div className="animate-fade-up mt-10 flex w-full flex-col items-stretch justify-center gap-3 [animation-delay:360ms] sm:w-auto sm:flex-row sm:items-center">
          <button type="button" onClick={startEditing} className="btn-primary !px-8 !py-4 text-base tracking-wide">
            START CREATING FOR FREE
            <ArrowRight className="h-5 w-5" />
          </button>
          <a href="#templates" className="btn-secondary !px-8 !py-4 text-base">
            <Play className="h-4 w-4 fill-current" />
            Explore templates
          </a>
        </div>

        <div className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted [animation-delay:440ms]">
          {highlights.map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              {item}
            </span>
          ))}
        </div>

        {!user && (
          <p className="animate-fade-up mt-10 text-sm text-ink-muted [animation-delay:520ms]">
            Already a creator?{' '}
            <Link to="/login" className="font-semibold text-brand-text hover:underline">
              Log in to your workspace
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
