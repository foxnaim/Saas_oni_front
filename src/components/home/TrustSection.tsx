'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ─── Animated Counter ─────────────────────────────────────────────────────────

interface CounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.44, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.42, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: 500, suffix: '+', labelKey: 'trust.stat1Label' },
  { value: 25000, suffix: '+', labelKey: 'trust.stat2Label' },
  { value: 99.9, suffix: '%', labelKey: 'trust.stat3Label', isDecimal: true },
] as const;

const BADGES = [
  { icon: '🔒', labelKey: 'trust.badge1' },
  { icon: '🛡', labelKey: 'trust.badge2' },
  { icon: '⚡', labelKey: 'trust.badge3' },
] as const;

const TESTIMONIALS = [
  {
    quoteKey: 'trust.testimonial1Quote',
    authorKey: 'trust.testimonial1Author',
    roleKey: 'trust.testimonial1Role',
  },
  {
    quoteKey: 'trust.testimonial2Quote',
    authorKey: 'trust.testimonial2Author',
    roleKey: 'trust.testimonial2Role',
  },
  {
    quoteKey: 'trust.testimonial3Quote',
    authorKey: 'trust.testimonial3Author',
    roleKey: 'trust.testimonial3Role',
  },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrustSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-near-black px-4 py-20 sm:px-8 sm:py-28 lg:px-12"
      aria-labelledby="trust-heading"
    >
      {/* Subtle noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
        }}
        aria-hidden="true"
      />

      {/* Top-right geometric accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-64 w-64 opacity-[0.06]"
        style={{
          background: '#A3E635',
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl">

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mb-14"
        >
          {/* Eyebrow */}
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
              {t('trust.eyebrow')}
            </span>
          </div>

          <h2
            id="trust-heading"
            className="font-heading font-black uppercase leading-none tracking-tight text-warm-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {t('trust.heading')}
          </h2>

          {/* Neon underline */}
          <motion.div
            className="mt-4 h-[3px] w-12"
            style={{ background: '#A3E635' }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          />
        </motion.div>

        {/* ── STATS GRID ─────────────────────────────────────────────────────── */}
        <div className="mb-14 grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.labelKey}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="flex flex-col gap-1 px-6 py-8"
              style={{ background: '#121214' }}
            >
              <span
                className="font-heading font-black leading-none"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: '#A3E635' }}
              >
                {stat.isDecimal ? (
                  <>99.9{stat.suffix}</>
                ) : (
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                )}
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-warm-white/40">
                {t(stat.labelKey)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* ── TRUST BADGES ───────────────────────────────────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mb-14 flex flex-wrap gap-3"
        >
          {BADGES.map((badge, i) => (
            <motion.span
              key={badge.labelKey}
              custom={i}
              variants={scaleIn}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="inline-flex items-center gap-2 border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-warm-white/70"
              style={{ borderColor: '#A3E635', borderWidth: '1.5px', background: 'rgba(163,230,53,0.06)' }}
            >
              <span aria-hidden="true">{badge.icon}</span>
              {t(badge.labelKey)}
            </motion.span>
          ))}
        </motion.div>

        {/* ── TESTIMONIALS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {TESTIMONIALS.map((item, i) => (
            <motion.div
              key={item.quoteKey}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="flex flex-col gap-5 p-6 sm:p-8"
              style={{ background: '#121214', borderLeft: '3px solid #A3E635' }}
            >
              {/* Quote mark */}
              <span
                className="font-heading font-black leading-none select-none"
                style={{ fontSize: '3.5rem', color: '#A3E635', opacity: 0.2, lineHeight: 1 }}
                aria-hidden="true"
              >
                "
              </span>

              <p className="flex-1 text-sm leading-relaxed text-warm-white/65">
                &ldquo;{t(item.quoteKey)}&rdquo;
              </p>

              <div className="mt-auto border-t border-white/8 pt-4">
                <p className="font-heading font-black text-sm uppercase tracking-wider text-warm-white">
                  {t(item.authorKey)}
                </p>
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: '#A3E635' }}
                >
                  {t(item.roleKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom gradient rule */}
        <motion.div
          className="mt-16 h-px w-full"
          style={{ background: 'linear-gradient(to right, #A3E635, transparent)' }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
