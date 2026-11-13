import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Link, navigate } from '@/lib/router';
import { useAuth } from '@/lib/auth';

function providerError() {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return params.get('error_description') ?? hash.get('error_description') ?? params.get('error') ?? hash.get('error');
}

export default function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const [callbackError, setCallbackError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate(user.app_metadata?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      return;
    }

    const error = providerError();
    if (error) {
      console.error('[auth.oauth.callback]', error);
      setCallbackError('Google sign-in was not completed. Please try again or use your email and password.');
      return;
    }

    setCallbackError('We could not confirm your Google sign-in. Please try again.');
  }, [loading, user]);

  if (!callbackError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-base px-6">
        <div role="status" className="flex items-center gap-3 text-sm text-ink-muted">
          <Loader2 className="h-5 w-5 animate-spin text-brand-text" />
          Completing secure sign-in...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base px-6">
      <section className="w-full max-w-md rounded-3xl border border-surface-border bg-surface-panel p-7">
        <div role="alert" className="flex items-start gap-3 text-sm text-error-600 dark:text-error-400">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{callbackError}</p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/login" className="btn-primary flex-1">Log in</Link>
          <Link to="/signup" className="btn-secondary flex-1">Create account</Link>
        </div>
      </section>
    </main>
  );
}
