'use client';

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

// ── Section components ─────────────────────────────────────────────────────────
import HeroSection from "@/components/home/HeroSection";
import TrustSection from "@/components/home/TrustSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import PricingSection from "@/components/home/PricingSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";

// ── Modal components ───────────────────────────────────────────────────────────
import SendMessageModal from "@/components/pages/SendMessageModal";
import CheckStatusModal from "@/components/pages/CheckStatusModal";
import LoginModal from "@/components/pages/LoginModal";
import RegisterModal from "@/components/pages/RegisterModal";

// ── SEO ────────────────────────────────────────────────────────────────────────
import { SEO, WebsiteStructuredData, OrganizationStructuredData } from "@/lib/seo";

// ── Types ──────────────────────────────────────────────────────────────────────
import type { Company } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface WelcomeProps {
  /** Pre-validated 8-char company code from the URL segment (e.g. /[code]). */
  initialCompanyCode?: string;
  /** Company data fetched server-side — skips the client-side lookup. */
  initialCompany?: Company | null;
  /** Public companies list fetched server-side for SEO hydration. */
  publicCompanies?: Array<{ id: string; name: string; code: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Welcome({
  initialCompanyCode,
  initialCompany,
  publicCompanies: _publicCompanies,
}: WelcomeProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // ── Modal visibility state ──────────────────────────────────────────────────
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
  const [isCheckStatusOpen, setIsCheckStatusOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // ── Active company for SendMessageModal ────────────────────────────────────
  const [activeCompany, setActiveCompany] = useState<{
    code: string;
    name: string;
    plan?: string;
  } | null>(
    initialCompany
      ? {
          code: initialCompany.code,
          name: initialCompany.name,
          plan: initialCompany.plan,
        }
      : null,
  );

  // ── Auto-open SendMessageModal when a companyCode comes from URL ─────────
  useEffect(() => {
    const isBlocked = initialCompany?.status === "Blocked";
    if (initialCompanyCode && initialCompany && !isBlocked) {
      setActiveCompany({
        code: initialCompany.code,
        name: initialCompany.name,
        plan: initialCompany.plan,
      });
      setIsSendMessageOpen(true);
    }
  }, [initialCompanyCode, initialCompany]);

  // ── Handle ?register=true in URL ───────────────────────────────────────────
  useEffect(() => {
    if (searchParams.get("register") === "true") {
      setIsRegisterOpen(true);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("register");
      const url = window.location.pathname + (next.toString() ? `?${next.toString()}` : "");
      window.history.replaceState({}, "", url);
    }
  }, [searchParams]);

  // ── HeroSection callbacks ──────────────────────────────────────────────────
  const handleSendFeedback = useCallback(
    (code: string) => {
      // If we have a known company from props, use it directly.
      // Otherwise the SendMessageModal will handle its own code lookup.
      if (initialCompany && code === initialCompany.code.toUpperCase()) {
        setActiveCompany({
          code: initialCompany.code,
          name: initialCompany.name,
          plan: initialCompany.plan,
        });
      } else {
        // Pass the raw code; SendMessageModal manages its own validation.
        setActiveCompany(code ? { code, name: "", plan: undefined } : null);
      }
      setIsSendMessageOpen(true);
    },
    [initialCompany],
  );

  const handleRegisterCompany = useCallback(() => {
    setIsRegisterOpen(true);
  }, []);

  const handleCheckStatus = useCallback(() => {
    setIsCheckStatusOpen(true);
  }, []);

  const handleSendSuccess = useCallback(() => {
    setActiveCompany(null);
  }, []);

  // ── CTASection "Start Free" callback ──────────────────────────────────────
  // CTASection currently uses internal buttons — keep them as-is for now.

  return (
    <>
      {/* SEO */}
      <SEO
        title={t("welcome.title", {
          defaultValue: "Send anonymous feedback to your company",
        })}
        description={t("welcome.subtitle", {
          defaultValue:
            "Share honest thoughts, complaints, praise or suggestions without revealing your identity. Your voice matters, and we maintain complete confidentiality.",
        })}
        keywords="anonymous feedback, HR, complaints, suggestions, anonymity, confidentiality, feedback"
      />
      <WebsiteStructuredData />
      <OrganizationStructuredData />

      {/* ── Page shell: full-height scroll container ──────────────────────── */}
      <div className="flex min-h-screen flex-col bg-background">

        {/* ── DIVIDER: top of page (implicit — no explicit top border needed) ── */}

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <HeroSection
          initialCode={initialCompanyCode ?? searchParams.get("code") ?? ""}
          onSendFeedback={handleSendFeedback}
          onRegisterCompany={handleRegisterCompany}
          onCheckStatus={handleCheckStatus}
        />

        {/* ── SHARP DIVIDER ─────────────────────────────────────────────────── */}
        <div className="h-1 w-full bg-foreground" aria-hidden="true" />

        {/* ── TRUST / SOCIAL PROOF ─────────────────────────────────────────── */}
        <TrustSection />

        {/* ── SHARP DIVIDER ─────────────────────────────────────────────────── */}
        <div className="h-1 w-full bg-foreground" aria-hidden="true" />

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <HowItWorksSection />

        {/* ── SHARP DIVIDER ─────────────────────────────────────────────────── */}
        <div className="h-1 w-full bg-foreground" aria-hidden="true" />

        {/* ── FEATURES ─────────────────────────────────────────────────────── */}
        <FeaturesSection />

        {/* ── SHARP DIVIDER ─────────────────────────────────────────────────── */}
        <div className="h-1 w-full bg-foreground" aria-hidden="true" />

        {/* ── PRICING ──────────────────────────────────────────────────────── */}
        <PricingSection />

        {/* ── SHARP DIVIDER ─────────────────────────────────────────────────── */}
        <div className="h-1 w-full bg-foreground" aria-hidden="true" />

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <CTASection />

        {/* ── SHARP DIVIDER ─────────────────────────────────────────────────── */}
        <div className="h-1 w-full bg-foreground" aria-hidden="true" />

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <Footer />
      </div>

      {/* ════════════════════════════════════════════════════════════
          MODALS  (rendered outside the scroll container so they
          always overlay the full viewport)
      ════════════════════════════════════════════════════════════ */}

      <SendMessageModal
        open={isSendMessageOpen}
        onOpenChange={setIsSendMessageOpen}
        companyCode={activeCompany?.code ?? ""}
        companyName={activeCompany?.name ?? ""}
        companyPlan={activeCompany?.plan}
        onSuccess={handleSendSuccess}
      />

      <CheckStatusModal
        open={isCheckStatusOpen}
        onOpenChange={setIsCheckStatusOpen}
      />

      <LoginModal
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
      />

      <RegisterModal
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
      />
    </>
  );
}
