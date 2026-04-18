'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/lib/redux';
import { useNextAuth } from '@/lib/hooks/useNextAuth';
import { useAppDispatch, useAppSelector, toggleTheme } from '@/lib';
import { cn } from '@/lib/utils/cn';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const AdminHeader = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { signOut: nextAuthSignOut, isAuthenticated: isNextAuthAuthenticated } = useNextAuth();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNavItems = [
    { key: 'dashboard',  label: t('admin.companies'),  path: '/admin' },
    { key: 'analytics',  label: t('admin.analytics'),  path: '/admin/analytics' },
    { key: 'messages',   label: t('admin.messages'),   path: '/admin/messages' },
    { key: 'companies',  label: t('admin.companies'),  path: '/admin' },
    { key: 'plans',      label: t('admin.plans'),      path: '/admin/plans' },
    { key: 'settings',   label: t('common.settings'),  path: '/admin/settings' },
    { key: 'admins',     label: t('admin.admins'),     path: '/admin/admins', superOnly: true },
  ];

  // Deduplicate: show unique paths; filter super_admin-only if not super_admin
  const seen = new Set<string>();
  const navItems = allNavItems.filter((item) => {
    if (item.superOnly && user?.role !== 'super_admin') return false;
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });

  const isActive = (path: string) =>
    path === '/admin'
      ? pathname === '/admin' || pathname === '/admin/'
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
    'A';

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-border bg-card">
      {/* ── Main bar ── */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">

        {/* Left: logo + ADMIN badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1 shrink-0"
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
          <span className="hidden sm:inline-block border-2 border-border px-1.5 py-0.5 text-[10px] font-bold tracking-widest uppercase text-muted-foreground font-mono">
            ADMIN
          </span>
        </div>

        {/* Center: desktop nav */}
        <nav className="hidden lg:flex items-center gap-0" aria-label="Admin navigation">
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

        {/* Right: lang switcher + theme toggle + user menu */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="h-8 w-8 border-2 border-border flex items-center justify-center text-xs font-bold hover:border-primary hover:text-primary transition-colors"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀' : '●'}
          </button>

          {/* User menu */}
          <HeadlessMenu as="div" className="relative">
            {() => (
              <>
                <HeadlessMenu.Button className="h-8 w-8 border-2 border-border bg-primary/10 flex items-center justify-center text-primary text-xs font-bold hover:bg-primary hover:text-black transition-colors focus:outline-none">
                  {userInitial}
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
                            href={'/admin/settings' as any}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors',
                              active ? 'bg-primary text-black' : 'text-foreground hover:bg-muted'
                            )}
                          >
                            <FiSettings className="h-3.5 w-3.5 shrink-0" />
                            {t('common.settings')}
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

          {/* Mobile hamburger */}
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
        </div>
      </div>

      {/* ── Mobile nav ── */}
      {mobileOpen && (
        <nav className="lg:hidden border-t-2 border-border bg-card w-full" aria-label="Admin mobile navigation">
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
