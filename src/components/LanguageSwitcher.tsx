'use client';

import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'kk', label: 'KK' },
] as const;

export const LanguageSwitcher = memo(() => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? (i18n.language?.slice(0, 2) || 'ru') : 'ru';

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem('i18nextLng', code);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center gap-0">
      {LANGUAGES.map((lang, idx) => {
        const isActive = current === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              'h-8 w-10 text-xs font-bold uppercase tracking-widest transition-colors',
              'border-2 border-border focus-visible:outline-none focus-visible:ring-0',
              idx !== 0 && 'border-l-0',
              isActive
                ? 'bg-primary text-black border-primary z-10'
                : 'bg-transparent text-foreground hover:border-primary hover:text-primary'
            )}
            aria-pressed={isActive}
            aria-label={`Switch to ${lang.label}`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
});

LanguageSwitcher.displayName = 'LanguageSwitcher';
