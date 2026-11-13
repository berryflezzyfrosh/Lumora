import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';

type ProjectDialogProps = {
  mode: 'create' | 'rename';
  initialTitle?: string;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
};

export default function ProjectDialog({ mode, initialTitle = '', onClose, onSubmit }: ProjectDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, submitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a project name.');
      return;
    }
    if (trimmed.length > 120) {
      setError('Project names can be at most 120 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-up" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !submitting) onClose();
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" className="animate-scale-in w-full max-w-md rounded-3xl border border-surface-border bg-surface-panel p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="project-dialog-title" className="text-xl font-bold text-ink">
              {mode === 'create' ? 'New project' : 'Rename project'}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {mode === 'create' ? 'Give your project a name to get started.' : 'Choose a new name for this project.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-subtle hover:text-ink disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Summer campaign edit"
            maxLength={120}
            aria-label="Project name"
            className="input-base"
          />

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-error-500/40 bg-error-500/10 p-3 text-sm text-error-600 dark:text-error-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary !py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary !py-2.5">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create project' : 'Save name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
