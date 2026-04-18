'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { FiSettings, FiLogOut, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '@/lib/redux';
import { useNextAuth } from '@/lib/hooks/useNextAuth';
import { useAppDispatch, useAppSelector, toggleTheme } from '@/lib';
import { useCompany } from '@/lib/query';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const CompanyHeader = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { signOut: nextAuthSignOut, isAuthenticated: isNextAuthAuthenticated } = useNextAuth();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: company } = useCompany(user?.companyId || 0, {
    enabled:
      !!user?.companyId &&
      (user?.role === 'company' || user?.role === 'admin' || user?.role === 'super_admin'),
  });

  const permissions = usePlanPermissions();
  const isCompanyBlocked = company?.status === 'Blocked';
  const showBackButton = user?.role === 'admin' || user?.role === 'super_admin';
  const isTelegramConnected = false; // TODO: wire to real Telegram state

  const navItems = [
    { label: t('company.dashboard'),  path: '/company' },
    { label: t('company.messages'),   path: '/company/messages' },
    ...(!permissions.isReadOnly
      ? [
          { label: t('company.growth'),   path: '/company/growth' },
          { label: t('company.reports'),  path: '/company/reports' },
        ]
      : []),
    { label: t('company.billing'),    path: '/company/billing' },
    { label: t('common.settings'),    path: '/company/settings' },
  ];

  const isActive = (path: string) =>
    path === '/company'
      ? pathname === '/company' || pathname === '/company/'
      : pathname === path || pathname.startsWith(path + '/');

  const handleLogout = async () => {
    try {
      if (isNextAuthAuthenticated) await nextAuthSignOut();
      logout();
      if (typeof window !== 'undefined') {
        [
          'next-auth.session-token',
          '__Secure-next-auth.session-token',
          'next-auth.csrf-token',
          '__Host-next-auth.csrf-token',
          'next-auth.callback-url',
          '__Secure-next-auth.callback-url',
        ].forEach((name) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        });
      }
      setTimeout(() => { window.location.href = '/'; }, 200);
    } catch {
      logout();
      setTimeout(() => { window.location.href = '/'; }, 200);
    }
  };

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'C';

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-border bg-card">
      {/* ── Main bar ── */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">

        {/* Left: back arrow + logo + company badge */}
        <div className="flex items-center gap-2 shrink-0">
          {showBackButton && (
            <button
              onClick={() => router.push('/admin')}
              className="hidden sm:flex h-8 w-8 border-2 border-border items-center justify-center hover:border-primary hover:text-primary transition-colors"
              aria-label="Back to admin"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}

          <Link
            href="/company"
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <span
              className="font-bold text-lg tracking-tight leading-none"
              style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif' }}
            >
              SAYLESS
              <span className="text-primary">.</span>
            </span>
          </Link>

          {/* Company name + code badge */}
          {company && (
            <div className="hidden sm:flex items-center gap-2 border-l-2 border-border pl-2">
              <span className="text-xs font-bold uppercase tracking-widest text-foreground truncate max-w-[120px]">
                {company.name}
              </span>
              <span className="font-mono text-[10px] border-2 border-border px-1.5 py-0.5 text-muted-foreground uppercase tracking-widest">
                {company.code}
              </span>
              {/* Telegram connection indicator */}
              <span
                className={cn(
                  'inline-block h-2 w-2 border-2',
                  isTelegramConnected
                    ? 'bg-[#00FF88] border-[#00FF88]'
                    : 'bg-transparent border-muted-foreground'
                )}
                title={isTelegramConnected ? 'Telegram connected' : 'Telegram not connected'}
              />
            </div>
          )}
        </div>

        {/* Center: desktop nav */}
        {!isCompanyBlocked && (
          <nav className="hidden lg:flex items-center gap-0" aria-label="Company navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path as any}
                className={cn(
                  'relative px-4 py-4 text-xs font-bold uppercase tracking-widest transition-colors',
                  isActive(item.path)
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right: lang + theme + user menu */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <button
            onClick={() => dispatch(toggleTheme())}
            className="h-8 w-8 border-2 border-border flex items-center justify-center text-xs font-bold hover:border-primary hover:text-primary transition-colors"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀' : '●'}
          </button>

          <HeadlessMenu as="div" className="relative">
            {() => (
              <>
                <HeadlessMenu.Button className="h-8 w-8 border-2 border-border bg-primary/10 flex items-center justify-center text-primary text-xs font-bold hover:bg-primary hover:text-black transition-colors focus:outline-none overflow-hidden">
                  {company?.logoUrl ? (
                    <Image
                      src={company.logoUrl}
                      alt={company.name || 'Logo'}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    userInitial
                  )}
                </HeadlessMenu.Button>

                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-75"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <HeadlessMenu.Items className="absolute right-0 mt-0.5 w-48 origin-top-right bg-card border-2 border-border shadow-brutal focus:outline-none z-[100]">
                    {user?.email && (
                      <div className="px-4 py-2.5 border-b-2 border-border">
                        <p className="text-[10px] font-mono text-muted-foreground truncate uppercase tracking-widest">
                          {user.email}
                        </p>
                      </div>
                    )}
                    <div className="py-1">
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <Link
                            href={'/company/settings' as any}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors',
                              active ? 'bg-primary text-black' : 'text-foreground hover:bg-muted'
                            )}
                          >
                            <FiSettings className="h-3.5 w-3.5 shrink-0" />
                            {t('company.settings')}
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={cn(
                              'w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors',
                              active ? 'bg-destructive text-white' : 'text-foreground hover:bg-muted'
                            )}
                          >
                            <FiLogOut className="h-3.5 w-3.5 shrink-0" />
                            {t('common.logout')}
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </div>
                  </HeadlessMenu.Items>
                </Transition>
              </>
            )}
          </HeadlessMenu>

          {/* Mobile hamburger — hidden for blocked companies */}
          {!isCompanyBlocked && (
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden h-11 w-11 border-2 border-border flex flex-col items-center justify-center gap-[5px] hover:border-primary transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <>
                  <span className="block w-4 h-[3px] bg-current rotate-45 translate-y-[4px]" />
                  <span className="block w-4 h-[3px] bg-current -rotate-45 -translate-y-[4px]" />
                </>
              ) : (
                <>
                  <span className="block w-4 h-[3px] bg-current" />
                  <span className="block w-4 h-[3px] bg-current" />
                  <span className="block w-4 h-[3px] bg-current" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile nav ── */}
      {mobileOpen && !isCompanyBlocked && (
        <nav className="lg:hidden border-t-2 border-border bg-card w-full" aria-label="Company mobile navigation">
          <div className="flex flex-col py-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path as any}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'w-full px-6 py-3.5 min-h-[44px] flex items-center text-xs font-bold uppercase tracking-widest transition-colors border-l-4',
                  isActive(item.path)
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="px-6 py-3 border-t-2 border-border mt-1 w-full">
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};
