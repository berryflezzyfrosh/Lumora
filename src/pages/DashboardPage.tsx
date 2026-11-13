import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, FolderOpen, Loader2, LogOut, Plus, RefreshCw, Search, Star } from 'lucide-react';
import Logo from '@/components/Logo';
import ProjectCard from '@/components/dashboard/ProjectCard';
import ProjectDialog from '@/components/dashboard/ProjectDialog';
import { useAuth } from '@/lib/auth';
import { Link, navigate } from '@/lib/router';
import {
  createProject,
  deleteProject,
  duplicateProject,
  listProjects,
  renameProject,
  setProjectFavorite,
  type Project,
} from '@/lib/projects';

type DialogState = { mode: 'create' } | { mode: 'rename'; project: Project } | null;

function errorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Something went wrong. Please try again.';
}

export default function DashboardPage() {
  const { user, profile, profileError, loading: authLoading, signOut } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<DialogState>(null);
  const [query, setQuery] = useState('');
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, user]);

  const loadProjects = useCallback(async () => {
    setStatus('loading');
    setLoadError(null);
    try {
      setProjects(await listProjects());
      setStatus('ready');
    } catch (caught) {
      setLoadError(errorMessage(caught));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (user) void loadProjects();
  }, [user, loadProjects]);

  const markBusy = (id: string, busy: boolean) => {
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const runAction = async (id: string, action: () => Promise<void>) => {
    markBusy(id, true);
    setActionError(null);
    try {
      await action();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      markBusy(id, false);
    }
  };

  const visibleProjects = useMemo(() => {
    const term = query.trim().toLowerCase();
    return projects.filter(
      (project) =>
        (!favouritesOnly || project.is_favorite) && (!term || project.title.toLowerCase().includes(term)),
    );
  }, [projects, query, favouritesOnly]);

  const favouriteCount = projects.filter((project) => project.is_favorite).length;

  const handleToggleFavorite = (project: Project) =>
    runAction(project.id, async () => {
      const updated = await setProjectFavorite(project.id, !project.is_favorite);
      setProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    });

  const handleDuplicate = (project: Project) =>
    runAction(project.id, async () => {
      const copy = await duplicateProject(project.id);
      setProjects((current) => [copy, ...current]);
    });

  const handleDelete = (project: Project) =>
    runAction(project.id, async () => {
      await deleteProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
    });

  const handleCreate = async (title: string) => {
    const created = await createProject(title);
    setProjects((current) => [created, ...current]);
    setDialog(null);
  };

  const handleRename = async (id: string, title: string) => {
    const updated = await renameProject(id, title);
    setProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setDialog(null);
  };

  const handleSignOut = async () => {
    setActionError(null);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (caught) {
      setActionError(errorMessage(caught));
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <Loader2 className="h-6 w-6 animate-spin text-brand-text" aria-label="Loading" />
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.username || 'creator';

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-surface-base/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo size="sm" to="/dashboard" />
          <div className="flex items-center gap-3">
            {user.app_metadata?.role === 'admin' && (
              <Link
                to="/admin"
                className="rounded-full border border-surface-border bg-surface-panel px-3 py-2 text-sm font-semibold text-ink-muted transition hover:border-brand-400 hover:text-brand-text"
              >
                Admin
              </Link>
            )}
            <span className="hidden rounded-full border border-surface-border bg-surface-panel px-3 py-1 text-xs font-semibold capitalize text-ink-muted sm:inline-block">
              {profile?.plan ?? 'free'} plan
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-panel px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-400 hover:text-brand-text"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">My projects</p>
            <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">Welcome back, {displayName}</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} · {favouriteCount} favourite
              {favouriteCount === 1 ? '' : 's'}
            </p>
          </div>
          <button type="button" onClick={() => setDialog({ mode: 'create' })} className="btn-primary !px-6 !py-3">
            <Plus className="h-4 w-4" /> New project
          </button>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your projects"
              aria-label="Search your projects"
              className="input-base pl-11"
            />
          </div>
          <button
            type="button"
            onClick={() => setFavouritesOnly((value) => !value)}
            aria-pressed={favouritesOnly}
            className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition ${
              favouritesOnly
                ? 'border-brand-400 bg-brand-500/10 text-brand-text'
                : 'border-surface-border bg-surface-panel text-ink-muted hover:text-ink'
            }`}
          >
            <Star className={`h-4 w-4 ${favouritesOnly ? 'fill-current' : ''}`} /> Favourites
          </button>
        </div>

        {actionError && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-error-500/40 bg-error-500/10 p-4 text-sm text-error-600 dark:text-error-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {profileError && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-error-500/40 bg-error-500/10 p-4 text-sm text-error-600 dark:text-error-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>We could not load your account profile. {profileError}</span>
          </div>
        )}

        <div className="mt-8">
          {status === 'loading' && (
            <div className="flex items-center justify-center gap-3 py-24 text-sm text-ink-muted">
              <Loader2 className="h-5 w-5 animate-spin text-brand-text" /> Loading your projects...
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-error-500/40 bg-error-500/10 px-6 py-16 text-center">
              <AlertCircle className="h-8 w-8 text-error-600 dark:text-error-400" />
              <p className="max-w-md text-sm text-ink">We could not load your projects. {loadError}</p>
              <button type="button" onClick={loadProjects} className="btn-secondary !py-2.5">
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          )}

          {status === 'ready' && projects.length === 0 && (
            <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-surface-border bg-surface-panel px-6 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-text">
                <FolderOpen className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-ink">No projects yet</h2>
                <p className="mt-2 max-w-sm text-sm text-ink-muted">Create your first project to start building your next edit.</p>
              </div>
              <button type="button" onClick={() => setDialog({ mode: 'create' })} className="btn-primary">
                <Plus className="h-4 w-4" /> Create your first project
              </button>
            </div>
          )}

          {status === 'ready' && projects.length > 0 && visibleProjects.length === 0 && (
            <p className="py-20 text-center text-sm text-ink-muted">No projects match your search.</p>
          )}

          {status === 'ready' && visibleProjects.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  busy={busyIds.has(project.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onRename={(item) => setDialog({ mode: 'rename', project: item })}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {dialog?.mode === 'create' && (
        <ProjectDialog mode="create" onClose={() => setDialog(null)} onSubmit={handleCreate} />
      )}
      {dialog?.mode === 'rename' && (
        <ProjectDialog
          mode="rename"
          initialTitle={dialog.project.title}
          onClose={() => setDialog(null)}
          onSubmit={(title) => handleRename(dialog.project.id, title)}
        />
      )}
    </div>
  );
}
