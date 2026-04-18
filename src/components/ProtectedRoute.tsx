'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/redux';
import { useNextAuth } from '@/lib/hooks/useNextAuth';
import { useCompany } from '@/lib/query';
import { getToken } from '@/lib/utils/cookies';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

// Skeleton shown while auth state resolves
function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Brutalist spinner — square rotating border */}
        <div className="h-12 w-12 border-4 border-border border-t-primary animate-spin" />
        {/* Stacked skeleton bars */}
        <div className="flex flex-col gap-2 w-48">
          <div className="h-2 bg-muted animate-pulse w-full" />
          <div className="h-2 bg-muted animate-pulse w-3/4" />
          <div className="h-2 bg-muted animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  );
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isAuthenticated: isNextAuthAuthenticated, session, isLoading: isNextAuthLoading } = useNextAuth();
  const router = useRouter();

  const hasAuth = isAuthenticated || isNextAuthAuthenticated;
  const authLoading = isLoading || isNextAuthLoading;

  const currentUser = useMemo(() => {
    if (user) return user;
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role as UserRole,
        companyId: session.user.companyId,
        name: session.user.name || undefined,
      };
    }
    return null;
  }, [user, session?.user]);

  // Load company data only for company-role users to check blocked status
  const { data: company, isLoading: companyLoading } = useCompany(
    currentUser?.companyId || 0,
    { enabled: !!currentUser?.companyId && currentUser?.role === 'company' }
  );

  const isCompanyBlocked = company?.status === 'Blocked';

  // ── Redirect logic ────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    const token = getToken();
    const hasSession = token || isNextAuthAuthenticated;

    // Not authenticated at all → home
    if (!hasSession || !hasAuth) {
      router.replace('/');
      return;
    }

    if (!currentUser) return;

    // Wrong role → redirect to appropriate panel
    if (requiredRole) {
      const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const role = String(currentUser.role).toLowerCase();
      const allowed = required.map((r) => String(r).toLowerCase());

      if (!allowed.includes(role)) {
        if (role === 'company') router.replace('/company');
        else if (role === 'admin' || role === 'super_admin') router.replace('/admin');
        else router.replace('/');
        return;
      }
    }

    // Blocked company: restrict to /company root only
    if (
      !companyLoading &&
      currentUser.role === 'company' &&
      isCompanyBlocked &&
      requiredRole === 'company'
    ) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (currentPath !== '/company') {
        router.replace('/company');
      }
    }
  }, [
    hasAuth,
    currentUser,
    authLoading,
    requiredRole,
    router,
    isNextAuthAuthenticated,
    companyLoading,
    isCompanyBlocked,
  ]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (authLoading || (currentUser?.role === 'company' && companyLoading)) {
    return <LoadingSkeleton />;
  }

  // ── Guard render ─────────────────────────────────────────────────────────
  const token = getToken();
  const hasSession = token || isNextAuthAuthenticated;

  if (!hasSession || !hasAuth || !currentUser) return null;

  if (requiredRole) {
    const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const role = String(currentUser.role).toLowerCase();
    const allowed = required.map((r) => String(r).toLowerCase());
    if (!allowed.includes(role)) return null;
  }

  if (
    currentUser.role === 'company' &&
    isCompanyBlocked &&
    requiredRole === 'company'
  ) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (currentPath !== '/company') return null;
  }

  return <>{children}</>;
};
