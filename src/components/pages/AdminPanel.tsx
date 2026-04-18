'use client';

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader } from "@/components/AdminHeader";
import {
  useCompanies,
  useMessages,
  usePlatformStats,
} from "@/lib/query";
import { useSocketMessages } from "@/lib/websocket/useSocket";
import { MESSAGE_STATUSES, COMPANY_STATUSES } from "@/lib/utils/constants";
import {
  FiHome,
  FiMessageSquare,
  FiDollarSign,
  FiBarChart2,
  FiUsers,
  FiSettings,
  FiArrowRight,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiZap,
} from "react-icons/fi";

/* ─── helpers ──────────────────────────────────────────────────────────── */
const statusMatches = (actual: string | undefined, expected: string) =>
  actual != null && String(actual).trim() === expected;

const fmtDate = (d: string | Date): string => {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ─── quick links config ───────────────────────────────────────────────── */
const QUICK_LINKS = [
  { href: "/admin", label: "COMPANIES", icon: FiHome, accent: "#CCFF00" },
  { href: "/admin/messages", label: "MESSAGES", icon: FiMessageSquare, accent: "#FF3D00" },
  { href: "/admin/plans", label: "PLANS", icon: FiDollarSign, accent: "#CCFF00" },
  { href: "/admin/analytics", label: "ANALYTICS", icon: FiBarChart2, accent: "#FF3D00" },
  { href: "/admin/admins", label: "ADMINS", icon: FiUsers, accent: "#CCFF00" },
  { href: "/admin/settings", label: "SETTINGS", icon: FiSettings, accent: "#FF3D00" },
] as const;

/* ─── stat card ────────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  neon?: boolean;
  loading?: boolean;
}
function StatCard({ label, value, sub, neon = false, loading }: StatCardProps) {
  return (
    <div
      className={`
        border-2 border-foreground shadow-brutal bg-card p-4 sm:p-6
        flex flex-col gap-2
        ${neon ? "bg-primary" : ""}
      `}
    >
      <p
        className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground"
        style={{ letterSpacing: "0.15em" }}
      >
        {label}
      </p>
      {loading ? (
        <Skeleton className="h-10 w-24 bg-muted" />
      ) : (
        <p
          className={`
            text-4xl sm:text-5xl font-mono font-black leading-none
            ${neon ? "text-primary-foreground" : "text-foreground"}
          `}
        >
          {value}
        </p>
      )}
      {sub && (
        <p className="text-xs font-mono text-muted-foreground mt-1">{sub}</p>
      )}
    </div>
  );
}

/* ─── system health dot ────────────────────────────────────────────────── */
function HealthDot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block w-3 h-3 border-2 border-foreground"
      style={{ background: ok ? "#CCFF00" : "#FF3D00" }}
    />
  );
}

/* ─── activity row ─────────────────────────────────────────────────────── */
function ActivityRow({
  id,
  type,
  status,
  company,
  date,
}: {
  id: string;
  type: string;
  status: string;
  company: string;
  date: string;
}) {
  const getStatusMark = (s: string) => {
    if (statusMatches(s, MESSAGE_STATUSES.RESOLVED)) return { icon: FiCheckCircle, color: "#CCFF00" };
    if (statusMatches(s, MESSAGE_STATUSES.NEW)) return { icon: FiAlertCircle, color: "#FF3D00" };
    if (statusMatches(s, MESSAGE_STATUSES.IN_PROGRESS)) return { icon: FiClock, color: "#71717A" };
    return { icon: FiZap, color: "#71717A" };
  };
  const mark = getStatusMark(status);
  const Icon = mark.icon;

  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Icon style={{ color: mark.color }} className="w-4 h-4 flex-shrink-0" />
      <code className="text-xs font-mono text-muted-foreground truncate w-24 flex-shrink-0">
        {id.slice(0, 8)}…
      </code>
      <Badge
        variant="outline"
        className="text-[10px] font-mono uppercase border border-foreground px-1.5 py-0 flex-shrink-0"
      >
        {company}
      </Badge>
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide flex-shrink-0">
        {type}
      </span>
      <span className="text-xs font-mono text-muted-foreground ml-auto flex-shrink-0 hidden sm:block">
        {fmtDate(date)}
      </span>
    </div>
  );
}

/* ─── AdminPanel ────────────────────────────────────────────────────────── */
const AdminPanel = () => {
  const { t } = useTranslation();

  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: messagesResult, isLoading: messagesLoading } = useMessages(
    undefined,
    1,
    20,
    undefined,
  );
  const { data: platformStats, isLoading: statsLoading } = usePlatformStats();
  const messages = messagesResult?.data ?? [];

  useSocketMessages();

  /* derived platform stats */
  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(
      (c) => c.status === COMPANY_STATUSES.ACTIVE
    ).length;
    const totalMessages = messagesResult?.pagination?.total ?? messages.length;
    const activeUsers = companies.filter(
      (c) =>
        c.status === COMPANY_STATUSES.ACTIVE ||
        c.status === COMPANY_STATUSES.TRIAL
    ).length;

    // Revenue = count of non-trial plans (proxy)
    const paidCompanies = companies.filter((c) => {
      const p = (c.plan ?? "").toLowerCase();
      return !["пробный", "trial", "free", "бесплатный", "тегін", "сынақ"].includes(p);
    }).length;

    return { totalCompanies, activeCompanies, totalMessages, activeUsers, paidCompanies };
  }, [companies, messages, messagesResult]);

  const isLoading = companiesLoading || messagesLoading;

  /* recent 10 messages */
  const recentMessages = useMemo(
    () => messages.slice(0, 10),
    [messages]
  );

  /* system health */
  const isHealthy =
    !statsLoading && (!platformStats || (platformStats.rooms !== undefined));

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container px-4 sm:px-6 py-6 sm:py-10 space-y-8">

        {/* ── Page title ── */}
        <div className="border-b-2 border-foreground pb-4">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-brutal text-foreground">
            ADMIN PANEL
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
            SAYLESS — PLATFORM OVERVIEW
          </p>
        </div>

        {/* ── Stats grid ── */}
        <section>
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-3">
            // PLATFORM STATS
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label={t("admin.totalCompanies")}
              value={stats.totalCompanies}
              sub={`${stats.activeCompanies} ${t("admin.active").toLowerCase()}`}
              loading={companiesLoading}
            />
            <StatCard
              label={t("admin.totalMessages") || "TOTAL MESSAGES"}
              value={stats.totalMessages}
              loading={messagesLoading}
              neon
            />
            <StatCard
              label={t("admin.activeUsers") || "ACTIVE USERS"}
              value={stats.activeUsers}
              sub="active + trial"
              loading={companiesLoading}
            />
            <StatCard
              label={t("admin.paidPlans") || "PAID PLANS"}
              value={stats.paidCompanies}
              sub="non-trial companies"
              loading={companiesLoading}
            />
          </div>
        </section>

        {/* ── Quick links + System health ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Quick links */}
          <section className="lg:col-span-2">
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-3">
              // QUICK NAVIGATION
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href as any}
                    className="group border-2 border-foreground bg-card p-4 flex flex-col gap-3 hover:bg-foreground transition-colors shadow-brutal"
                  >
                    <Icon className="w-5 h-5 text-foreground group-hover:text-background transition-colors" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-bold uppercase tracking-wide text-foreground group-hover:text-background transition-colors">
                        {link.label}
                      </span>
                      <FiArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-background transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* System health */}
          <section>
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-3">
              // SYSTEM HEALTH
            </p>
            <div className="border-2 border-foreground bg-card shadow-brutal p-4 sm:p-6 h-full">
              <div className="space-y-3">
                {[
                  {
                    label: "API SERVER",
                    ok: !statsLoading,
                  },
                  {
                    label: "DATABASE",
                    ok: !companiesLoading && companies.length >= 0,
                  },
                  {
                    label: "WEBSOCKET",
                    ok: true,
                  },
                  {
                    label: "PLATFORM",
                    ok: isHealthy,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="text-xs font-mono font-bold uppercase tracking-wide">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <HealthDot ok={item.ok} />
                      <span
                        className="text-xs font-mono"
                        style={{ color: item.ok ? "#CCFF00" : "#FF3D00" }}
                      >
                        {item.ok ? "OK" : "ERR"}
                      </span>
                    </div>
                  </div>
                ))}
                {platformStats && (
                  <div className="pt-2 space-y-1 border-t border-border">
                    <div className="flex justify-between text-xs font-mono text-muted-foreground">
                      <span>ROOMS</span>
                      <span className="font-bold text-foreground">
                        {platformStats.rooms}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-muted-foreground">
                      <span>LATENCY</span>
                      <span className="font-bold text-foreground">
                        {platformStats.latency}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-muted-foreground">
                      <span>RETENTION</span>
                      <span className="font-bold text-foreground">
                        {platformStats.retention}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ── Recent activity ── */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
              // RECENT ACTIVITY
            </p>
            <FiActivity className="w-3.5 h-3.5 text-muted-foreground" />
            <Link
              href="/admin/messages"
              className="ml-auto text-xs font-mono font-bold uppercase tracking-wide text-primary hover:underline flex items-center gap-1"
            >
              VIEW ALL <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="border-2 border-foreground bg-card shadow-brutal">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 bg-foreground">
              {["ID", "COMPANY", "TYPE", "STATUS", "DATE"].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-mono font-black uppercase tracking-widest text-background"
                >
                  {h}
                </span>
              ))}
            </div>

            <div className="px-4 divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="py-3 flex gap-3">
                    <Skeleton className="h-4 w-24 bg-muted" />
                    <Skeleton className="h-4 w-16 bg-muted" />
                    <Skeleton className="h-4 w-20 bg-muted" />
                  </div>
                ))
              ) : recentMessages.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground py-8 text-center uppercase tracking-wide">
                  NO ACTIVITY
                </p>
              ) : (
                recentMessages.map((msg) => (
                  <ActivityRow
                    key={msg.id}
                    id={msg.id}
                    type={msg.type}
                    status={msg.status}
                    company={msg.companyCode}
                    date={String(msg.createdAt ?? msg.updatedAt ?? "")}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminPanel;
