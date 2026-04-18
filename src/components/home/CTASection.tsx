'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaTelegram } from 'react-icons/fa';

// ─── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const lineGrow = {
  hidden: { scaleX: 0, originX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.1 },
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CTASection() {
  const { t } = useTranslation();

  return (
    <section
      className="
        relative overflow-hidden
        bg-near-black dark:bg-near-black
        border-t-4 border-neon
      "
      aria-labelledby="cta-headline"
    >
      {/* Neon top accent line (animated) */}
      <motion.div
        className="absolute top-0 left-0 w-full h-[4px] bg-neon"
        variants={lineGrow}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        aria-hidden="true"
      />

      {/* Corner brackets — brutalist decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute top-6 left-6 h-10 w-10 border-l-2 border-t-2 border-neon/40" />
        <div className="absolute top-6 right-6 h-10 w-10 border-r-2 border-t-2 border-neon/40" />
        <div className="absolute bottom-6 left-6 h-10 w-10 border-l-2 border-b-2 border-neon/40" />
        <div className="absolute bottom-6 right-6 h-10 w-10 border-r-2 border-b-2 border-neon/40" />
      </div>

      {/* Background geometric accent block */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/2 -translate-y-1/2 h-[320px] w-[320px] bg-neon opacity-[0.04]"
        style={{ transform: 'rotate(22deg) skewX(-6deg) translateY(-50%)' }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <motion.div
          className="flex flex-col items-center text-center gap-y-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Eyebrow label */}
          <motion.div variants={fadeUp}>
            <span
              className="
                inline-block
                border-2 border-neon bg-neon
                text-near-black
                px-3 py-1
                font-mono text-xs font-bold uppercase tracking-[0.2em]
              "
            >
              SAYLESS — FREE TRIAL
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h2
            id="cta-headline"
            variants={fadeUp}
            className="
              font-heading font-black uppercase
              text-[clamp(2.4rem,6vw,5.5rem)]
              leading-[0.9] tracking-tight
              text-warm-white
            "
          >
            {t('cta.headline', 'READY TO HEAR THE TRUTH?')}
          </motion.h2>

          {/* Horizontal divider */}
          <motion.div
            variants={fadeUp}
            className="w-full max-w-xs h-[2px] bg-neon/30"
            aria-hidden="true"
          />

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="
              font-sans text-lg sm:text-xl leading-snug
              text-warm-white/60
              max-w-xl
            "
          >
            {t(
              'cta.subtitle',
              'Start your free trial today — no credit card required. Real feedback, zero filters.',
            )}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
          >
            {/* Primary: neon lime */}
            <button
              type="button"
              className="
                relative group
                inline-flex items-center justify-center gap-2
                border-2 border-neon bg-neon
                text-near-black font-heading font-black uppercase
                text-base tracking-widest
                px-8 py-4
                transition-all duration-150
                hover:bg-transparent hover:text-neon
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-near-black
                active:scale-[0.97]
                animate-pulse-neon
              "
            >
              {t('cta.startFree', 'Start Free')}
              {/* Micro arrow accent */}
              <span className="font-mono text-lg leading-none">→</span>
            </button>

            {/* Secondary: outline with Telegram icon */}
            <button
              type="button"
              className="
                inline-flex items-center justify-center gap-3
                border-2 border-warm-white/30 bg-transparent
                text-warm-white font-heading font-bold uppercase
                text-base tracking-widest
                px-8 py-4
                transition-all duration-150
                hover:border-neon hover:text-neon
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-near-black
                active:scale-[0.97]
              "
            >
              <FaTelegram className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {t('cta.connectTelegram', 'Connect Telegram')}
            </button>
          </motion.div>

          {/* Fine print */}
          <motion.p
            variants={fadeUp}
            className="font-mono text-xs text-warm-white/30 uppercase tracking-[0.15em]"
          >
            NO CREDIT CARD &nbsp;·&nbsp; NO SETUP FEE &nbsp;·&nbsp; CANCEL ANYTIME
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom border accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-neon/50 to-transparent" aria-hidden="true" />
    </section>
  );
}
