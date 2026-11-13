import { useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { appUrl, Link } from '@/lib/router';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const normalizedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: appUrl('/reset-password'),
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (caught) {
      console.error('[auth.passwordReset.request]', caught);
      setError('We could not send the reset email. Check your connection and try again.');
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
          {sent ? (
            <div className="mt-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-text">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h1 className="mt-5 text-3xl font-bold text-ink">Check your inbox</h1>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                If an account exists for <span className="font-semibold text-ink">{email.trim()}</span>, we sent a password reset link.
                Use the link to choose a new password.
              </p>
              <Link to="/login" className="btn-primary mt-7 w-full">Back to log in</Link>
            </div>
          ) : (
            <>
              <h1 className="mt-8 text-3xl font-bold text-ink">Forgot your password?</h1>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Enter the email address on your account and we’ll send you a secure reset link.
              </p>
              <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
                <div>
                  <label htmlFor="reset-email" className="mb-2 block text-sm font-medium text-ink">Email</label>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="input-base"
                  />
                </div>
                {error && (
                  <div role="alert" className="flex items-start gap-3 rounded-xl border border-error-500/40 bg-error-500/10 p-4 text-sm text-error-600 dark:text-error-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Sending link...' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
