'use client';

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AdminHeader } from "@/components/AdminHeader";
import { useCompanies, useMessages } from "@/lib/query";
import { useSocketMessages } from "@/lib/websocket/useSocket";
import { MESSAGE_STATUSES, COMPANY_STATUSES } from "@/lib/utils/constants";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FiHome,
  FiMessageSquare,
  FiTrendingUp,
  FiPercent,
} from "react-icons/fi";

/* ─── palette for charts — brutalist, no soft colours ──────────────────── */
const C_NEON   = "#CCFF00";
const C_RED    = "#FF3D00";
const C_BLACK  = "#0A0A0A";
const C_GREY   = "#71717A";

/* ─── helpers ──────────────────────────────────────────────────────────── */
const statusMatches = (actual: string | undefined, expected: string) =>
  actual != null && String(actual).trim() === expected;

const getFromDateForMonth = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

/** Build last-N-days labels */
const buildDailyLabels = (n: number): string[] => {
  const labels: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(
      d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
    );
  }
  return labels;
};

/* ─── custom tooltip ────────────────────────────────────────────────────── */
function BrutalTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-2 border-foreground bg-card px-3 py-2 shadow-brutal">
      <p className="text-[10px] font-mono font-black uppercase text-muted-foreground mb-1">
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs font-mono font-bold" style={{ color: p.fill ?? p.stroke }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── stat card ─────────────────────────────────────────────────────────── */
interface BigStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  neon?: boolean;
  loading?: boolean;
}
function BigStat({ icon: Icon, label, value, sub, neon, loading }: BigStatProps) {
  return (
    <div
      className={`border-2 border-foreground shadow-brutal p-4 sm:p-6 flex flex-col gap-2 ${
        neon ? "bg-primary" : "bg-card"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          className="w-4 h-4"
          style={{ color: neon ? C_BLACK : C_NEON }}
        />
        <span
          className="text-[10px] font-mono font-black uppercase tracking-widest"
          style={{ color: neon ? C_BLACK : undefined }}
        >
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-12 w-28 bg-muted" />
      ) : (
        <p
          className="text-4xl sm:text-5xl font-mono font-black leading-none"
          style={{ color: neon ? C_BLACK : undefined }}
        >
          {value}
        </p>
      )}
      {sub && (
        <p
          className="text-[10px] font-mono"
          style={{ color: neon ? C_BLACK : C_GREY }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* ─── section header ────────────────────────────────────────────────────── */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground mb-3">
      // {children}
    </p>
  );
}

/* ─── AdminAnalytics ─────────────────────────────────────────────────────── */
const AdminAnalytics = () => {
  const { t } = useTranslation();
  const fromDate = getFromDateForMonth();

  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: messagesResult, isLoading: messagesLoading } = useMessages(
    undefined,
    1,
    500,
    undefined,
    { fromDate, staleTime: 1000 * 15 }
  );
  const messages = messagesResult?.data ?? [];

  useSocketMessages();

  /* ── computed analytics ── */
  const analytics = useMemo(() => {
    const trialPlanNames    = ["Пробный", "Trial", "Сынақ"];
    const standardPlanNames = ["Стандарт", "Стандартный", "Standard"];
    const proPlanNames      = ["Про", "Pro"];

    const totalCompanies   = companies.length;
    const activeCompanies  = companies.filter((c) => c.status === COMPANY_STATUSES.ACTIVE).length;
    const trialCompanies   = companies.filter((c) => c.status === COMPANY_STATUSES.TRIAL).length;
    const blockedCompanies = companies.filter((c) => c.status === COMPANY_STATUSES.BLOCKED).length;

    const totalMessages       = messages.length;
    const newMessages         = messages.filter((m) => statusMatches(m.status, MESSAGE_STATUSES.NEW)).length;
    const inProgressMessages  = messages.filter((m) => statusMatches(m.status, MESSAGE_STATUSES.IN_PROGRESS)).length;
    const resolvedMessages    = messages.filter((m) => statusMatches(m.status, MESSAGE_STATUSES.RESOLVED)).length;

    const complaints  = messages.filter((m) => m.type === "complaint").length;
    const praises     = messages.filter((m) => m.type === "praise").length;
    const suggestions = messages.filter((m) => m.type === "suggestion").length;

    const trialPlan    = companies.filter((c) => trialPlanNames.some((n) => c.plan === n)).length;
    const standardPlan = companies.filter((c) => standardPlanNames.some((n) => c.plan === n)).length;
    const proPlan      = companies.filter((c) => proPlanNames.some((n) => c.plan === n)).length;

    const topCompanies = companies
      .map((company) => ({
        ...company,
        messageCount: messages.filter((m) => m.companyCode === company.code).length,
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5);

    const resolutionRate =
      totalMessages > 0 ? Math.round((resolvedMessages / totalMessages) * 100) : 0;
    const avgMessagesPerCompany =
      totalCompanies > 0 ? Math.round(totalMessages / totalCompanies) : 0;

    /* ── messages-over-time: last 14 days ── */
    const days    = 14;
    const labels  = buildDailyLabels(days);
    const msgsOverTime = labels.map((label) => {
      const [dd, mm] = label.split(".");
      const count = messages.filter((m) => {
        const d = new Date(String(m.createdAt ?? ""));
        if (isNaN(d.getTime())) return false;
        return (
          d.getDate().toString().padStart(2, "0") === dd &&
          (d.getMonth() + 1).toString().padStart(2, "0") === mm
        );
      }).length;
      return { date: label, messages: count };
    });

    /* ── plan distribution pie ── */
    const planDist = [
      { name: t("admin.planTrial"),    value: trialPlan,    fill: C_GREY  },
      { name: t("admin.planStandard"), value: standardPlan, fill: C_NEON  },
      { name: t("admin.planPro"),      value: proPlan,      fill: C_RED   },
    ].filter((p) => p.value > 0);

    /* ── message type breakdown ── */
    const typeDist = [
      { type: t("messages.complaint"),  count: complaints,  fill: C_RED  },
      { type: t("messages.praise"),     count: praises,     fill: C_NEON },
      { type: t("messages.suggestion"), count: suggestions, fill: C_GREY },
    ];

    /* ── status breakdown ── */
    const statusDist = [
      { status: t("checkStatus.new"),        count: newMessages,        fill: C_RED  },
      { status: t("checkStatus.inProgress"), count: inProgressMessages, fill: C_GREY },
      { status: t("checkStatus.resolved"),   count: resolvedMessages,   fill: C_NEON },
    ];

    return {
      totalCompanies, activeCompanies, trialCompanies, blockedCompanies,
      totalMessages, newMessages, inProgressMessages, resolvedMessages,
      complaints, praises, suggestions,
      trialPlan, standardPlan, proPlan,
      topCompanies, resolutionRate, avgMessagesPerCompany,
      msgsOverTime, planDist, typeDist, statusDist,
    };
  }, [companies, messages, t]);

  const isLoading = companiesLoading || messagesLoading;

  /* ── skeleton loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="container px-4 sm:px-6 py-6 sm:py-10 space-y-8">
          <div className="border-b-2 border-foreground pb-4">
            <div className="h-16 w-72 bg-muted" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-muted" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container px-4 sm:px-6 py-6 sm:py-10 space-y-10">

        {/* ── Title ── */}
        <div className="border-b-2 border-foreground pb-4">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-brutal text-foreground">
            ANALYTICS
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
            {t("admin.last30DaysNote")} — SAYLESS PLATFORM
          </p>
        </div>

        {/* ── Big stats ── */}
        <section>
          <SectionHeader>KEY METRICS</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <BigStat
              icon={FiHome}
              label={t("admin.totalCompanies")}
              value={analytics.totalCompanies}
              sub={`${analytics.activeCompanies} active · ${analytics.trialCompanies} trial`}
            />
            <BigStat
              icon={FiMessageSquare}
              label={t("admin.resolvedRequestsForMonth") || "RESOLVED"}
              value={analytics.resolvedMessages}
              sub={`${analytics.totalMessages} total received`}
              neon
            />
            <BigStat
              icon={FiPercent}
              label={t("admin.resolutionRate") || "RESOLUTION RATE"}
              value={`${analytics.resolutionRate}%`}
              sub="resolved / total"
            />
            <BigStat
              icon={FiTrendingUp}
              label={t("admin.engagementIndexForMonth") || "AVG MSG / CO"}
              value={analytics.avgMessagesPerCompany}
              sub={t("admin.messagesPerCompany")}
            />
          </div>
        </section>

        {/* ── Messages over time ── */}
        <section>
          <SectionHeader>MESSAGES OVER TIME — LAST 14 DAYS</SectionHeader>
          <div className="border-2 border-foreground bg-card shadow-brutal p-4 sm:p-6">
            <div className="overflow-x-auto -mx-2 px-2">
            <div style={{ minWidth: 480 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={analytics.msgsOverTime}
                margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#2A2A2A" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fontFamily: "monospace", fill: C_GREY, fontWeight: 700 }}
                  axisLine={{ stroke: "#2A2A2A" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fontFamily: "monospace", fill: C_GREY, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<BrutalTooltip />} cursor={{ stroke: C_RED, strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Line
                  type="linear"
                  dataKey="messages"
                  stroke={C_NEON}
                  strokeWidth={2}
                  dot={{ r: 3, fill: C_NEON, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: C_RED, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
            </div>
          </div>
        </section>

        {/* ── Message types + Status breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Message types bar chart */}
          <section>
            <SectionHeader>{t("admin.messageTypesForMonth") || "MESSAGE TYPES"}</SectionHeader>
            <div className="border-2 border-foreground bg-card shadow-brutal p-4 sm:p-6">
              <div className="overflow-x-auto -mx-2 px-2"><div style={{ minWidth: 300 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={analytics.typeDist}
                  margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#2A2A2A" vertical={false} />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 9, fontFamily: "monospace", fill: C_GREY, fontWeight: 700 }}
                    axisLine={{ stroke: "#2A2A2A" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fontFamily: "monospace", fill: C_GREY, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<BrutalTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="count" radius={0}>
                    {analytics.typeDist.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div></div>
            </div>
          </section>

          {/* Status breakdown bar chart */
          <section>
            <SectionHeader>{t("admin.messageStatusesForMonth") || "MESSAGE STATUSES"}</SectionHeader>
            <div className="border-2 border-foreground bg-card shadow-brutal p-4 sm:p-6">
              <div className="overflow-x-auto -mx-2 px-2"><div style={{ minWidth: 300 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={analytics.statusDist}
                  margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#2A2A2A" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 9, fontFamily: "monospace", fill: C_GREY, fontWeight: 700 }}
                    axisLine={{ stroke: "#2A2A2A" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fontFamily: "monospace", fill: C_GREY, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<BrutalTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="count" radius={0}>
                    {analytics.statusDist.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* ── Plan distribution + Top companies ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Plan distribution */}
          <section>
            <SectionHeader>{t("admin.planDistribution") || "PLAN DISTRIBUTION"}</SectionHeader>
            <div className="border-2 border-foreground bg-card shadow-brutal p-4 sm:p-6">
              {analytics.planDist.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground text-center py-8 uppercase">
                  {t("admin.noData")}
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={analytics.planDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={78}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {analytics.planDist.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<BrutalTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="space-y-3 flex-1">
                    {analytics.planDist.map((p) => {
                      const pct =
                        analytics.totalCompanies > 0
                          ? Math.round((p.value / analytics.totalCompanies) * 100)
                          : 0;
                      return (
                        <div key={p.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono font-bold uppercase">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block w-3 h-3 border border-foreground"
                                style={{ background: p.fill }}
                              />
                              <span className="text-muted-foreground">{p.name}</span>
                            </div>
                            <span className="text-foreground">
                              {p.value} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted w-full">
                            <div
                              className="h-full"
                              style={{ width: `${pct}%`, background: p.fill }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Top companies */}
          <section>
            <SectionHeader>{t("admin.topCompanies") || "TOP COMPANIES"}</SectionHeader>
            <div className="border-2 border-foreground bg-card shadow-brutal">
              {/* Table header */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-2.5 bg-foreground">
                {["#", "COMPANY", "MSGS"].map((h) => (
                  <span key={h} className="text-[10px] font-mono font-black uppercase tracking-widest text-background">
                    {h}
                  </span>
                ))}
              </div>
              {analytics.topCompanies.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground text-center py-8 uppercase">
                  {t("admin.noData")}
                </p>
              ) : (
                analytics.topCompanies.map((company, index) => (
                  <div
                    key={company.id}
                    className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-3 border-b border-border last:border-b-0"
                  >
                    {/* rank */}
                    <span
                      className="w-6 h-6 flex items-center justify-center text-[10px] font-mono font-black border-2 border-foreground"
                      style={index === 0 ? { background: C_NEON, color: C_BLACK, borderColor: C_NEON } : {}}
                    >
                      {index + 1}
                    </span>
                    {/* name */}
                    <div>
                      <p className="text-xs font-mono font-bold text-foreground uppercase">
                        {company.name}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">{company.code}</p>
                    </div>
                    {/* count */}
                    <span className="text-lg font-mono font-black text-foreground">
                      {company.messageCount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* ── Company status overview ── */}
        <section>
          <SectionHeader>COMPANY STATUS OVERVIEW</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: t("admin.active"),  value: analytics.activeCompanies,  accent: C_NEON },
              { label: "TRIAL",            value: analytics.trialCompanies,   accent: C_GREY },
              { label: t("admin.blocked"), value: analytics.blockedCompanies, accent: C_RED  },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                className="border-2 border-foreground bg-card shadow-brutal p-4 sm:p-6 flex flex-col gap-2"
              >
                <div
                  className="w-3 h-3 border-2 border-foreground"
                  style={{ background: accent }}
                />
                <p className="text-3xl sm:text-4xl font-mono font-black text-foreground">
                  {value}
                </p>
                <p className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default AdminAnalytics;
