import { useEffect, useState } from 'react';
import { LrOrbitLogo } from '@/components/brand/LrOrbitLogo';
import './splash.css';

const SPLASH_MIN_MS = 4000;
const REDUCED_MOTION_MS = 700;
const EXIT_MS = 600;

type SplashScreenProps = {
  ready: boolean;
  onComplete: () => void;
};

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function SplashScreen({ ready, onComplete }: SplashScreenProps) {
  const [reduced] = useState(prefersReducedMotion);
  const [minElapsed, setMinElapsed] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinElapsed(true), reduced ? REDUCED_MOTION_MS : SPLASH_MIN_MS);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') setSkipped(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const shouldExit = skipped || (minElapsed && ready);

  useEffect(() => {
    if (!shouldExit) return;
    if (reduced) {
      onComplete();
      return;
    }
    setExiting(true);
    const timer = window.setTimeout(onComplete, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [shouldExit, reduced, onComplete]);

  return (
    <div
      role="status"
      aria-label="Opening LUMORA"
      className={`splash-screen fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden text-white ${
        exiting ? 'splash-exit' : ''
      } ${reduced ? 'splash-reduced' : ''}`}
    >
      <div className="splash-backdrop pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="splash-grid absolute inset-0" />
        <div className="splash-orb splash-orb-one absolute" />
        <div className="splash-orb splash-orb-two absolute" />
      </div>

      <div className="splash-topline absolute inset-x-0 top-0 flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55 sm:text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-300 shadow-[0_0_12px_rgba(179,102,255,0.9)]" />
          Creative studio
        </span>
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-white/35 sm:block">
          Video · Motion · Design
        </span>
        {!skipped && (
          <button
            type="button"
            onClick={() => setSkipped(true)}
            className="splash-skip rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/65 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            Skip intro
          </button>
        )}
        {skipped && <span className="w-[82px]" aria-hidden="true" />}
      </div>

      <main className="splash-content relative flex w-full max-w-3xl flex-col items-center px-6 text-center">
        <div className="splash-mark relative flex w-full max-w-[25rem] items-center justify-center">
          <div className="splash-mark-frame absolute inset-[8%] rounded-[2rem]" aria-hidden="true" />
          <div className="splash-mark-glint absolute inset-0 rounded-full" aria-hidden="true" />
          <LrOrbitLogo className="relative z-10 aspect-[5/3] w-[78%] drop-shadow-[0_12px_36px_rgba(147,51,234,0.32)]" />
        </div>

        <div className="splash-copy mt-2 flex flex-col items-center">
          <p className="splash-word font-display text-[2.4rem] font-semibold tracking-[0.32em] sm:text-6xl">
            LUMORA
          </p>
          <span className="splash-divider mt-5 h-px w-12 bg-gradient-to-r from-transparent via-brand-300 to-transparent" />
          <p className="splash-tag mt-5 text-xs font-medium uppercase tracking-[0.28em] text-white/60 sm:text-sm">
            Make something unforgettable.
          </p>
        </div>

        <div className="splash-loading mt-12 flex w-48 flex-col items-center gap-3 sm:w-56">
          <div className="splash-loader h-px w-full overflow-hidden rounded-full bg-white/10">
            <span className="splash-loader-bar block h-full w-2/5 rounded-full bg-gradient-to-r from-brand-500 via-brand-300 to-white" />
          </div>
          <span className="text-[9px] font-medium uppercase tracking-[0.24em] text-white/35">
            Preparing your workspace
          </span>
        </div>
      </main>

      <div className="splash-footer absolute inset-x-0 bottom-0 flex items-center justify-between px-6 py-6 text-[9px] font-medium uppercase tracking-[0.2em] text-white/30 sm:px-10">
        <span>Independent by nature</span>
        <span>Est. for creators</span>
      </div>
    </div>
  );
}
