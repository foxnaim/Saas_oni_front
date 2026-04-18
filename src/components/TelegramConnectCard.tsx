'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface TelegramConnectCardProps {
  /** Telegram @username of the connected account, or null/undefined if not connected */
  connectedUsername?: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading?: boolean;
  className?: string;
}

const BENEFIT_KEYS = [
  'telegram.benefitNotifications',
  'telegram.benefitReply',
  'telegram.benefitStats',
  'telegram.benefitRegister',
] as const;

export function TelegramConnectCard({
  connectedUsername,
  onConnect,
  onDisconnect,
  isLoading = false,
  className,
}: TelegramConnectCardProps) {
  const { t } = useTranslation();
  const isConnected = Boolean(connectedUsername);

  return (
    <Card
      className={cn(
        'border-2 border-foreground bg-card',
        'shadow-[6px_6px_0_0_hsl(var(--primary))]',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <TelegramIcon className="h-5 w-5 text-[#229ED9] flex-shrink-0" />
            <CardTitle className="text-base">{t('telegram.integration')}</CardTitle>
          </div>
          {isConnected && (
            <Badge
              className={cn(
                'border-2 border-foreground bg-primary text-black',
                'font-bold uppercase tracking-wider text-xs',
                'shadow-[2px_2px_0_0_#000]'
              )}
            >
              {t('telegram.connected')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            {/* Connected state */}
            <div
              className={cn(
                'flex items-center gap-3 border-2 border-foreground p-3',
                'bg-primary/10'
              )}
            >
              <CheckIcon className="h-4 w-4 flex-shrink-0 text-primary" />
              <span className="font-mono font-bold text-sm text-foreground break-all">
                @{connectedUsername}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              {t('telegram.connectedDescription')}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              disabled={isLoading}
              className={cn(
                'border-2 border-foreground text-foreground',
                'hover:bg-destructive hover:text-white hover:border-destructive',
                'shadow-[3px_3px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
              )}
            >
              {isLoading ? t('common.loading') : t('telegram.disconnect')}
            </Button>
          </>
        ) : (
          <>
            {/* Disconnected state — show benefits */}
            <p className="text-sm text-muted-foreground">
              {t('telegram.connectDescription')}
            </p>

            <ul className="space-y-2" aria-label={t('telegram.benefitsLabel')}>
              {BENEFIT_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center',
                      'border-2 border-foreground bg-primary text-black text-[10px] font-black'
                    )}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-sm text-foreground leading-snug">{t(key)}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={onConnect}
              disabled={isLoading}
              className={cn(
                'w-full border-2 border-foreground bg-[#229ED9] text-white',
                'font-black uppercase tracking-widest',
                'shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
                'hover:bg-[#1a8bc4]',
                'disabled:opacity-60 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0_0_#000]'
              )}
            >
              <TelegramIcon className="h-4 w-4 flex-shrink-0" />
              {isLoading ? t('common.loading') : t('telegram.connectButton')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
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

export default TelegramConnectCard;
