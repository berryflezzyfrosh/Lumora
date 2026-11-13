import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, Loader2, Shield } from 'lucide-react';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Link, navigate } from '@/lib/router';

function getLoginError(caught: unknown) {
  const message = caught instanceof Error ? caught.message.toLowerCase() : '';
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'We could not reach the server. Check your connection and try again.';
  }
  return 'Sign-in failed or this account is not authorized for administration.';
}

export default function AdminSignInPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user?.app_metadata?.role === 'admin') navigate('/admin', { replace: true });
  }, [loading, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || !password) {
      setError('Enter your admin email address and password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      if (data.user.app_metadata?.role !== 'admin') {
        await supabase.auth.signOut();
        setError('Sign-in failed or this account is not authorized for administration.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (caught) {
      setError(getLoginError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-5 py-10">
      <main className="w-full max-w-md">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to LUMORA
        </Link>
        <section className="rounded-3xl border border-surface-border bg-surface-panel p-6 shadow-2xl sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <Logo size="sm" to="/" />
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-text">
              <Shield className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-brand-text">Restricted access</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Admin sign in</h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Sign in with an account that has been granted the admin role by the project owner.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-ink">Email</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-ink">Password</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-base"
              />
            </div>
            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-xl border border-error-500/40 bg-error-500/10 p-4 text-sm text-error-600 dark:text-error-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" disabled={submitting || loading} className="btn-primary w-full !py-3.5">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Verifying access...' : 'Sign in securely'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-muted">
            Forgot your password? <Link to="/forgot-password" className="font-semibold text-brand-text hover:underline">Reset it here</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
