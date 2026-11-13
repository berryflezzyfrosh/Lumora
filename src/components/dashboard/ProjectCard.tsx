import { useState } from 'react';
import { Copy, Film, Loader2, Pencil, Star, Trash2 } from 'lucide-react';
import { Link } from '@/lib/router';
import type { Project } from '@/lib/projects';

type ProjectCardProps = {
  project: Project;
  busy: boolean;
  onToggleFavorite: (project: Project) => void;
  onRename: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onDelete: (project: Project) => void;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function ProjectCard({ project, busy, onToggleFavorite, onRename, onDuplicate, onDelete }: ProjectCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface-panel transition duration-500 hover:-translate-y-1 hover:border-brand-400/60 hover:shadow-[0_24px_60px_-30px_rgba(128,0,255,0.6)]">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-surface-base">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-brand-300/30 blur-3xl transition duration-700 group-hover:scale-125" />
        <Film className="relative h-10 w-10 text-white/80" />
        <button
          type="button"
          onClick={() => onToggleFavorite(project)}
          disabled={busy}
          aria-label={project.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
          aria-pressed={project.is_favorite}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60 disabled:opacity-50"
        >
          <Star className={`h-4 w-4 ${project.is_favorite ? 'fill-accent-400 text-accent-400' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink" title={project.title}>
            {project.title}
          </h3>
          <p className="mt-1 text-xs text-ink-muted">Edited {dateFormatter.format(new Date(project.updated_at))}</p>
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-surface-border pt-4">
          {busy && <Loader2 className="h-4 w-4 animate-spin text-brand-text" aria-label="Working" />}
          {confirmingDelete ? (
            <div className="flex w-full items-center justify-between gap-2 animate-scale-in">
              <span className="text-xs font-medium text-error-600 dark:text-error-400">Delete this project?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={busy}
                  className="rounded-full border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand-400 disabled:opacity-50"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(project)}
                  disabled={busy}
                  className="rounded-full bg-error-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-error-500 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                to={`/studio/${project.id}`}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-brand-text transition hover:bg-brand-500/10"
              >
                <Film className="h-3.5 w-3.5" /> Edit
              </Link>
              <button
                type="button"
                onClick={() => onRename(project)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-surface-subtle hover:text-ink disabled:opacity-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Rename
              </button>
              <button
                type="button"
                onClick={() => onDuplicate(project)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-surface-subtle hover:text-ink disabled:opacity-50"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={busy}
                aria-label={`Delete ${project.title}`}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-error-500/10 hover:text-error-600 disabled:opacity-50 dark:hover:text-error-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
