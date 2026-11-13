import { Eraser, Film, MessageSquare, Mic, ScanFace, Wand2, type LucideIcon } from 'lucide-react';

type AiTool = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const tools: AiTool[] = [
  {
    icon: Wand2,
    title: 'LUMORA AI Assistant',
    description: 'Describe the edit you want in plain language, like "make this cinematic", and LUMORA applies it.',
  },
  {
    icon: ScanFace,
    title: 'AI Motion Mimic',
    description: 'Transfer the movement of a reference video onto a new subject, then preview before applying.',
  },
  {
    icon: Eraser,
    title: 'Background Removal',
    description: 'Isolate people and objects with one click, then apply effects only to the selection.',
  },
  {
    icon: Film,
    title: 'Auto Captions',
    description: 'Generate subtitles from speech and style them with animated caption templates.',
  },
  {
    icon: Mic,
    title: 'Audio Enhancement',
    description: 'Reduce background noise and balance voices so your audio sounds clean and professional.',
  },
  {
    icon: MessageSquare,
    title: 'Prompt Image Editing',
    description: 'Remove unwanted objects, enhance photographs and generate visuals from a written prompt.',
  },
];

export default function AiTools() {
  return (
    <section id="ai-tools" className="relative border-y border-surface-border bg-surface-subtle py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">Featured AI tools</p>
            <h2 className="mt-4 text-3xl font-bold text-ink sm:text-5xl">Creative AI that works alongside you</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
            Tools marked in development are on our roadmap and are not available yet.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => (
            <article
              key={tool.title}
              className="group relative overflow-hidden rounded-3xl border border-surface-border bg-surface-panel p-7 transition duration-500 hover:-translate-y-1 hover:border-brand-400/60 hover:shadow-[0_24px_60px_-30px_rgba(128,0,255,0.6)]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/0 blur-3xl transition duration-700 group-hover:bg-brand-500/25" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-text ring-1 ring-brand-400/30 transition duration-500 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white">
                <tool.icon className="h-5 w-5" />
              </div>
              <div className="relative mt-6 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-ink">{tool.title}</h3>
                <span className="shrink-0 rounded-full border border-accent-500/40 bg-accent-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent-600 dark:text-accent-400">
                  In development
                </span>
              </div>
              <p className="relative mt-3 text-sm leading-relaxed text-ink-muted">{tool.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
