'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface TelegramBotInfoProps {
  botUsername: string;
  className?: string;
}

const STEPS = [
  'telegram.step1',
  'telegram.step2',
  'telegram.step3',
] as const;

export function TelegramBotInfo({ botUsername, className }: TelegramBotInfoProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const botUrl = `https://t.me/${botUsername}`;
  const displayName = `@${botUsername}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = displayName;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card
      className={cn(
        'border-2 border-foreground bg-card',
        'shadow-[6px_6px_0_0_hsl(var(--foreground)/0.15)]',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TelegramIcon className="h-5 w-5 text-[#229ED9] flex-shrink-0" />
          <CardTitle className="text-base">{t('telegram.botInfo')}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* QR Code placeholder */}
        <div className="flex flex-col items-center gap-2">
          <a
            href={botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'group flex flex-col items-center justify-center gap-2',
              'h-40 w-40 border-2 border-foreground bg-muted',
              'shadow-[4px_4px_0_0_#000] transition-all duration-100',
              'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground'
            )}
            aria-label={t('telegram.openBot', { username: displayName })}
          >
            <QrPlaceholderIcon className="h-24 w-24 text-foreground/30 group-hover:text-foreground/60 transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('telegram.scanQr')}
            </span>
          </a>
          <p className="text-xs text-muted-foreground text-center max-w-[160px]">
            {t('telegram.qrDescription')}
          </p>
        </div>

        {/* Bot username with copy */}
        <div
          className={cn(
            'flex items-center justify-between gap-2 border-2 border-foreground',
            'bg-muted px-3 py-2'
          )}
        >
          <a
            href={botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-bold text-sm text-foreground hover:underline underline-offset-2 break-all"
            aria-label={t('telegram.openBot', { username: displayName })}
          >
            {displayName}
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className={cn(
              'h-8 w-8 flex-shrink-0 border-2 border-foreground bg-background',
              'shadow-[2px_2px_0_0_#000] transition-all duration-100',
              'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none',
              copied && 'bg-primary border-foreground text-black'
            )}
            aria-label={copied ? t('telegram.copied') : t('common.copy')}
            title={copied ? t('telegram.copied') : t('common.copy')}
          >
            {copied ? (
              <CheckIcon className="h-3.5 w-3.5" />
            ) : (
              <CopyIcon className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Step-by-step instructions */}
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {t('telegram.instructions')}
          </p>
          <ol className="space-y-2" aria-label={t('telegram.instructions')}>
            {STEPS.map((key, index) => (
              <li key={key} className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-6 w-6 flex-shrink-0 items-center justify-center',
                    'border-2 border-foreground bg-primary text-black',
                    'text-xs font-black'
                  )}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm text-foreground leading-snug">
                  {t(key)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Icons ── */

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

function QrPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top-left finder pattern */}
      <rect x="5" y="5" width="30" height="30" stroke="currentColor" strokeWidth="5" fill="none" />
      <rect x="14" y="14" width="12" height="12" fill="currentColor" />
      {/* Top-right finder pattern */}
      <rect x="65" y="5" width="30" height="30" stroke="currentColor" strokeWidth="5" fill="none" />
      <rect x="74" y="14" width="12" height="12" fill="currentColor" />
      {/* Bottom-left finder pattern */}
      <rect x="5" y="65" width="30" height="30" stroke="currentColor" strokeWidth="5" fill="none" />
      <rect x="14" y="74" width="12" height="12" fill="currentColor" />
      {/* Data modules (decorative) */}
      <rect x="42" y="5" width="8" height="8" fill="currentColor" />
      <rect x="54" y="5" width="8" height="8" fill="currentColor" />
      <rect x="42" y="17" width="8" height="8" fill="currentColor" />
      <rect x="42" y="42" width="8" height="8" fill="currentColor" />
      <rect x="54" y="54" width="8" height="8" fill="currentColor" />
      <rect x="42" y="66" width="8" height="8" fill="currentColor" />
      <rect x="54" y="78" width="8" height="8" fill="currentColor" />
      <rect x="66" y="42" width="8" height="8" fill="currentColor" />
      <rect x="78" y="54" width="8" height="8" fill="currentColor" />
      <rect x="66" y="66" width="8" height="8" fill="currentColor" />
      <rect x="78" y="78" width="8" height="8" fill="currentColor" />
      <rect x="66" y="78" width="8" height="8" fill="currentColor" />
      <rect x="78" y="66" width="8" height="8" fill="currentColor" />
      <rect x="5" y="42" width="8" height="8" fill="currentColor" />
      <rect x="17" y="42" width="8" height="8" fill="currentColor" />
      <rect x="5" y="54" width="8" height="8" fill="currentColor" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default TelegramBotInfo;
