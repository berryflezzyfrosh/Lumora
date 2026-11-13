import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Crown,
  Film,
  Loader2,
  LogOut,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { Link, navigate } from '@/lib/router';
import {
  ADMIN_PAGE_SIZE,
  getAdminStats,
  listAdminProjects,
  listAdminUsers,
  removeAdminProject,
  setAdminUserPlan,
  type AdminProject,
  type AdminStats,
  type AdminUser,
} from '@/lib/admin';

function errorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Something went wrong. Please try again.';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-surface-border bg-surface-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-text">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold text-ink">{value.toLocaleString()}</p>
    </article>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading, signOut, refreshProfile } = useAuth();
  const isAdmin = user?.app_metadata?.role === 'admin';
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [projectsHasMore, setProjectsHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [loadingMoreProjects, setLoadingMoreProjects] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, user]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStats, nextUsers, nextProjects] = await Promise.all([
        getAdminStats(),
        listAdminUsers(),
        listAdminProjects(),
      ]);
      setStats(nextStats);
      setUsers(nextUsers);
      setProjects(nextProjects);
      setUsersHasMore(nextUsers.length === ADMIN_PAGE_SIZE);
      setProjectsHasMore(nextProjects.length === ADMIN_PAGE_SIZE);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) void loadDashboard();
  }, [user, isAdmin, loadDashboard]);

  const markBusy = (id: string, busy: boolean) => {
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSetPlan = async (target: AdminUser, plan: AdminUser['plan']) => {
    markBusy(target.id, true);
    setError(null);
    try {
      await setAdminUserPlan(target.id, plan);
      setUsers((current) => current.map((item) => (item.id === target.id ? { ...item, plan } : item)));
      setStats((current) =>
        current
          ? {
              ...current,
              proUsers: current.proUsers + (plan === 'pro' ? 1 : -1),
            }
          : current,
      );
      if (target.id === user?.id) await refreshProfile();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      markBusy(target.id, false);
    }
  };

  const handleRemoveProject = async (project: AdminProject) => {
    if (!window.confirm(`Permanently remove “${project.title}” from its owner's workspace?`)) return;
    markBusy(project.id, true);
    setError(null);
    try {
      await removeAdminProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setStats((current) => (current ? { ...current, projects: Math.max(0, current.projects - 1) } : current));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      markBusy(project.id, false);
    }
  };

  const loadMoreUsers = async () => {
    setLoadingMoreUsers(true);
    setError(null);
    try {
      const more = await listAdminUsers(users.length);
      setUsers((current) => [...current, ...more]);
      setUsersHasMore(more.length === ADMIN_PAGE_SIZE);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoadingMoreUsers(false);
    }
  };

  const loadMoreProjects = async () => {
    setLoadingMoreProjects(true);
    setError(null);
    try {
      const more = await listAdminProjects(projects.length);
      setProjects((current) => [...current, ...more]);
      setProjectsHasMore(more.length === ADMIN_PAGE_SIZE);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoadingMoreProjects(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <Loader2 className="h-6 w-6 animate-spin text-brand-text" aria-label="Loading" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-surface-base px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">404</p>
        <h1 className="text-3xl font-bold text-ink">This page does not exist.</h1>
        <Link to="/" className="btn-primary">Back to home</Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-surface-base/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo size="sm" to="/admin" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard"
              className="rounded-full border border-surface-border bg-surface-panel px-3 py-2 text-xs font-semibold text-ink-muted transition hover:text-ink sm:px-4 sm:text-sm"
            >
              My workspace
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-panel px-3 py-2 text-xs font-semibold text-ink transition hover:border-brand-400 hover:text-brand-text sm:px-4 sm:text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">Administration</p>
            <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">LUMORA admin</h1>
            <p className="mt-2 text-sm text-ink-muted">Manage accounts, subscription plans, and creator projects.</p>
          </div>
          {isAdmin && (
            <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="btn-secondary !py-2.5">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh data
            </button>
          )}
        </section>

        {error && (
              <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-error-500/40 bg-error-500/10 p-4 text-sm text-error-600 dark:text-error-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>{error}</p>
                  <p className="mt-1 text-xs">
                    Confirm the latest Supabase migrations are applied and this account has the admin app-metadata role.
                  </p>
                </div>
              </div>
            )}

            {loading && !stats ? (
              <div className="flex items-center justify-center gap-3 py-24 text-sm text-ink-muted">
                <Loader2 className="h-5 w-5 animate-spin text-brand-text" /> Loading admin data...
              </div>
            ) : stats ? (
              <>
                <section aria-label="Overview" className="mt-8 grid gap-4 sm:grid-cols-3">
                  <StatCard icon={Users} label="Creator accounts" value={stats.users} />
                  <StatCard icon={Crown} label="Pro accounts" value={stats.proUsers} />
                  <StatCard icon={Film} label="Projects" value={stats.projects} />
                </section>

                <section className="mt-10">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-ink">Creator accounts</h2>
                    <p className="mt-1 text-sm text-ink-muted">Review accounts and assign free or pro plans.</p>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-panel">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="border-b border-surface-border bg-surface-subtle text-xs uppercase tracking-wide text-ink-muted">
                          <tr>
                            <th className="px-5 py-3 font-semibold">Account</th>
                            <th className="px-5 py-3 font-semibold">Joined</th>
                            <th className="px-5 py-3 font-semibold">Plan</th>
                            <th className="px-5 py-3 text-right font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {users.map((account) => (
                            <tr key={account.id}>
                              <td className="px-5 py-4">
                                <p className="font-semibold text-ink">{account.display_name || account.username || 'Creator'}</p>
                                <p className="mt-1 text-xs text-ink-muted">{account.email || account.id}</p>
                              </td>
                              <td className="whitespace-nowrap px-5 py-4 text-ink-muted">{formatDate(account.created_at)}</td>
                              <td className="px-5 py-4">
                                <span className="rounded-full border border-surface-border px-3 py-1 text-xs font-semibold capitalize text-ink-muted">
                                  {account.plan}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  disabled={busyIds.has(account.id)}
                                  onClick={() => void handleSetPlan(account, account.plan === 'pro' ? 'free' : 'pro')}
                                  className="rounded-full border border-surface-border px-3 py-2 text-xs font-semibold text-ink transition hover:border-brand-400 hover:text-brand-text disabled:opacity-50"
                                >
                                  {busyIds.has(account.id) ? 'Saving...' : account.plan === 'pro' ? 'Set free' : 'Make Pro'}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {users.length === 0 && !loading && (
                            <tr><td colSpan={4} className="px-5 py-8 text-center text-ink-muted">No accounts found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {usersHasMore && (
                      <div className="border-t border-surface-border p-4 text-center">
                        <button type="button" onClick={() => void loadMoreUsers()} disabled={loadingMoreUsers} className="btn-secondary !py-2">
                          {loadingMoreUsers && <Loader2 className="h-4 w-4 animate-spin" />}
                          Load more accounts
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className="mt-10">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-ink">Creator projects</h2>
                    <p className="mt-1 text-sm text-ink-muted">Review activity or remove a project that violates your policies.</p>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-panel">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-surface-border bg-surface-subtle text-xs uppercase tracking-wide text-ink-muted">
                          <tr>
                            <th className="px-5 py-3 font-semibold">Project</th>
                            <th className="px-5 py-3 font-semibold">Owner ID</th>
                            <th className="px-5 py-3 font-semibold">Last updated</th>
                            <th className="px-5 py-3 text-right font-semibold">Moderation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {projects.map((project) => (
                            <tr key={project.id}>
                              <td className="px-5 py-4">
                                <p className="font-semibold text-ink">{project.title}</p>
                                <p className="mt-1 text-xs text-ink-muted">
                                  {project.is_favorite ? 'Favorite · ' : ''}Created {formatDate(project.created_at)}
                                </p>
                              </td>
                              <td className="max-w-[220px] truncate px-5 py-4 text-xs text-ink-muted">{project.user_id}</td>
                              <td className="whitespace-nowrap px-5 py-4 text-ink-muted">{formatDate(project.updated_at)}</td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  disabled={busyIds.has(project.id)}
                                  onClick={() => void handleRemoveProject(project)}
                                  aria-label={`Remove project ${project.title}`}
                                  className="inline-flex items-center gap-2 rounded-full border border-error-500/30 px-3 py-2 text-xs font-semibold text-error-600 transition hover:bg-error-500/10 dark:text-error-400 disabled:opacity-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {busyIds.has(project.id) ? 'Removing...' : 'Remove'}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {projects.length === 0 && !loading && (
                            <tr><td colSpan={4} className="px-5 py-8 text-center text-ink-muted">No projects found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {projectsHasMore && (
                      <div className="border-t border-surface-border p-4 text-center">
                        <button type="button" onClick={() => void loadMoreProjects()} disabled={loadingMoreProjects} className="btn-secondary !py-2">
                          {loadingMoreProjects && <Loader2 className="h-4 w-4 animate-spin" />}
                          Load more projects
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <div className="mt-8 rounded-2xl border border-surface-border bg-surface-panel p-6 text-sm text-ink-muted">
                Admin data is unavailable. Use refresh to try again after confirming database setup.
              </div>
            )}
      </main>
    </div>
  );
}
