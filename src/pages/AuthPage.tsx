import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { appUrl, Link, navigate } from '@/lib/router';
import { IMAGES } from '@/lib/images';

type AuthMode = 'login' | 'signup';

type AuthPageProps = { mode: AuthMode };

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;
const MIN_PASSWORD_LENGTH = 8;

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'The email or password you entered is incorrect.';
  if (lower.includes('email not confirmed')) return 'Please verify your email address using the link we sent before logging in.';
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (lower.includes('password should be at least')) return `Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (lower.includes('provider is not enabled') || lower.includes('unsupported provider')) {
    return 'Google sign-in is not enabled for this project yet. Enable Google under Supabase Authentication providers.';
  }
  if (lower.includes('redirect_uri_mismatch') || lower.includes('redirect url')) {
    return 'Google sign-in redirect settings do not match. Check the Supabase and Google Cloud redirect URLs.';
  }
  if (lower.includes('access_denied') || lower.includes('user denied')) {
    return 'Google sign-in was cancelled. You can try again whenever you are ready.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'We could not reach the server. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { user, loading } = useAuth();
  const isSignup = mode === 'signup';
  const isAdmin = user?.app_metadata?.role === 'admin';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
  }, [loading, user, isAdmin]);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const validate = (): string | null => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address.';
    if (password.length < MIN_PASSWORD_LENGTH) return `Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    if (isSignup && !USERNAME_PATTERN.test(username)) {
      return 'Choose a username of 3 to 24 letters, numbers or underscores.';
    }
    return null;
  };

  const handleGoogle = async () => {
    if (googleSubmitting || submitting) return;
    setGoogleSubmitting(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: appUrl('/auth/callback'),
          queryParams: { prompt: 'select_account' },
        },
      });
      if (oauthError) throw oauthError;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      console.error(`[auth.${isSignup ? 'signUp' : 'signIn'}]`, caught);
      setError(friendlyAuthError(message));
      setGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let destination = '/dashboard';
      if (isSignup) {
        const { data: available, error: availabilityError } = await supabase.rpc('is_username_available', {
          candidate: username,
        });
        if (availabilityError) throw availabilityError;
        if (available !== true) {
          setError('That username is already taken. Please choose another.');
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setError('Your account was created but could not be signed in. Please try logging in.');
          return;
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        if (data.user.app_metadata?.role === 'admin') destination = '/admin';
      }
      navigate(destination, { replace: true });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      setError(friendlyAuthError(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={IMAGES.authPanel} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 via-brand-800/70 to-black/80" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo size="md" to="/" />
          <div className="max-w-md">
            <p className="font-display text-4xl font-bold leading-tight">Create Beyond Imagination.</p>
            <p className="mt-6 text-sm text-white/70">
              Video, photo and motion editing with AI, and a community of creators who share their work.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col bg-surface-base px-6 py-10 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="lg:hidden">
            <Logo size="sm" to="/" />
          </div>
        </div>

        <div className="m-auto w-full max-w-md animate-fade-up py-12">
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {isSignup
              ? 'Start with 1GB of free cloud storage and open the studio right away.'
              : 'Log in to continue to your projects and creative workspace.'}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-1 rounded-full border border-surface-border bg-surface-subtle p-1">
            {(['login', 'signup'] as AuthMode[]).map((option) => (
              <Link
                key={option}
                to={option === 'login' ? '/login' : '/signup'}
                className={`rounded-full px-4 py-2.5 text-center text-sm font-semibold transition duration-300 ${
                  mode === option ? 'bg-brand-500 text-white shadow-lg' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {option === 'login' ? 'Log in' : 'Sign up'}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleSubmitting || submitting}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-surface-border bg-surface-panel px-6 py-3.5 text-sm font-semibold text-ink transition duration-300 hover:-translate-y-0.5 hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.09A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l4.01-3.09z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.62l4.01 3.09C6.23 6.88 8.88 4.77 12 4.77z" />
              </svg>
            )}
            {isSignup ? 'Sign up with Google' : 'Log in with Google'}
          </button>

          <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-widest text-ink-muted">
            <span className="h-px flex-1 bg-surface-border" />
            or with email
            <span className="h-px flex-1 bg-surface-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {isSignup && (
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium text-ink">
                  Username
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-ink-muted">@</span>
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value.trim())}
                    placeholder="yourname"
                    maxLength={24}
                    className="input-base pl-9"
                  />
                </div>
                <p className="mt-2 text-xs text-ink-muted">3 to 24 letters, numbers or underscores.</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input-base"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-sm font-medium text-ink">Password</label>
                {!isSignup && (
                  <Link to="/forgot-password" className="text-xs font-semibold text-brand-text transition hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  className="input-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 flex items-center text-ink-muted transition hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="animate-scale-in flex items-start gap-3 rounded-xl border border-error-500/40 bg-error-500/10 p-4 text-sm text-error-600 dark:text-error-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignup ? 'Creating account...' : 'Logging in...'}
                </>
              ) : (
                <>
                  {isSignup ? 'Create account' : 'Log in'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-relaxed text-ink-muted">
            By continuing you agree to use LUMORA responsibly and respect other creators.
          </p>
        </div>
      </div>
    </div>
  );
}
