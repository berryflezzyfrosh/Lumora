import { Layers, Scissors, SlidersHorizontal, Type, Wand2, Music, Film, Image as ImageIcon } from 'lucide-react';
import { navigate } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { IMAGES } from '@/lib/images';

const tracks = [
  { label: 'Video 1', color: 'bg-brand-500/80', left: 'left-[4%]', width: 'w-[46%]' },
  { label: 'Video 2', color: 'bg-brand-300/70', left: 'left-[52%]', width: 'w-[30%]' },
  { label: 'Text', color: 'bg-accent-500/80', left: 'left-[12%]', width: 'w-[24%]' },
  { label: 'Audio', color: 'bg-success-500/70', left: 'left-[4%]', width: 'w-[78%]' },
];

const leftTools = [
  { icon: Film, label: 'Media' },
  { icon: Wand2, label: 'Effects' },
  { icon: Layers, label: 'Transitions' },
  { icon: Type, label: 'Text' },
  { icon: Music, label: 'Audio' },
];

export default function WorkspacePreview() {
  const { user } = useAuth();

  return (
    <section id="features" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">The editing studio</p>
        <h2 className="mt-4 text-3xl font-bold text-ink sm:text-5xl">A workspace built for serious creators</h2>
        <p className="mt-5 text-base leading-relaxed text-ink-muted sm:text-lg">
          Media, preview, timeline and properties sit side by side, so every cut, keyframe and colour change is one
          click away.
        </p>
        <button
          type="button"
          onClick={() => navigate(user ? '/dashboard' : '/signup')}
          className="btn-primary mt-8 !px-7 !py-3.5"
        >
          Start editing
        </button>
      </div>

      <div className="relative mt-16">
        <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-500/25 via-transparent to-brand-300/20 blur-2xl" />
        <div className="overflow-hidden rounded-3xl border border-surface-border bg-surface-panel shadow-[0_40px_120px_-30px_rgba(128,0,255,0.45)]">
          <div className="flex items-center justify-between border-b border-surface-border bg-surface-subtle px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-error-500/80" />
              <span className="h-3 w-3 rounded-full bg-accent-500/80" />
              <span className="h-3 w-3 rounded-full bg-success-500/80" />
            </div>
            <p className="text-xs font-medium text-ink-muted">Summer Campaign.lumora</p>
            <div className="hidden gap-4 text-xs text-ink-muted sm:flex">
              <span>File</span>
              <span>Edit</span>
              <span>View</span>
              <span>Export</span>
            </div>
          </div>

          <div className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[4.5rem_1fr_15rem] lg:grid-cols-[5rem_1fr_17rem]">
            <aside className="flex flex-col items-center gap-3 border-r border-surface-border bg-surface-subtle py-5">
              {leftTools.map((tool) => (
                <div
                  key={tool.label}
                  className="flex w-11 flex-col items-center gap-1 rounded-xl py-2 text-[10px] text-ink-muted transition duration-300 hover:bg-surface-panel hover:text-brand-text"
                >
                  <tool.icon className="h-4 w-4" />
                  <span className="hidden sm:block">{tool.label}</span>
                </div>
              ))}
            </aside>

            <div className="flex min-w-0 flex-col">
              <div className="relative flex aspect-video items-center justify-center bg-surface-base p-4 sm:p-8">
                <div className="relative h-full w-full overflow-hidden rounded-2xl border border-surface-border shadow-2xl">
                  <img src={IMAGES.workspacePreview} alt="Colour-graded neon scene previewed in the LUMORA studio" className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error-500" />
                    00:04:12:08
                  </div>
                </div>
              </div>

              <div className="border-t border-surface-border bg-surface-subtle p-4">
                <div className="mb-3 flex items-center justify-between text-[11px] text-ink-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Scissors className="h-3.5 w-3.5" /> Split at playhead
                  </span>
                  <span>Zoom 100%</span>
                </div>
                <div className="relative space-y-2">
                  <div className="pointer-events-none absolute inset-y-0 left-[38%] z-10 w-px bg-brand-400 shadow-[0_0_12px_rgba(179,102,255,0.9)]" />
                  {tracks.map((track) => (
                    <div key={track.label} className="relative h-7 rounded-lg bg-surface-base/60">
                      <div
                        className={`absolute top-0.5 bottom-0.5 ${track.left} ${track.width} ${track.color} flex items-center rounded-md px-2 text-[10px] font-semibold text-white shadow-inner`}
                      >
                        {track.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="hidden flex-col gap-4 border-l border-surface-border bg-surface-subtle p-4 sm:flex">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <SlidersHorizontal className="h-3.5 w-3.5 text-brand-text" /> Properties
              </div>
              {[
                { label: 'Scale', value: 104 },
                { label: 'Opacity', value: 92 },
                { label: 'Rotation', value: 3 },
                { label: 'Saturation', value: 68 },
              ].map((prop) => (
                <div key={prop.label}>
                  <div className="mb-1.5 flex justify-between text-[11px] text-ink-muted">
                    <span>{prop.label}</span>
                    <span>{prop.value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-border">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${prop.value}%` }} />
                  </div>
                </div>
              ))}
              <div className="mt-auto flex items-center gap-2 rounded-xl border border-surface-border bg-surface-panel p-3 text-[11px] text-ink-muted">
                <ImageIcon className="h-4 w-4 shrink-0 text-brand-text" />
                Keyframes are recorded on every property change.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
