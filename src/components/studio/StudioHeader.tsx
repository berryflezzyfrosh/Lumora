import { AlertCircle, ArrowLeft, Check, Download, Loader2, Redo2, Undo2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { Link } from '@/lib/router';
import type { SaveStatus } from '@/lib/studio/useAutosave';

type StudioHeaderProps = {
  title: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveStatus: SaveStatus;
  saveError: string | null;
  onRetry: () => void;
  exporting: boolean;
  exportProgress: number;
  onExport: () => void;
};

export default function StudioHeader({
  title,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveStatus,
  saveError,
  onRetry,
  exporting,
  exportProgress,
  onExport,
}: StudioHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-surface-border bg-surface-base px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Link
          to="/dashboard"
          aria-label="Back to dashboard"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-subtle hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Logo size="sm" to="/dashboard" />
        <span className="hidden h-5 w-px bg-surface-border sm:block" />
        <h1 className="hidden truncate text-sm font-semibold text-ink md:block" title={title}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <SaveIndicator status={saveStatus} error={saveError} onRetry={onRetry} />
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          aria-label={exporting ? `Exporting ${Math.round(exportProgress * 100)} percent` : 'Export video as WebM'}
          aria-busy={exporting}
          className="btn-primary !px-3 !py-2 text-xs disabled:opacity-60 sm:!px-4 sm:text-sm"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span className="hidden sm:inline">{exporting ? `Exporting ${Math.round(exportProgress * 100)}%` : 'Export WebM'}</span>
          <span className="sm:hidden">{exporting ? `${Math.round(exportProgress * 100)}%` : 'Export'}</span>
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-subtle hover:text-ink disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-subtle hover:text-ink disabled:opacity-40"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function SaveIndicator({ status, error, onRetry }: { status: SaveStatus; error: string | null; onRetry: () => void }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-2 text-xs text-ink-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
      </span>
    );
  }
  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={onRetry}
        title={error ?? undefined}
        className="flex items-center gap-2 rounded-full border border-error-500/40 px-3 py-1 text-xs font-semibold text-error-600 transition hover:bg-error-500/10 dark:text-error-400"
      >
        <AlertCircle className="h-3.5 w-3.5" /> Not saved. Retry
      </button>
    );
  }
  if (status === 'dirty') {
    return <span className="text-xs text-ink-muted">Unsaved changes</span>;
  }
  return (
    <span className="flex items-center gap-2 text-xs text-ink-muted">
      <Check className="h-3.5 w-3.5 text-success-600 dark:text-success-400" /> All changes saved
    </span>
  );
}
