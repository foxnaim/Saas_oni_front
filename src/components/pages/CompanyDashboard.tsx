'use client';

import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FiMessageSquare,
  FiCheckCircle,
  FiBarChart2,
  FiSettings,
  FiArrowRight,
  FiCopy,
  FiAlertTriangle,
  FiZap,
  FiCreditCard,
  FiMessageCircle,
  FiExternalLink,
  FiHeadphones,
} from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import {
  useCompany,
  useCompanyStats,
  useMessages,
  usePlans,
  useSupportInfo,
} from "@/lib/query";
import { toast } from "sonner";
import { getTranslatedValue } from "@/lib/utils/translations";
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { useWhatsAppSupport } from "@/hooks/useWhatsAppSupport";

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const NEON = "#CCFF00";
const NEON_DIM = "hsl(74 100% 50% / 0.15)";
const SUCCESS = "#00FF88";
const SUCCESS_DIM = "hsl(151 100% 50% / 0.15)";
const DANGER = "#FF3D00";
const DANGER_DIM = "hsl(14 100% 50% / 0.12)";

/* ─────────────────────────────────────────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────────────────────────────────────────── */

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 w-full">
    {/* Header skeleton */}
    <div className="border-2 border-foreground/10 p-6">
      <Skeleton className="h-8 w-48 mb-2 rounded-none" />
      <Skeleton className="h-5 w-28 rounded-none" />
    </div>

    {/* Stats grid skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="border-2 border-foreground/10 p-5"
          style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground)/0.08)" }}
        >
          <Skeleton className="h-4 w-24 mb-3 rounded-none" />
          <Skeleton className="h-10 w-20 mb-1 rounded-none" />
          <Skeleton className="h-3 w-16 rounded-none" />
        </div>
      ))}
    </div>

    {/* Actions row skeleton */}
    <div className="flex flex-wrap gap-3">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-36 rounded-none" />
      ))}
    </div>

    {/* Plan card skeleton */}
    <div
      className="border-2 border-foreground/10 p-6"
      style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground)/0.08)" }}
    >
      <Skeleton className="h-4 w-20 mb-4 rounded-none" />
      <Skeleton className="h-8 w-32 mb-3 rounded-none" />
      <Skeleton className="h-4 w-full mb-2 rounded-none" />
      <Skeleton className="h-3 w-40 rounded-none" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accentColor?: string;
  accentBg?: string;
  indicator?: "neon" | "success" | "danger" | "none";
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accentColor,
  accentBg,
  indicator = "none",
  suffix,
}) => (
  <div
    className="
      relative border-2 border-foreground/10 bg-card p-5
      transition-transform duration-100
      hover:-translate-x-[2px] hover:-translate-y-[2px]
      cursor-default
    "
    style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground)/0.1)" }}
  >
    {/* indicator dot */}
    {indicator !== "none" && (
      <span
        className="absolute top-3 right-3 h-2 w-2 animate-pulse"
        style={{
          backgroundColor:
            indicator === "neon"
              ? NEON
              : indicator === "success"
              ? SUCCESS
              : DANGER,
        }}
      />
    )}

    <div className="flex items-start gap-3">
      <div
        className="flex-shrink-0 p-2 border border-foreground/10"
        style={{ backgroundColor: accentBg ?? NEON_DIM }}
      >
        <span style={{ color: accentColor ?? NEON }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          {label}
        </p>
        <p
          className="font-mono text-3xl font-bold leading-none tracking-tighter"
          style={{ color: accentColor ?? NEON }}
        >
          {value}
          {suffix && (
            <span className="text-lg font-semibold ml-0.5">{suffix}</span>
          )}
        </p>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   ALERT BANNER
───────────────────────────────────────────────────────────────────────────── */

interface AlertBannerProps {
  title: string;
  message: string;
  variant: "danger" | "warning" | "info";
  action?: { label: string; onClick: () => void };
  extra?: React.ReactNode;
}

const AlertBanner: React.FC<AlertBannerProps> = ({
  title,
  message,
  variant,
  action,
  extra,
}) => {
  const colors = {
    danger: { bg: DANGER_DIM, border: DANGER, text: DANGER },
    warning: { bg: NEON_DIM, border: NEON, text: "hsl(var(--foreground))" },
    info: { bg: "hsl(var(--muted)/0.5)", border: "hsl(var(--border))", text: "hsl(var(--foreground))" },
  }[variant];

  return (
    <div
      className="border-2 p-5"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        boxShadow: `4px 4px 0 0 ${colors.border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 p-1.5 border border-foreground/10"
          style={{ backgroundColor: colors.bg }}
        >
          <FiAlertTriangle className="h-4 w-4" style={{ color: colors.text }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-bold uppercase tracking-wide mb-1"
            style={{ color: colors.text }}
          >
            {title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {message}
          </p>
          {extra && <div className="mt-2">{extra}</div>}
          {action && (
            <Button
              onClick={action.onClick}
              size="sm"
              className="mt-3"
            >
              {action.label}
              <FiArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const CompanyDashboard: React.FC = () => {
  const { isFullscreen } = useFullscreenContext();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  /* ── state ── */
  const [copiedCode, setCopiedCode] = React.useState(false);

  /* ── queries ── */
  const { data: company, isLoading: companyLoading } = useCompany(
    user?.companyId || 0,
    { enabled: !!user?.companyId }
  );

  const { data: stats, isLoading: statsLoading } = useCompanyStats(
    user?.companyId || 0,
    { enabled: !!user?.companyId }
  );

  const { data: messagesData, isLoading: messagesLoading } = useMessages(
    company?.code ?? null,
    1,
    5,
    undefined,
    { enabled: !!company?.code }
  );

  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: supportInfo } = useSupportInfo();
  const permissions = usePlanPermissions();
  const whatsapp = useWhatsAppSupport();

  /* ── derived ── */
  const currentPlan = React.useMemo(() => {
    if (!company?.plan || !plans.length) return null;
    return (
      plans.find((p) => {
        const n = typeof p.name === "string" ? p.name : getTranslatedValue(p.name);
        return (
          n === company.plan ||
          (typeof p.name === "object" &&
            (p.name.ru === company.plan ||
              p.name.en === company.plan ||
              p.name.kk === company.plan))
        );
      }) ?? null
    );
  }, [company?.plan, plans]);

  const isFreeOrTrial = React.useMemo(
    () =>
      currentPlan?.isFree === true ||
      currentPlan?.price === 0 ||
      ["Пробный", "Trial", "Бесплатный", "Free", "Сынақ", "Тегін"].includes(
        company?.plan ?? ""
      ),
    [company?.plan, currentPlan]
  );

  const isTrialExpired = React.useMemo(() => {
    if (!company?.trialEndDate) return false;
    try {
      return new Date() > new Date(company.trialEndDate);
    } catch {
      return false;
    }
  }, [company?.trialEndDate]);

  const isPlanExpired = React.useMemo(() => {
    if (!company?.planEndDate) return false;
    try {
      return new Date() > new Date(company.planEndDate);
    } catch {
      return false;
    }
  }, [company?.planEndDate]);

  const daysRemaining = React.useMemo(() => {
    const endDate = company?.trialEndDate ?? company?.planEndDate;
    if (!endDate) return null;
    try {
      const diff = new Date(endDate).getTime() - Date.now();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }, [company?.trialEndDate, company?.planEndDate]);

  const messagesUsedPct = React.useMemo(() => {
    const used = company?.messagesThisMonth ?? 0;
    const limit = currentPlan?.messagesLimit ?? company?.messagesLimit ?? 0;
    if (!limit) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }, [company, currentPlan]);

  const responseRate = React.useMemo(() => {
    const total = stats?.total ?? 0;
    const resolved = stats?.resolved ?? 0;
    if (!total) return 0;
    return Math.round((resolved / total) * 100);
  }, [stats]);

  const recentMessages = messagesData?.data ?? [];

  /* ── copy code ── */
  const handleCopyCode = React.useCallback(() => {
    if (!company?.code) return;
    navigator.clipboard.writeText(company.code);
    setCopiedCode(true);
    toast.success(t("company.codeCopiedToClipboard"));
    const t2 = setTimeout(() => setCopiedCode(false), 2000);
    return () => clearTimeout(t2);
  }, [company?.code, t]);

  /* ── loading ── */
  const isLoading =
    statsLoading || companyLoading || plansLoading || messagesLoading;

  /* ── deleted company ── */
  const isDeleted = !company && !!user?.companyId && !companyLoading;
  const isBlocked = company?.status === "Blocked";

  /* ── plan display name ── */
  const planDisplayName = React.useMemo(() => {
    if (company?.status === "Trial") return t("company.trialPeriod");
    if (currentPlan) return getTranslatedValue(currentPlan.name);
    return company?.plan ?? t("company.plan");
  }, [company, currentPlan, t]);

  /* ── telegram mock (wired to real integration when available) ── */
  const telegramConnected = false;

  /* ─────────────────────────────────────────────────────────────────────── */

  return (
    <div
      className={`min-h-screen bg-background flex flex-col overflow-x-hidden w-full ${
        isFullscreen ? "h-auto overflow-y-auto" : ""
      }`}
    >
      <CompanyHeader />

      <div
        className={`flex flex-col flex-1 w-full min-h-0 ${
          isFullscreen ? "h-auto overflow-visible block" : "overflow-hidden"
        }`}
      >
        <main
          className={`flex-1 px-4 sm:px-6 py-6 w-full max-w-5xl mx-auto ${
            isFullscreen ? "h-auto overflow-visible block" : "overflow-y-auto"
          }`}
        >
          {isLoading ? (
            <DashboardSkeleton />
          ) : isDeleted ? (
            <AlertBanner
              variant="danger"
              title={t("company.deletedTitle")}
              message={t("company.deletedMessage")}
            />
          ) : (
            <div className="space-y-6">

              {/* ── HEADER ─────────────────────────────────────────────── */}
              <div
                className="border-2 border-foreground/10 p-6 relative overflow-hidden"
                style={{
                  boxShadow: `6px 6px 0 0 ${NEON}`,
                  borderColor: NEON,
                }}
              >
                {/* neon corner accent */}
                <div
                  className="absolute -top-4 -right-4 h-20 w-20 opacity-20"
                  style={{ backgroundColor: NEON }}
                />
                <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none text-foreground">
                      {company?.name ?? "—"}
                    </h1>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {t("company.companyCode")}
                      </span>
                      <code
                        className="font-mono text-sm font-bold px-2 py-0.5 border border-foreground/10"
                        style={{ color: NEON, backgroundColor: NEON_DIM }}
                      >
                        {company?.code ?? "—"}
                      </code>
                      <button
                        onClick={handleCopyCode}
                        className="p-1 border border-foreground/10 hover:border-primary transition-colors"
                        title={t("company.copy")}
                      >
                        {copiedCode ? (
                          <FiCheckCircle
                            className="h-3.5 w-3.5"
                            style={{ color: SUCCESS }}
                          />
                        ) : (
                          <FiCopy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={isBlocked ? "destructive" : "outline"}
                      className="font-mono"
                    >
                      {company?.status ?? "—"}
                    </Badge>
                    <Badge className="font-mono">{planDisplayName}</Badge>
                  </div>
                </div>
              </div>

              {/* ── ALERTS ────────────────────────────────────────────── */}
              {isBlocked && (
                <AlertBanner
                  variant="danger"
                  title={t("company.blockedTitle")}
                  message={
                    supportInfo?.supportWhatsAppNumber
                      ? t("company.blockedMessageWithNumber", {
                          number: supportInfo.supportWhatsAppNumber,
                        })
                      : t("company.blockedMessage")
                  }
                  extra={
                    supportInfo?.supportWhatsAppNumber ? (
                      <a
                        href={whatsapp.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide hover:underline"
                        style={{ color: DANGER }}
                      >
                        <FiMessageCircle className="h-3.5 w-3.5" />
                        {t("company.contactSupport")} —{" "}
                        {supportInfo.supportWhatsAppNumber}
                      </a>
                    ) : null
                  }
                />
              )}

              {!isBlocked && isFreeOrTrial && isTrialExpired && (
                <AlertBanner
                  variant="warning"
                  title={t("company.trialExpiredTitle")}
                  message={t("company.trialExpiredMessage")}
                  action={{
                    label: t("company.choosePlan"),
                    onClick: () => router.push("/company/billing"),
                  }}
                />
              )}

              {!isBlocked && !isFreeOrTrial && isPlanExpired && (
                <AlertBanner
                  variant="danger"
                  title={t("company.tariffExpiredTitle")}
                  message={t("company.tariffExpiredMessageShort")}
                  action={{
                    label: t("company.upgradeTariff"),
                    onClick: () => router.push("/company/billing"),
                  }}
                />
              )}

              {/* ── STATS GRID ─────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label={t("company.totalReviews")}
                  value={stats?.total ?? 0}
                  icon={<FiMessageSquare className="h-4 w-4" />}
                  accentColor={NEON}
                  accentBg={NEON_DIM}
                />
                <StatCard
                  label={t("company.newMessages")}
                  value={stats?.new ?? 0}
                  icon={<FiZap className="h-4 w-4" />}
                  accentColor={NEON}
                  accentBg={NEON_DIM}
                  indicator="neon"
                />
                <StatCard
                  label={t("company.resolved")}
                  value={stats?.resolved ?? 0}
                  icon={<FiCheckCircle className="h-4 w-4" />}
                  accentColor={SUCCESS}
                  accentBg={SUCCESS_DIM}
                  indicator="success"
                />
                <StatCard
                  label={t("company.resolutionRate")}
                  value={responseRate}
                  suffix="%"
                  icon={<FiBarChart2 className="h-4 w-4" />}
                  accentColor={responseRate >= 70 ? SUCCESS : NEON}
                  accentBg={responseRate >= 70 ? SUCCESS_DIM : NEON_DIM}
                />
              </div>

              {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Button
                  onClick={() => router.push("/company/messages")}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <FiMessageSquare className="h-4 w-4" />
                  {t("company.messages").toUpperCase()}
                </Button>

                {!permissions.isReadOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/company/reports")}
                  >
                    <FiBarChart2 className="h-4 w-4" />
                    {t("company.reports").toUpperCase()}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/company/settings")}
                >
                  <FiSettings className="h-4 w-4" />
                  {t("company.settings").toUpperCase()}
                </Button>

                {!telegramConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/company/settings")}
                    style={{
                      borderColor: NEON,
                      color: NEON,
                    }}
                    className="hover:bg-primary hover:text-black"
                  >
                    <FiZap className="h-4 w-4" />
                    {t("telegram.connectButton") || "CONNECT TELEGRAM"}
                  </Button>
                )}
              </div>

              {/* ── PLAN INFO ─────────────────────────────────────────── */}
              <div
                className="border-2 border-foreground/10 bg-card"
                style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground)/0.1)" }}
              >
                <div className="p-5 border-b-2 border-foreground/10 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                      {t("company.currentPlan")}
                    </p>
                    <p className="text-xl font-black uppercase tracking-tight text-foreground">
                      {planDisplayName}
                    </p>
                  </div>
                  <div className="text-right">
                    {daysRemaining !== null && (
                      <div>
                        <Badge
                          variant={
                            daysRemaining <= 0
                              ? "destructive"
                              : daysRemaining <= 7
                              ? "outline"
                              : "default"
                          }
                          className="font-mono text-sm px-3"
                        >
                          {daysRemaining > 0
                            ? `${daysRemaining}d`
                            : t("admin.tariffExpired")}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                          {t("company.daysUntilTariffEnds")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {/* Messages usage */}
                  {(currentPlan?.messagesLimit ?? company?.messagesLimit ?? 0) >
                    0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          {t("company.messagesLabel")}
                        </p>
                        <p className="font-mono text-xs font-bold">
                          <span style={{ color: NEON }}>
                            {company?.messagesThisMonth ?? 0}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {currentPlan?.messagesLimit ?? company?.messagesLimit}
                          </span>
                        </p>
                      </div>
                      {/* Brutalist progress — square, no rounding */}
                      <div className="h-3 w-full border border-foreground/10 bg-muted overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${messagesUsedPct}%`,
                            backgroundColor:
                              messagesUsedPct >= 90 ? DANGER : NEON,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {isFreeOrTrial && !isTrialExpired && (
                    <Button
                      onClick={() => router.push("/company/billing")}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <FiCreditCard className="h-4 w-4" />
                      UPGRADE
                    </Button>
                  )}
                </div>
              </div>

              {/* ── RECENT ACTIVITY ───────────────────────────────────── */}
              {!permissions.isReadOnly && (
                <div
                  className="border-2 border-foreground/10 bg-card"
                  style={{
                    boxShadow: "4px 4px 0 0 hsl(var(--foreground)/0.1)",
                  }}
                >
                  <div className="p-5 border-b-2 border-foreground/10 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-foreground">
                      {t("company.recentMessages")}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push("/company/messages")}
                      className="h-8 w-8"
                      aria-label={t("company.viewAll")}
                    >
                      <FiArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {recentMessages.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {t("company.noMessages")}
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-foreground/5">
                      {recentMessages.slice(0, 5).map((msg) => (
                        <li
                          key={msg.id}
                          className="px-5 py-3 flex items-start gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => router.push("/company/messages")}
                        >
                          {/* type indicator */}
                          <span
                            className="mt-0.5 flex-shrink-0 h-2 w-2 border"
                            style={{
                              backgroundColor:
                                msg.type === "praise"
                                  ? SUCCESS
                                  : msg.type === "complaint"
                                  ? DANGER
                                  : NEON,
                              borderColor:
                                msg.type === "praise"
                                  ? SUCCESS
                                  : msg.type === "complaint"
                                  ? DANGER
                                  : NEON,
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground leading-relaxed line-clamp-2 font-medium">
                              {msg.content}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wider">
                              {new Date(msg.createdAt).toLocaleDateString()}
                              {" · "}
                              {msg.status}
                            </p>
                          </div>
                          <Badge
                            variant={
                              msg.status === "Resolved"
                                ? "default"
                                : msg.status === "New"
                                ? "outline"
                                : "secondary"
                            }
                            className="flex-shrink-0 text-[10px] font-mono"
                          >
                            {msg.type}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* ── SUPPORT ────────────────────────────────────────────── */}
              {supportInfo?.supportWhatsAppNumber && (
                <div
                  className="border-2 border-foreground/10 bg-card p-5 relative overflow-hidden"
                  style={{
                    boxShadow: "4px 4px 0 0 hsl(var(--foreground)/0.1)",
                  }}
                >
                  {/* neon accent strip */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: NEON }}
                  />
                  <div className="pl-4 flex items-start gap-3">
                    <div
                      className="flex-shrink-0 p-2 border border-foreground/10"
                      style={{ backgroundColor: NEON_DIM }}
                    >
                      <FiHeadphones
                        className="h-4 w-4"
                        style={{ color: NEON }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-xs font-black uppercase tracking-widest text-foreground">
                          {t("company.support")}
                        </p>
                        {permissions.isPro && (
                          <Badge className="text-[10px] font-mono">
                            {t("company.prioritySupport")}
                          </Badge>
                        )}
                      </div>
                      <a
                        href={whatsapp.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-sm font-bold hover:underline"
                        style={{ color: NEON }}
                      >
                        {supportInfo.supportWhatsAppNumber}
                        <FiExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CompanyDashboard;
