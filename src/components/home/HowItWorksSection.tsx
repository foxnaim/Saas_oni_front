'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] },
  }),
};

const lineGrow = {
  hidden: { scaleX: 0, originX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── CSS Art Illustrations (pure CSS geometric shapes) ────────────────────────

function IllustrationRegister() {
  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center" aria-hidden="true">
      {/* Outer border square */}
      <div
        className="absolute inset-0 border-2"
        style={{ borderColor: '#A3E635' }}
      />
      {/* Inner rotated square */}
      <div
        className="absolute h-12 w-12 border-2"
        style={{ borderColor: '#A3E635', opacity: 0.35, transform: 'rotate(45deg)' }}
      />
      {/* Center dot */}
      <div
        className="h-3 w-3"
        style={{ background: '#A3E635' }}
      />
      {/* Corner accent — top-right */}
      <div
        className="absolute -right-1 -top-1 h-3 w-3"
        style={{ background: '#A3E635' }}
      />
    </div>
  );
}

function IllustrationShare() {
  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center" aria-hidden="true">
      {/* Three horizontal bars — "share" metaphor */}
      <div className="flex flex-col gap-2 w-full px-3">
        <div className="h-[3px] w-full" style={{ background: '#A3E635' }} />
        <div className="h-[3px] w-3/4" style={{ background: '#A3E635', opacity: 0.6 }} />
        <div className="h-[3px] w-1/2" style={{ background: '#A3E635', opacity: 0.35 }} />
      </div>
      {/* Right-pointing triangle */}
      <div
        className="absolute -right-2 top-1/2 -translate-y-1/2"
        style={{
          width: 0,
          height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: '10px solid #A3E635',
        }}
      />
      {/* Outer border */}
      <div
        className="absolute inset-0 border"
        style={{ borderColor: 'rgba(163,230,53,0.3)' }}
      />
    </div>
  );
}

function IllustrationRespond() {
  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center" aria-hidden="true">
      {/* Message bubble — bottom-left open corner */}
      <div
        className="absolute inset-2 border-2"
        style={{ borderColor: '#A3E635' }}
      />
      {/* Tick / checkmark */}
      <svg
        width="28"
        height="20"
        viewBox="0 0 28 20"
        fill="none"
        className="relative z-10"
        aria-hidden="true"
      >
        <polyline
          points="2,10 10,18 26,2"
          stroke="#A3E635"
          strokeWidth="3"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
        />
      </svg>
      {/* Corner accent */}
      <div
        className="absolute -bottom-1 -right-1 h-3 w-3"
        style={{ background: '#A3E635' }}
      />
    </div>
  );
}

const ILLUSTRATIONS = [IllustrationRegister, IllustrationShare, IllustrationRespond];

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS = [
  { num: '01', titleKey: 'howItWorks.step1Title', descKey: 'howItWorks.step1Desc' },
  { num: '02', titleKey: 'howItWorks.step2Title', descKey: 'howItWorks.step2Desc' },
  { num: '03', titleKey: 'howItWorks.step3Title', descKey: 'howItWorks.step3Desc' },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HowItWorksSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-warm-white dark:bg-near-black px-4 py-20 sm:px-8 sm:py-28 lg:px-12"
      aria-labelledby="how-it-works-heading"
    >
      {/* Diagonal geometric accent — bottom-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 opacity-[0.05] dark:opacity-[0.08]"
        style={{
          background: '#A3E635',
          clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl">

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mb-16"
        >
          <div className="mb-4 inline-flex items-center gap-2">
            <span
              className="block h-[3px] w-4"
              style={{ background: '#A3E635' }}
              aria-hidden="true"
            />
            <span
              className="font-mono text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: '#A3E635' }}
            >
              {t('howItWorks.eyebrow')}
            </span>
          </div>

          <h2
            id="how-it-works-heading"
            className="font-heading font-black uppercase leading-none tracking-tight text-near-black dark:text-warm-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {t('howItWorks.heading')}
          </h2>

          <motion.div
            className="mt-4 h-[3px] w-12"
            style={{ background: '#A3E635' }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          />

          <p className="mt-5 max-w-xl text-base leading-relaxed text-near-black/55 dark:text-warm-white/50">
            {t('howItWorks.subheading')}
          </p>
        </motion.div>

        {/* ── STEPS ──────────────────────────────────────────────────────────── */}
        <div className="relative grid grid-cols-1 gap-0 md:grid-cols-3">

          {/* Connecting line (desktop only) */}
          <motion.div
            className="pointer-events-none absolute left-[16.66%] right-[16.66%] hidden h-[2px] md:block"
            style={{
              top: '3rem', /* align with illustration centres */
              background: 'repeating-linear-gradient(to right, #A3E635 0, #A3E635 6px, transparent 6px, transparent 14px)',
              opacity: 0.4,
            }}
            variants={lineGrow}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            aria-hidden="true"
          />

          {STEPS.map((step, i) => {
            const Illustration = ILLUSTRATIONS[i];
            return (
              <motion.div
                key={step.num}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="
                  relative flex flex-col items-center gap-6 p-8
                  border border-near-black/10 dark:border-white/8
                  bg-white dark:bg-white/[0.02]
                  text-center
                "
                style={{ borderLeft: i > 0 ? 'none' : undefined }}
              >
                {/* Step number — large ghost text */}
                <span
                  className="pointer-events-none absolute right-4 top-4 font-heading font-black select-none leading-none"
                  style={{ fontSize: 'clamp(3rem,7vw,4.5rem)', color: '#A3E635', opacity: 0.08 }}
                  aria-hidden="true"
                >
                  {step.num}
                </span>

                {/* CSS Art illustration */}
                <Illustration />

                {/* Step number label */}
                <span
                  className="font-mono text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ color: '#A3E635' }}
                >
                  {step.num}
                </span>

                <h3 className="font-heading font-black text-lg uppercase tracking-wide text-near-black dark:text-warm-white">
                  {t(step.titleKey)}
                </h3>

                <p className="text-sm leading-relaxed text-near-black/55 dark:text-warm-white/50">
                  {t(step.descKey)}
                </p>

                {/* Arrow connector (mobile) */}
                {i < STEPS.length - 1 && (
                  <div
                    className="mt-2 flex justify-center md:hidden"
                    aria-hidden="true"
                  >
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '10px solid #A3E635',
                        opacity: 0.5,
                      }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom gradient rule */}
        <motion.div
          className="mt-16 h-px w-full"
          style={{ background: 'linear-gradient(to right, #A3E635, transparent)' }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
