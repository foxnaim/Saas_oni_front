'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Animated Counter ──────────────────────────────────────────────────────────

interface CounterProps {
  target: number;
  suffix?: string;
  duration?: number;
}

function AnimatedCounter({ target, suffix = '', duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface HeroSectionProps {
  /** Called with the entered code when the user clicks "Send Feedback". */
  onSendFeedback?: (code: string) => void;
  /** Called when the user clicks "Register Company". */
  onRegisterCompany?: () => void;
  /** Called when the user clicks "Check Status". */
  onCheckStatus?: () => void;
  /** Pre-fill the code input (e.g. from URL param). */
  initialCode?: string;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function HeroSection({
  onSendFeedback,
  onRegisterCompany,
  onCheckStatus,
  initialCode = '',
}: HeroSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [code, setCode] = useState(initialCode);

  const handleSendFeedback = () => {
    const trimmed = code.trim().toUpperCase();
    if (onSendFeedback) {
      onSendFeedback(trimmed);
    } else {
      // Fallback: navigate to send page
      router.push((trimmed ? `/?code=${encodeURIComponent(trimmed)}` : '/') as any);
    }
  };

  const handleRegisterCompany = () => {
    if (onRegisterCompany) {
      onRegisterCompany();
    } else {
      router.push('/' as any);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendFeedback();
  };

  // ─── Animation variants ──────────────────────────────────────────────────────
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: 'easeOut', delay },
    }),
  };

  const stats = [
    { value: 1240, suffix: '+', labelKey: 'welcome.heroStatsCompanies' },
    { value: 58000, suffix: '+', labelKey: 'welcome.heroStatsMessages' },
    { value: 100, suffix: '%', labelKey: 'welcome.heroStatsAnonymity' },
  ];

  return (
    <section
      className="
        relative isolate overflow-hidden
        bg-warm-white dark:bg-near-black
        border-b-2 border-near-black dark:border-neon
        min-h-[100svh] flex flex-col justify-center
      "
    >
      {/* ── Diagonal geometric accent ─────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Large angled block — top-right */}
        <div
          className="hidden sm:block absolute -right-24 -top-24 h-[480px] w-[480px] bg-neon opacity-[0.07] dark:opacity-[0.12]"
          style={{ transform: 'rotate(18deg) skewX(-8deg)' }}
        />
        {/* Thin diagonal line — bottom-left */}
        <div
          className="hidden sm:block absolute bottom-0 left-0 h-[2px] w-[60vw] bg-neon origin-bottom-left"
          style={{ transform: 'rotate(-6deg) translateY(-40px)' }}
        />
        {/* Corner bracket — top-left */}
        <div className="hidden sm:block absolute left-0 top-0 h-16 w-16 border-l-4 border-t-4 border-neon" />
        {/* Corner bracket — bottom-right */}
        <div className="hidden sm:block absolute bottom-0 right-0 h-16 w-16 border-b-4 border-r-4 border-neon" />
        {/* Vertical rule */}
        <div className="absolute right-[38%] top-0 hidden h-full w-[2px] bg-near-black/5 dark:bg-white/5 lg:block" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-[1fr_420px] lg:gap-x-16 xl:gap-x-24">

          {/* ── LEFT COLUMN — copy ──────────────────────────────────────────────── */}
          <div className="flex flex-col justify-center">

            {/* Overline tag */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <span
                className="
                  inline-block border-2 border-near-black dark:border-neon
                  bg-neon text-near-black
                  px-3 py-1 text-xs font-mono font-bold uppercase tracking-[0.2em]
                  mb-6
                "
              >
                SAYLESS — 2025
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.08}
              className="
                font-heading font-black uppercase leading-[0.9] tracking-tight
                text-[clamp(2rem,8vw,7rem)]
                text-near-black dark:text-warm-white
                mb-6
              "
            >
              {t('welcome.heroHeadline', 'SAY IT.\nSTAY HIDDEN.')}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.16}
              className="
                font-sans text-lg sm:text-xl leading-snug
                text-near-black/70 dark:text-warm-white/70
                max-w-xl mb-10
              "
            >
              {t('welcome.heroSubtitle', 'Anonymous feedback that actually changes companies')}
            </motion.p>

            {/* Tagline strip */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.22}
              className="
                inline-flex items-center gap-3 mb-12
                border-l-4 border-neon pl-4
              "
            >
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-zinc-muted dark:text-warm-white/50">
                {t('welcome.heroTagline', 'YOUR VOICE. ZERO TRACE.')}
              </span>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.3}
              className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-2 border-near-black dark:border-neon/40"
            >
              {stats.map((stat, i) => (
                <div
                  key={stat.labelKey}
                  className={`
                    flex flex-col items-start px-2 py-4 sm:px-4 sm:py-5 md:px-6
                    ${i < stats.length - 1 ? 'border-b-2 sm:border-b-0 sm:border-r-2 border-near-black dark:border-neon/40' : ''}
                  `}
                >
                  <span className="font-heading font-black text-2xl sm:text-3xl text-neon leading-none">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-near-black/50 dark:text-warm-white/40 mt-1">
                    {t(stat.labelKey)}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN — action panel ─────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.18}
            className="flex flex-col justify-center"
          >
            <div
              className="
                border-2 border-near-black dark:border-neon/60
                bg-white dark:bg-card-dark
                p-4 sm:p-8 md:p-10
                relative
              "
            >
              {/* Panel corner accent */}
              <div className="absolute -right-[2px] -top-[2px] h-8 w-8 bg-neon" />

              {/* Panel label */}
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-muted dark:text-warm-white/40 mb-6">
                // {t('welcome.companyCode', 'Company Code')}
              </p>

              {/* Input */}
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('welcome.heroInputPlaceholder', 'Enter company code')}
                maxLength={8}
                className="
                  h-14 w-full
                  border-2 border-near-black dark:border-neon/60
                  bg-warm-white dark:bg-near-black
                  text-near-black dark:text-warm-white
                  font-mono text-base tracking-widest uppercase
                  placeholder:text-near-black/30 dark:placeholder:text-warm-white/25
                  placeholder:normal-case placeholder:tracking-normal
                  rounded-none
                  focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-0
                  focus-visible:border-neon
                  transition-colors
                  mb-4
                "
              />

              {/* CTA: Send Feedback */}
              <Button
                onClick={handleSendFeedback}
                className="
                  h-14 w-full
                  rounded-none
                  bg-neon hover:bg-neon/90 active:bg-neon/80
                  text-near-black
                  font-heading font-black text-base uppercase tracking-[0.12em]
                  border-2 border-near-black dark:border-near-black
                  transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2
                  mb-3
                "
              >
                {t('welcome.heroSendFeedback', 'Send Feedback')}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="h-[1px] flex-1 bg-near-black/15 dark:bg-white/10" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-near-black/30 dark:text-white/25">
                  or
                </span>
                <div className="h-[1px] flex-1 bg-near-black/15 dark:bg-white/10" />
              </div>

              {/* CTA: Check Status */}
              {onCheckStatus && (
                <Button
                  onClick={onCheckStatus}
                  variant="outline"
                  className="
                    h-12 w-full
                    rounded-none
                    bg-transparent
                    border-2 border-near-black/40 dark:border-warm-white/30
                    text-near-black/70 dark:text-warm-white/70
                    font-heading font-bold text-sm uppercase tracking-[0.12em]
                    hover:border-neon hover:text-neon
                    transition-all duration-150
                    focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2
                    mb-3
                  "
                >
                  {t('welcome.checkStatus', 'Check Status')}
                </Button>
              )}

              {/* CTA: Register Company */}
              <Button
                onClick={handleRegisterCompany}
                variant="outline"
                className="
                  h-14 w-full
                  rounded-none
                  bg-transparent
                  border-2 border-near-black dark:border-warm-white/60
                  text-near-black dark:text-warm-white
                  font-heading font-bold text-base uppercase tracking-[0.12em]
                  hover:bg-near-black hover:text-warm-white
                  dark:hover:bg-warm-white dark:hover:text-near-black
                  transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2
                "
              >
                {t('welcome.heroRegisterCompany', 'Register Company')}
              </Button>

              {/* Bottom note */}
              <p className="font-mono text-[10px] text-near-black/30 dark:text-white/25 uppercase tracking-[0.12em] mt-6 text-center">
                {t('welcome.anonymityGuaranteed', 'Your anonymity is guaranteed')}
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
