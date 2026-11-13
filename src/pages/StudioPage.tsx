import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import StudioWorkspace from '@/components/studio/StudioWorkspace';
import { useAuth } from '@/lib/auth';
import { navigate, Link } from '@/lib/router';
import { clearDraft, loadStudioProject, readDraft, type LoadedProject, type StudioDraft } from '@/lib/studio/persistence';
import type { TimelineDoc } from '@/lib/studio/types';

type PageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      project: LoadedProject;
      pendingDraft: StudioDraft | null;
      startDoc: TimelineDoc;
      session: number;
    };

function errorText(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Something went wrong. Please try again.';
}

function isNewerDraft(draft: StudioDraft, project: LoadedProject) {
  return (
    Date.parse(draft.savedAt) > Date.parse(project.updatedAt) &&
    JSON.stringify(draft.document) !== JSON.stringify(project.document)
  );
}

export default function StudioPage({ projectId }: { projectId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setState({ status: 'loading' });

    (async () => {
      try {
        const project = await loadStudioProject(projectId);
        if (!active) return;
        if (!project) {
          setState({ status: 'missing' });
          return;
        }
        const draft = readDraft(projectId);
        const pendingDraft = draft && isNewerDraft(draft, project) ? draft : null;
        if (draft && !pendingDraft) clearDraft(projectId);
        setState({ status: 'ready', project, pendingDraft, startDoc: project.document, session: 0 });
      } catch (caught) {
        if (active) setState({ status: 'error', message: errorText(caught) });
      }
    })();

    return () => {
      active = false;
    };
  }, [user, projectId]);

  if (authLoading || !user || state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <Loader2 className="h-6 w-6 animate-spin text-brand-text" aria-label="Loading" />
      </div>
    );
  }

  if (state.status === 'missing' || state.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-base px-6 text-center">
        <AlertCircle className="h-8 w-8 text-error-600 dark:text-error-400" />
        <h1 className="text-2xl font-bold text-ink">
          {state.status === 'missing' ? 'This project could not be found.' : 'We could not open this project.'}
        </h1>
        {state.status === 'error' && <p className="max-w-md text-sm text-ink-muted">{state.message}</p>}
        <Link to="/dashboard" className="btn-primary">
          Back to projects
        </Link>
      </div>
    );
  }

  const { project, pendingDraft, startDoc, session } = state;

  if (pendingDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base px-6">
        <div role="alert" className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-surface-border bg-surface-panel p-8">
          <div>
            <h1 className="text-xl font-bold text-ink">Unsaved changes found</h1>
            <p className="mt-2 text-sm text-ink-muted">
              “{project.title}” has edits from your last session that were not saved to the cloud. Restore them?
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                setState((current) =>
                  current.status === 'ready'
                    ? { ...current, pendingDraft: null, startDoc: pendingDraft.document, session: current.session + 1 }
                    : current,
                )
              }
              className="btn-primary flex-1"
            >
              <RotateCcw className="h-4 w-4" /> Restore edits
            </button>
            <button
              type="button"
              onClick={() => {
                clearDraft(projectId);
                setState((current) => (current.status === 'ready' ? { ...current, pendingDraft: null } : current));
              }}
              className="btn-secondary flex-1"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudioWorkspace
      key={`${projectId}-${session}`}
      projectId={projectId}
      userId={user.id}
      title={project.title}
      initialDoc={startDoc}
      savedDoc={project.document}
    />
  );
}
