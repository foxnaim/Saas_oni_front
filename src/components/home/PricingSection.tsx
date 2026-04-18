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
    transition: { duration: 0.46, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─── Plan data ────────────────────────────────────────────────────────────────

interface PlanFeature {
  key: string;
}

interface Plan {
  id: string;
  nameKey: string;
  priceKey: string;
  periodKey: string;
  descKey: string;
  features: PlanFeature[];
  ctaKey: string;
  popular: boolean;
  highlight: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    nameKey: 'pricing.plan1Name',
    priceKey: 'pricing.plan1Price',
    periodKey: 'pricing.plan1Period',
    descKey: 'pricing.plan1Desc',
    features: [
      { key: 'pricing.plan1Feat1' },
      { key: 'pricing.plan1Feat2' },
      { key: 'pricing.plan1Feat3' },
    ],
    ctaKey: 'pricing.plan1CTA',
    popular: false,
    highlight: false,
  },
  {
    id: 'standard',
    nameKey: 'pricing.plan2Name',
    priceKey: 'pricing.plan2Price',
    periodKey: 'pricing.plan2Period',
    descKey: 'pricing.plan2Desc',
    features: [
      { key: 'pricing.plan2Feat1' },
      { key: 'pricing.plan2Feat2' },
      { key: 'pricing.plan2Feat3' },
      { key: 'pricing.plan2Feat4' },
    ],
    ctaKey: 'pricing.plan2CTA',
    popular: true,
    highlight: true,
  },
  {
    id: 'pro',
    nameKey: 'pricing.plan3Name',
    priceKey: 'pricing.plan3Price',
    periodKey: 'pricing.plan3Period',
    descKey: 'pricing.plan3Desc',
    features: [
      { key: 'pricing.plan3Feat1' },
      { key: 'pricing.plan3Feat2' },
      { key: 'pricing.plan3Feat3' },
      { key: 'pricing.plan3Feat4' },
      { key: 'pricing.plan3Feat5' },
    ],
    ctaKey: 'pricing.plan3CTA',
    popular: false,
    highlight: false,
  },
];

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: Plan;
  index: number;
  inView: boolean;
}

function PlanCard({ plan, index, inView }: PlanCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className="relative flex flex-col"
      style={{
        border: plan.highlight ? '2px solid #A3E635' : '2px solid rgba(255,255,255,0.12)',
        background: plan.highlight ? 'rgba(163,230,53,0.05)' : 'rgba(255,255,255,0.02)',
        boxShadow: plan.highlight
          ? '6px 6px 0px #A3E635'
          : '4px 4px 0px rgba(255,255,255,0.08)',
      }}
    >
      {/* POPULAR badge */}
      {plan.popular && (
        <div
          className="absolute -top-px left-6 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-near-black"
          style={{ background: '#A3E635' }}
        >
          {t('pricing.popularBadge')}
        </div>
      )}

      {/* Corner accent for highlighted card */}
      {plan.highlight && (
        <div
          className="absolute -right-px -top-px h-6 w-6"
          style={{ background: '#A3E635' }}
          aria-hidden="true"
        />
      )}

      {/* Plan header */}
      <div className="p-7 pb-5">
        <p
          className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: plan.highlight ? '#A3E635' : 'rgba(255,255,255,0.4)' }}
        >
          {t(plan.nameKey)}
        </p>

        <div className="flex items-end gap-1">
          <span
            className="font-heading font-black leading-none text-warm-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)' }}
          >
            {t(plan.priceKey)}
          </span>
          <span className="mb-1 font-mono text-xs text-warm-white/40 uppercase tracking-wider">
            {t(plan.periodKey)}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-warm-white/50">
          {t(plan.descKey)}
        </p>
      </div>

      {/* Divider */}
      <div
        className="mx-7 h-px"
        style={{ background: plan.highlight ? 'rgba(163,230,53,0.3)' : 'rgba(255,255,255,0.08)' }}
        aria-hidden="true"
      />

      {/* Features list */}
      <ul className="flex flex-1 flex-col gap-3 p-7 pt-5">
        {plan.features.map((feat) => (
          <li key={feat.key} className="flex items-start gap-3 text-sm text-warm-white/65">
            <span
              className="mt-px flex-shrink-0 font-mono font-bold"
              style={{ color: '#A3E635' }}
              aria-hidden="true"
            >
              ✓
            </span>
            {t(feat.key)}
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <div className="p-7 pt-0">
        <button
          type="button"
          className="
            w-full px-6 py-3
            font-heading font-black text-sm uppercase tracking-[0.12em]
            transition-all duration-150 active:scale-[0.97]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          "
          style={
            plan.highlight
              ? {
                  background: '#A3E635',
                  color: '#121214',
                  border: '2px solid #A3E635',
                }
              : {
                  background: 'transparent',
                  color: '#FAFAF9',
                  border: '2px solid rgba(255,255,255,0.3)',
                }
          }
          onMouseEnter={(e) => {
            if (!plan.highlight) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#A3E635';
              (e.currentTarget as HTMLButtonElement).style.color = '#A3E635';
            }
          }}
          onMouseLeave={(e) => {
            if (!plan.highlight) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)';
              (e.currentTarget as HTMLButtonElement).style.color = '#FAFAF9';
            }
          }}
        >
          {t(plan.ctaKey)}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PricingSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-near-black px-4 py-20 sm:px-8 sm:py-28 lg:px-12"
      aria-labelledby="pricing-heading"
    >
      {/* Subtle background texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl">

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mb-16 text-center"
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
              {t('pricing.eyebrow')}
            </span>
            <span
              className="block h-[3px] w-4"
              style={{ background: '#A3E635' }}
              aria-hidden="true"
            />
          </div>

          <h2
            id="pricing-heading"
            className="font-heading font-black uppercase leading-none tracking-tight text-warm-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {t('pricing.heading')}
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-warm-white/50">
            {t('pricing.subheading')}
          </p>
        </motion.div>

        {/* ── PLAN CARDS ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} inView={inView} />
          ))}
        </div>

        {/* Fine print */}
        <motion.p
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-10 text-center font-mono text-xs uppercase tracking-[0.15em] text-warm-white/25"
        >
          {t('pricing.finePrint')}
        </motion.p>

        {/* Bottom gradient rule */}
        <motion.div
          className="mt-12 h-px w-full"
          style={{ background: 'linear-gradient(to right, #A3E635, transparent)' }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
