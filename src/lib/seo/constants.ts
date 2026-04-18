/**
 * Константы для SEO
 */

// App Configuration
export const APP_CONFIG = {
  NAME: 'Sayless',
  VERSION: '1.0.0',
  SITE_URL: typeof window !== 'undefined' ? window.location.origin : 'https://sayless.app',
  DEFAULT_LANGUAGE: 'ru',
  SUPPORTED_LANGUAGES: ['ru', 'en', 'kk'] as const,
} as const;

