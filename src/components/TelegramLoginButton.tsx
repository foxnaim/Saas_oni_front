'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/cn';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth?: (user: TelegramUser) => void;
    };
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export function TelegramLoginButton({ botName, onAuth, className }: TelegramLoginButtonProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetFailed, setWidgetFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const onAuthRef = useRef(onAuth);

  useEffect(() => {
    onAuthRef.current = onAuth;
  }, [onAuth]);

  const handleFallback = useCallback(() => {
    setWidgetFailed(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!botName) return;

    // Expose callback globally for Telegram widget
    window.onTelegramAuth = (user: TelegramUser) => {
      onAuthRef.current(user);
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    const timer = setTimeout(() => {
      handleFallback();
    }, 5000);

    script.onload = () => {
      clearTimeout(timer);
      setLoading(false);
    };

    script.onerror = () => {
      clearTimeout(timer);
      handleFallback();
    };

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }

    return () => {
      clearTimeout(timer);
      delete window.onTelegramAuth;
    };
  }, [botName, handleFallback]);

  const telegramUrl = `https://t.me/${botName}`;

  if (widgetFailed) {
    return (
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-3 border-2 border-foreground bg-[#229ED9] px-5 py-3',
          'font-bold uppercase tracking-widest text-white',
          'shadow-[4px_4px_0_0_#000] transition-all duration-100',
          'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground',
          className
        )}
        aria-label={t('telegram.openTelegram')}
      >
        <TelegramIcon className="h-5 w-5 flex-shrink-0" />
        <span>{t('telegram.openTelegram')}</span>
      </a>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {loading && (
        <div
          className={cn(
            'inline-flex items-center gap-3 border-2 border-foreground bg-[#229ED9] px-5 py-3',
            'font-bold uppercase tracking-widest text-white opacity-60',
            'shadow-[4px_4px_0_0_#000]'
          )}
          aria-live="polite"
          aria-label={t('common.loading')}
        >
          <TelegramIcon className="h-5 w-5 flex-shrink-0 animate-pulse" />
          <span>{t('common.loading')}</span>
        </div>
      )}
      <div
        ref={containerRef}
        className={cn('telegram-widget-container', loading && 'sr-only')}
        aria-label={t('telegram.loginWith')}
      />
    </div>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export default TelegramLoginButton;
