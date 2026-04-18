'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useCompany,
  usePlans,
  useFreePlanSettings,
  useUpdateCompanyPlan,
  useVerifyPayment,
} from "@/lib/query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FiCheck, FiLock, FiArrowRight, FiZap, FiAlertTriangle } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { toast } from "sonner";
import { getTranslatedValue } from "@/lib/utils/translations";
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";
import PaymentModal from "./PaymentModal";

/* ─── helpers ────────────────────────────────────────────────────────────── */

const NEON = "#CCFF00";
const BLACK = "#0A0A0A";

const getDaysText = (days: number, t: (k: string) => string, lang: string): string => {
  if (lang.startsWith("ru")) {
    if (days === 1) return t("admin.day");
    if (days > 1 && days < 5) return t("admin.days2");
    return t("admin.days");
  }
  if (lang.startsWith("kk")) return t("company.day");
  return days === 1 ? "day" : "days";
};

/* ─── component ──────────────────────────────────────────────────────────── */

const CompanyBilling = () => {
  const { isFullscreen } = useFullscreenContext();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    planId: string;
    planName: string;
    planPrice: number;
  }>({ open: false, planId: "", planName: "", planPrice: 0 });

  const { data: company, isLoading: companyLoading, refetch: refetchCompany } =
    useCompany(user?.companyId || 0, { enabled: !!user?.companyId });
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: freePlanSettings, isLoading: freePlanSettingsLoading } = useFreePlanSettings();

  const { mutate: updatePlan } = useUpdateCompanyPlan({
    onSuccess: () => {
      toast.success(t("company.switchingPlan"));
      toast.info(t("admin.changesTakeEffectWithin5Minutes"));
      refetchCompany();
    },
    onError: (error: any) => {
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("insufficient permissions") || msg.includes("access denied") || msg.includes("forbidden")) {
        toast.error(t("auth.accessDenied"));
      } else {
        toast.error(error?.message || t("company.planSwitchError"));
      }
    },
  });

  const { mutate: verifyPayment } = useVerifyPayment();

  const handleUpgrade = (planId: string) => {
    if (!user?.companyId || !company) return toast.error(t("common.error"));
    const selectedPlan = plans.find((p) => p.id === planId);
    if (!selectedPlan) return toast.error(t("company.planNotFound"));
    const isFree = selectedPlan.price === 0 || selectedPlan.isFree === true;
    if (!isFree) {
      setPaymentModal({
        open: true,
        planId,
        planName: getTranslatedValue(selectedPlan.name),
        planPrice: selectedPlan.price,
      });
      return;
    }
    const planName =
      typeof selectedPlan.name === "string"
        ? selectedPlan.name
        : selectedPlan.name?.ru || selectedPlan.name?.en || selectedPlan.name?.kk || "";
    updatePlan({ id: user.companyId, plan: planName as any });
  };

  const handlePaymentSuccess = (orderId: string) => {
    if (!user?.companyId || !paymentModal.planId) return;
    verifyPayment(
      { companyId: user.companyId, orderId, planId: paymentModal.planId },
      {
        onSuccess: () => {
          toast.success(t("company.switchingPlan"));
          toast.info(t("admin.changesTakeEffectWithin5Minutes"));
          refetchCompany();
        },
        onError: (error: any) => {
          toast.error(error?.message || t("company.planSwitchError"));
        },
      }
    );
  };

  const lang = i18n.language || "ru";

  if (companyLoading || plansLoading || freePlanSettingsLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
            {t("common.loading")}
          </span>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find((p) => {
    const pn = typeof p.name === "string" ? p.name : getTranslatedValue(p.name);
    return (
      pn === company?.plan ||
      (typeof p.name === "object" &&
        (p.name.ru === company?.plan || p.name.en === company?.plan || p.name.kk === company?.plan))
    );
  });

  const visiblePlans = plans.filter((plan) => {
    const pn = typeof plan.name === "string" ? plan.name : getTranslatedValue(plan.name);
    const isCurrent =
      pn === company?.plan ||
      (typeof plan.name === "object" &&
        (plan.name.ru === company?.plan || plan.name.en === company?.plan || plan.name.kk === company?.plan));
    const isFree = plan.price === 0 || plan.isFree === true;
    if (isFree && company?.trialUsed && !isCurrent) return false;
    return true;
  });

  /* ── trial countdown ── */
  const trialEndDate = company?.trialEndDate ? new Date(company.trialEndDate) : null;
  const planEndDate = company?.planEndDate ? new Date(company.planEndDate) : null;
  const endDate = trialEndDate || planEndDate;
  const daysLeft = endDate
    ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  /* ── plan accent colours ── */
  const planAccent = (planId: string) => {
    if (planId === "pro") return "#CCFF00";
    if (planId === "standard") return "#FF3D00";
    return "#71717A";
  };

  return (
    <div
      className={`min-h-screen bg-background flex flex-col overflow-x-hidden w-full ${
        isFullscreen ? "h-auto overflow-y-auto" : ""
      }`}
    >
      <CompanyHeader />

      <main
        className={`flex-1 px-4 sm:px-6 py-6 w-full flex flex-col gap-6 ${
          isFullscreen ? "h-auto overflow-visible" : "overflow-y-auto"
        }`}
      >
        {/* ── PAGE TITLE ── */}
        <div className="flex items-end gap-4">
          <h1
            className="text-brutal text-4xl sm:text-5xl font-black leading-none"
            style={{ color: NEON, textShadow: `2px 2px 0 ${BLACK}` }}
          >
            {t("company.billing") || "BILLING"}
          </h1>
          <div className="h-[3px] flex-1 mb-2" style={{ backgroundColor: NEON }} />
        </div>

        {/* ── CURRENT PLAN BANNER ── */}
        {company && (
          <div
            className="border-2 p-5 relative shadow-brutal"
            style={{ borderColor: NEON, backgroundColor: "hsl(var(--card))" }}
          >
            {/* neon accent strip */}
            <div
              className="absolute top-0 left-0 h-full w-1"
              style={{ backgroundColor: NEON }}
            />
            <div className="pl-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-brutal text-xs text-muted-foreground mb-1">
                  {t("company.yourTariff")}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xl font-bold text-foreground">
                    {company.status === "Trial"
                      ? t("company.trialPeriod")
                      : currentPlan
                      ? getTranslatedValue(currentPlan.name)
                      : company.plan || t("company.plan")}
                  </span>
                  {company.status === "Trial" && (
                    <Badge
                      className="text-brutal text-[10px] px-2"
                      style={{ backgroundColor: NEON, color: BLACK, borderRadius: 0 }}
                    >
                      <FiZap className="mr-1 h-3 w-3" />
                      {t("company.trialPeriod")}
                    </Badge>
                  )}
                </div>

                {/* Countdown */}
                {daysLeft !== null && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <FiAlertTriangle
                      className="h-4 w-4"
                      style={{ color: daysLeft <= 5 ? "#FF3D00" : NEON }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {t("company.daysUntilTariffEnds")}:
                    </span>
                    <span
                      className="font-mono font-black text-2xl leading-none"
                      style={{ color: daysLeft <= 0 ? "#FF3D00" : daysLeft <= 5 ? "#FF3D00" : NEON }}
                    >
                      {daysLeft > 0 ? daysLeft : 0}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {getDaysText(Math.max(0, daysLeft), t, lang)}
                    </span>
                    {endDate && (
                      <span className="text-xs text-muted-foreground">
                        (
                        {endDate.toLocaleDateString(
                          lang === "kk" ? "kk-KZ" : lang === "en" ? "en-US" : "ru-RU",
                          { day: "numeric", month: "long", year: "numeric" }
                        )}
                        )
                      </span>
                    )}
                    {daysLeft <= 0 && (
                      <Badge
                        className="text-brutal text-[10px] px-2"
                        style={{ backgroundColor: "#FF3D00", color: "#fff", borderRadius: 0 }}
                      >
                        {t("admin.tariffExpired")}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Big price */}
              <div className="text-right flex-shrink-0">
                <span
                  className="font-mono text-4xl font-black leading-none"
                  style={{ color: NEON }}
                >
                  {company.status === "Trial"
                    ? t("common.free")
                    : currentPlan
                    ? currentPlan.price === 0
                      ? t("common.free")
                      : `${currentPlan.price} ₸`
                    : t("common.free")}
                </span>
                {currentPlan && currentPlan.price > 0 && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    /{t("admin.perMonth")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION HEADING: PLANS ── */}
        <div>
          <h2 className="text-brutal text-lg tracking-widest text-foreground mb-4">
            {t("company.availablePlans")}
          </h2>

          {/* ── PLAN COMPARISON GRID ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {visiblePlans.map((plan) => {
              const pn = typeof plan.name === "string" ? plan.name : getTranslatedValue(plan.name);
              const isCurrent =
                pn === company?.plan ||
                (typeof plan.name === "object" &&
                  (plan.name.ru === company?.plan ||
                    plan.name.en === company?.plan ||
                    plan.name.kk === company?.plan));
              const isFree = plan.price === 0 || plan.isFree === true;
              const accent = planAccent(plan.id);
              const isCurrentPlanExpired =
                isCurrent && !isFree && company?.planEndDate && new Date(company.planEndDate) < new Date();
              const isDisabled = isCurrent && !isCurrentPlanExpired;

              /* Trial display */
              const freeDays =
                freePlanSettings?.freePeriodDays ?? plan.freePeriodDays ?? 0;
              const trialDaysLeft =
                isCurrent && company?.trialEndDate
                  ? Math.ceil(
                      (new Date(company.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                  : null;

              return (
                <div
                  key={plan.id}
                  className="flex flex-col border-2 relative transition-all"
                  style={{
                    borderColor: isCurrent ? accent : "hsl(var(--border))",
                    boxShadow: isCurrent ? `6px 6px 0 ${accent}` : "none",
                    backgroundColor: "hsl(var(--card))",
                  }}
                >
                  {/* Plan accent header bar */}
                  <div
                    className="h-1 w-full flex-shrink-0"
                    style={{ backgroundColor: accent }}
                  />

                  <div className="flex flex-col flex-1 p-5">
                    {/* Name + current badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-brutal font-black text-base tracking-widest"
                        style={{ color: accent }}
                      >
                        {getTranslatedValue(plan.name)}
                      </span>
                      {isCurrent && (
                        <Badge
                          className="text-brutal text-[9px] px-2 flex items-center gap-1"
                          style={{ backgroundColor: accent, color: BLACK, borderRadius: 0 }}
                        >
                          <FiCheck className="h-2.5 w-2.5" />
                          {t("company.current")}
                        </Badge>
                      )}
                    </div>

                    {/* Big price */}
                    <div className="mb-5">
                      {isFree ? (
                        <>
                          <span className="font-mono text-4xl font-black text-foreground leading-none">
                            {trialDaysLeft !== null
                              ? trialDaysLeft > 0
                                ? `${trialDaysLeft}`
                                : "0"
                              : `${freeDays}`}
                          </span>
                          <span className="font-mono text-base text-muted-foreground ml-1">
                            {getDaysText(trialDaysLeft ?? freeDays, t, lang)}
                          </span>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                            {t("company.trialAccess")}
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-4xl font-black leading-none" style={{ color: accent }}>
                            {plan.price}
                          </span>
                          <span className="font-mono text-base text-muted-foreground ml-1">₸</span>
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">
                            /{t("admin.perMonth")}
                          </span>
                        </>
                      )}

                      {/* Renewal countdown for current paid plan */}
                      {isCurrent && !isFree && company?.planEndDate && (() => {
                        const d = Math.ceil(
                          (new Date(company.planEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <div className="mt-2 pt-2 border-t border-dashed border-border flex justify-between text-xs">
                            <span className="text-muted-foreground">{t("admin.daysUntilExpiry")}</span>
                            <span
                              className="font-mono font-bold"
                              style={{ color: d <= 0 ? "#FF3D00" : d <= 5 ? "#FF3D00" : NEON }}
                            >
                              {d > 0 ? `${d} ${getDaysText(d, t, lang)}` : t("admin.tariffExpired")}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <Separator className="mb-4" />

                    {/* Feature list */}
                    <ul className="space-y-2 flex-1 mb-5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <FiCheck
                            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                            style={{ color: accent }}
                          />
                          <span className="text-muted-foreground leading-snug">
                            {getTranslatedValue(feature)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      className="w-full mt-auto text-brutal text-xs tracking-widest font-black"
                      disabled={isDisabled}
                      onClick={() => handleUpgrade(plan.id)}
                      style={
                        isDisabled
                          ? { borderRadius: 0, cursor: "not-allowed" }
                          : {
                              borderRadius: 0,
                              backgroundColor: accent,
                              color: BLACK,
                              border: `2px solid ${BLACK}`,
                              boxShadow: `3px 3px 0 ${BLACK}`,
                            }
                      }
                      variant={isDisabled ? "outline" : "default"}
                    >
                      {isCurrentPlanExpired
                        ? t("company.renewPlan")
                        : isCurrent
                        ? t("company.currentPlan")
                        : t("company.selectPlan")}
                      {!isDisabled && <FiArrowRight className="ml-2 h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PAYPAL NOTE ── */}
        <div
          className="border-2 border-dashed p-4 flex items-center gap-3"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <FiLock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            {t("payment.securePayment")}
          </p>
        </div>
      </main>

      <PaymentModal
        open={paymentModal.open}
        onOpenChange={(open) => setPaymentModal((prev) => ({ ...prev, open }))}
        planId={paymentModal.planId}
        planName={paymentModal.planName}
        price={paymentModal.planPrice}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default CompanyBilling;
