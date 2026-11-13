import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Link, navigate } from '@/lib/router';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const { user, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    if (hash.get('error') || query.get('error')) {
      setError('This reset link is invalid or has expired. Request a new one.');
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!user) {
      setError('Open this page using the password reset link sent to your email.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setUpdated(true);
    } catch (caught) {
      console.error('[auth.passwordReset.update]', caught);
      setError('We could not update your password. The reset link may have expired; request a new one and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-5 py-10">
      <main className="w-full max-w-md">
        <Link to="/login" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to log in
        </Link>
        <section className="rounded-3xl border border-surface-border bg-surface-panel p-6 shadow-2xl sm:p-8">
          <Logo size="sm" to="/" />
          {updated ? (
            <div className="mt-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-text">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h1 className="mt-5 text-3xl font-bold text-ink">Password updated</h1>
              <p className="mt-3 text-sm text-ink-muted">Your password has been changed. Continue to your account.</p>
              <button type="button" onClick={() => navigate('/dashboard', { replace: true })} className="btn-primary mt-7 w-full">
                Continue to dashboard
              </button>
            </div>
          ) : (
            <>
              <h1 className="mt-8 text-3xl font-bold text-ink">Choose a new password</h1>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Use at least {MIN_PASSWORD_LENGTH} characters for your new password.
              </p>
              {!loading && !user && !error && (
                <p role="status" className="mt-5 rounded-xl border border-surface-border bg-surface-subtle p-4 text-sm text-ink-muted">
                  Waiting for a valid reset link. If you haven’t requested one, <Link to="/forgot-password" className="font-semibold text-brand-text hover:underline">request it here</Link>.
                </p>
              )}
              <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
                <div>
                  <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-ink">New password</label>
                  <input
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="input-base"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-ink">Confirm new password</label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="input-base"
                  />
                </div>
                {error && (
                  <div role="alert" className="flex items-start gap-3 rounded-xl border border-error-500/40 bg-error-500/10 p-4 text-sm text-error-600 dark:text-error-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button type="submit" disabled={submitting || loading || !user} className="btn-primary w-full !py-3.5">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Updating password...' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
