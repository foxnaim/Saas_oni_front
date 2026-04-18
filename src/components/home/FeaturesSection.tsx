'use client';

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "react-i18next";

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUpVariant = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stepVariant = {
  hidden: { opacity: 0, x: -24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─── Data ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    titleKey: "features.step01Title",
    descKey: "features.step01Desc",
  },
  {
    number: "02",
    titleKey: "features.step02Title",
    descKey: "features.step02Desc",
  },
  {
    number: "03",
    titleKey: "features.step03Title",
    descKey: "features.step03Desc",
  },
] as const;

const FEATURE_CARDS = [
  {
    icon: "🔒",
    titleKey: "features.feat01Title",
    descKey: "features.feat01Desc",
  },
  {
    icon: "📱",
    titleKey: "features.feat02Title",
    descKey: "features.feat02Desc",
  },
  {
    icon: "📊",
    titleKey: "features.feat03Title",
    descKey: "features.feat03Desc",
  },
  {
    icon: "🌍",
    titleKey: "features.feat04Title",
    descKey: "features.feat04Desc",
  },
  {
    icon: "⚡",
    titleKey: "features.feat05Title",
    descKey: "features.feat05Desc",
  },
  {
    icon: "💳",
    titleKey: "features.feat06Title",
    descKey: "features.feat06Desc",
  },
] as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 mb-6">
      {/* Neon left tick */}
      <span
        className="block w-4 h-[3px]"
        style={{ background: "#CCFF00" }}
        aria-hidden="true"
      />
      <span
        className="text-xs font-mono font-bold tracking-[0.25em] uppercase"
        style={{ color: "#CCFF00" }}
      >
        {label}
      </span>
    </div>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  desc: string;
  index: number;
  inView: boolean;
}

function StepCard({ number, title, desc, index, inView }: StepCardProps) {
  return (
    <motion.div
      className="relative flex flex-col gap-3 p-6 border border-white/10 bg-white/[0.03]"
      style={{ borderLeft: "3px solid #CCFF00" }}
      custom={index}
      variants={stepVariant}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {/* Big bold number */}
      <span
        className="font-heading font-black leading-none select-none"
        style={{
          fontSize: "clamp(3.5rem, 8vw, 5rem)",
          color: "#CCFF00",
          opacity: 0.18,
          lineHeight: 1,
          userSelect: "none",
          position: "absolute",
          top: "1rem",
          right: "1.25rem",
        }}
        aria-hidden="true"
      >
        {number}
      </span>

      <p
        className="text-xs font-mono font-bold tracking-[0.2em] uppercase"
        style={{ color: "#CCFF00" }}
      >
        {number}
      </p>

      <h3 className="font-heading font-black text-xl uppercase tracking-tight text-white leading-tight">
        {title}
      </h3>

      <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  index: number;
  inView: boolean;
}

function FeatureCard({ icon, title, desc, index, inView }: FeatureCardProps) {
  return (
    <motion.div
      className="group flex flex-col gap-3 p-5 border border-white/10 bg-white/[0.03] cursor-default"
      style={{ borderLeft: "3px solid #CCFF00" }}
      custom={index}
      variants={fadeUpVariant}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover={{
        x: 4,
        boxShadow: "0 0 0 1px #CCFF00, 0 0 18px 0px rgba(204,255,0,0.18)",
        transition: { duration: 0.18, ease: "easeOut" },
      }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <span className="text-2xl leading-none" role="img" aria-hidden="true">
          {icon}
        </span>

        {/* Title */}
        <span className="font-heading font-black text-sm uppercase tracking-widest text-white">
          {title}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-white/55 leading-relaxed">{desc}</p>

      {/* Neon bottom rule — reveals on hover */}
      <span
        className="block h-px w-0 group-hover:w-full transition-all duration-300"
        style={{ background: "#CCFF00", opacity: 0.4 }}
        aria-hidden="true"
      />
    </motion.div>
  );
}

// ─── Main section ────────────────────────────────────────────────────────────

export default function FeaturesSection() {
  const { t } = useTranslation();

  const stepsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const stepsInView = useInView(stepsRef, { once: true, margin: "-80px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });

  return (
    <section
      className="relative w-full px-6 py-24 sm:py-32 lg:px-8"
      aria-labelledby="how-it-works-heading"
    >
      {/* ── Subtle noise texture overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%23fff'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl">

        {/* ══════════════════════════════════════════════
            SECTION HEADER
        ══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionLabel label={t("features.sectionLabel")} />

          <h2
            id="how-it-works-heading"
            className="font-heading font-black uppercase tracking-[0.08em] text-white leading-none"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)" }}
          >
            {t("features.sectionTitle")}
          </h2>

          {/* Neon underline rule */}
          <motion.div
            className="mt-4 h-[3px] w-16"
            style={{ background: "#CCFF00" }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          />

          <p className="mt-6 max-w-xl text-base text-white/55 leading-relaxed">
            {t("features.sectionSubtitle")}
          </p>
        </motion.div>

        {/* ══════════════════════════════════════════════
            THREE-STEP GRID
        ══════════════════════════════════════════════ */}
        <div
          ref={stepsRef}
          className="mt-16 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3"
          style={{ background: "rgba(255,255,255,0.06)" }}
          role="list"
          aria-label={t("features.stepsAriaLabel")}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              role="listitem"
              style={{ background: "#0A0A0A" }}
            >
              <StepCard
                number={step.number}
                title={t(step.titleKey)}
                desc={t(step.descKey)}
                index={i}
                inView={stepsInView}
              />
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            FEATURES GRID
        ══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20"
        >
          <SectionLabel label={t("features.featuresLabel")} />

          <h3 className="font-heading font-black uppercase tracking-[0.06em] text-white text-2xl sm:text-3xl mb-10">
            {t("features.featuresTitle")}
          </h3>
        </motion.div>

        <div
          ref={featuresRef}
          className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3"
          style={{ background: "rgba(255,255,255,0.06)" }}
          role="list"
          aria-label={t("features.featuresAriaLabel")}
        >
          {FEATURE_CARDS.map((card, i) => (
            <div
              key={card.titleKey}
              role="listitem"
              style={{ background: "#0A0A0A" }}
            >
              <FeatureCard
                icon={card.icon}
                title={t(card.titleKey)}
                desc={t(card.descKey)}
                index={i}
                inView={featuresInView}
              />
            </div>
          ))}
        </div>

        {/* ── Bottom neon rule ── */}
        <motion.div
          className="mt-16 h-px w-full"
          style={{ background: "linear-gradient(to right, #CCFF00, transparent)" }}
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
