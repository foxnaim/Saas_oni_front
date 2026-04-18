'use client';

import { useTranslation } from 'react-i18next';
import { FaTelegram } from 'react-icons/fa';
import { FaWhatsapp } from 'react-icons/fa';
import i18n from '@/i18n/config';

// ─── Language options ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'kk', label: 'KK' },
] as const;

// ─── Footer nav links ──────────────────────────────────────────────────────────

interface FooterLink {
  labelKey: string;
  href: string;
  external?: boolean;
  icon?: React.ReactNode;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Footer() {
  const { t } = useTranslation();

  const currentLang = i18n.language?.split('-')[0] ?? 'ru';

  const handleLangChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  const navLinks: FooterLink[] = [
    { labelKey: 'footer.links.about',   href: '/about' },
    { labelKey: 'footer.links.privacy', href: '/privacy' },
    { labelKey: 'footer.links.terms',   href: '/terms' },
    {
      labelKey: 'footer.links.support',
      href: 'https://wa.me/77000000000',
      external: true,
      icon: <FaWhatsapp className="h-4 w-4 flex-shrink-0" aria-hidden="true" />,
    },
  ];

  return (
    <footer
      className="
        bg-near-black dark:bg-near-black
        border-t-2 border-neon/40
        text-warm-white
      "
      aria-label="Site footer"
    >
      {/* ── Main grid ──────────────────────────────────────────────────────────── */}
      <div
        className="
          mx-auto max-w-7xl
          px-4 py-12 sm:px-8 lg:px-12
          grid grid-cols-1 gap-10
          sm:grid-cols-2
          lg:grid-cols-4
          lg:gap-8
          border-b border-warm-white/10
        "
      >
        {/* ── Col 1: Brand ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Logo wordmark */}
          <a
            href="/"
            className="
              inline-block
              font-heading font-black uppercase
              text-2xl tracking-tight
              text-warm-white
              hover:text-neon transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon
            "
            aria-label="Sayless — home"
          >
            SAYLESS
          </a>

          {/* Tagline */}
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-warm-white/40 leading-relaxed max-w-[200px]">
            {t('footer.tagline', 'Anonymous feedback. Zero filters.')}
          </p>

          {/* Neon accent bar */}
          <div className="h-[3px] w-12 bg-neon" aria-hidden="true" />
        </div>

        {/* ── Col 2: Navigation ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p
            className="
              font-mono text-[10px] font-bold uppercase tracking-[0.25em]
              text-neon mb-1
            "
          >
            NAV
          </p>
          <nav aria-label="Footer navigation">
            <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.labelKey}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="
                      inline-flex items-center gap-2
                      font-sans text-sm text-warm-white/60
                      border-b border-transparent
                      hover:text-neon hover:border-neon/50
                      transition-colors duration-150
                      focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon
                      pb-[1px]
                    "
                  >
                    {link.icon}
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ── Col 3: Social ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p
            className="
              font-mono text-[10px] font-bold uppercase tracking-[0.25em]
              text-neon mb-1
            "
          >
            {t('footer.followUs', 'Follow us')}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://t.me/sayless_app"
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-3
                border-2 border-warm-white/20 bg-transparent
                px-4 py-2 w-fit
                font-mono text-xs font-bold uppercase tracking-widest
                text-warm-white/70
                hover:border-neon hover:text-neon hover:bg-neon/5
                transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon
              "
              aria-label="Join Sayless on Telegram"
            >
              <FaTelegram className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              TELEGRAM
            </a>
            <a
              href="https://wa.me/77000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-3
                border-2 border-warm-white/20 bg-transparent
                px-4 py-2 w-fit
                font-mono text-xs font-bold uppercase tracking-widest
                text-warm-white/70
                hover:border-neon hover:text-neon hover:bg-neon/5
                transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon
              "
              aria-label="Contact Sayless on WhatsApp"
            >
              <FaWhatsapp className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              WHATSAPP
            </a>
          </div>
        </div>

        {/* ── Col 4: Language switcher ───────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p
            className="
              font-mono text-[10px] font-bold uppercase tracking-[0.25em]
              text-neon mb-1
            "
          >
            LANGUAGE
          </p>
          <div
            className="inline-flex border-2 border-warm-white/20 w-fit"
            role="group"
            aria-label="Language switcher"
          >
            {LANGUAGES.map((lang, idx) => {
              const isActive = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLangChange(lang.code)}
                  aria-pressed={isActive}
                  aria-label={`Switch language to ${lang.label}`}
                  className={`
                    px-4 py-2
                    font-mono text-xs font-bold uppercase tracking-widest
                    transition-all duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neon
                    ${idx > 0 ? 'border-l-2 border-warm-white/20' : ''}
                    ${
                      isActive
                        ? 'bg-neon text-near-black'
                        : 'bg-transparent text-warm-white/50 hover:text-neon hover:bg-neon/5'
                    }
                  `}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>

          {/* System status chip */}
          <div className="inline-flex items-center gap-2 mt-2">
            <span
              className="h-2 w-2 bg-neon-green animate-pulse"
              aria-hidden="true"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-warm-white/30">
              ALL SYSTEMS OPERATIONAL
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────────────── */}
      <div
        className="
          mx-auto max-w-7xl
          px-4 py-5 sm:px-8 lg:px-12
          flex flex-col sm:flex-row items-start sm:items-center justify-between
          gap-3
        "
      >
        {/* Copyright */}
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-warm-white/30">
          {t('footer.copyright', '© 2025 Sayless. All rights reserved.')}
        </p>

        {/* Build tag */}
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-warm-white/20">
          BUILT WITH&nbsp;
          <span className="text-neon/50">BRUTAL PRECISION</span>
        </p>
      </div>
    </footer>
  );
}
