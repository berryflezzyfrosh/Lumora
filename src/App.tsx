import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import PwaRuntime from '@/components/PwaRuntime';
import { AuthProvider, useAuth } from '@/lib/auth';
import {
  entryRedirect,
  markIntroPlayed,
  shouldPlayIntro,
} from '@/lib/intro';
import { Link, navigate, usePathname } from '@/lib/router';
import { ThemeProvider } from '@/lib/theme';

const SplashScreen = lazy(() => import('@/components/splash/SplashScreen'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AdminSignInPage = lazy(() => import('@/pages/AdminSignInPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const StudioPage = lazy(() => import('@/pages/StudioPage'));

const STUDIO_PATH = /^\/studio\/([^/]+)$/;

type StartupPhase = 'intro' | 'entry' | 'app';

function LoadingScreen() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center bg-surface-base text-sm text-ink-muted">
      Loading LUMORA...
    </div>
  );
}

function AppRoutes() {
  const pathname = usePathname();
  const studioMatch = STUDIO_PATH.exec(pathname);

  if (pathname === '/') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Navbar />
        <LandingPage />
      </Suspense>
    );
  }
  if (pathname === '/login' || pathname === '/signup') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AuthPage mode={pathname === '/login' ? 'login' : 'signup'} />
      </Suspense>
    );
  }
  if (pathname === '/forgot-password') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ForgotPasswordPage />
      </Suspense>
    );
  }
  if (pathname === '/auth/callback') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AuthCallbackPage />
      </Suspense>
    );
  }
  if (pathname === '/reset-password') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ResetPasswordPage />
      </Suspense>
    );
  }
  if (pathname === '/lumora-control') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AdminSignInPage />
      </Suspense>
    );
  }
  if (pathname === '/dashboard') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <DashboardPage />
      </Suspense>
    );
  }
  if (pathname === '/admin') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AdminPage />
      </Suspense>
    );
  }
  if (studioMatch) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <StudioPage projectId={decodeURIComponent(studioMatch[1])} />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-base px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">404</p>
      <h1 className="text-3xl font-bold text-ink">This page does not exist.</h1>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [phase, setPhase] = useState<StartupPhase>(() => (shouldPlayIntro() ? 'intro' : 'entry'));

  const completeIntro = useCallback(() => {
    markIntroPlayed();
    setPhase('entry');
  }, []);

  useEffect(() => {
    if (phase !== 'entry' || loading) return;
    setPhase('app');
    const target = entryRedirect(Boolean(user), pathname, user?.app_metadata?.role === 'admin');
    if (target) navigate(target, { replace: true });
  }, [phase, loading, user, pathname]);

  if (phase === 'intro') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <SplashScreen ready={!loading} onComplete={completeIntro} />
      </Suspense>
    );
  }
  if (phase === 'entry') return <div className="min-h-screen bg-surface-base" />;
  return <AppRoutes />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PwaRuntime />
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
