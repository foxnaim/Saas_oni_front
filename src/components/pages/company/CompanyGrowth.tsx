'use client';

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FiAward,
  FiStar,
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiHelpCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiSmile,
  FiMeh,
  FiFrown,
  FiLock,
} from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import {
  useGrowthMetrics,
  useGroupedAchievements,
  useCompanyStats,
  useMessages,
  useCompany,
} from "@/lib/query";
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";

/* ─── constants ──────────────────────────────────────────────────────────── */

const NEON = "#CCFF00";
const BLACK = "#0A0A0A";
const DANGER = "#FF3D00";
const SUCCESS = "#00FF88";

/* ─── rating breakdown config ────────────────────────────────────────────── */

interface BreakdownRow {
  key: string;
  labelKey: string;
  max: number;
  value: number;
  color: string;
}

/* ─── component ──────────────────────────────────────────────────────────── */

const CompanyGrowth = () => {
  const { isFullscreen } = useFullscreenContext();
  const { t } = useTranslation();
  const { user } = useAuth();
  const permissions = usePlanPermissions();

  const { data: company } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: metrics, isLoading: isLoadingMetrics } = useGrowthMetrics(
    user?.companyId || 0,
    { enabled: !!user?.companyId }
  );
  const { data: groupedAchievements = [], isLoading: isLoadingAchievements } =
    useGroupedAchievements(user?.companyId || 0, { enabled: !!user?.companyId });
  const { data: stats, isLoading: isLoadingStats } = useCompanyStats(
    user?.companyId || 0,
    { enabled: !!user?.companyId }
  );
  const { data: messagesResult, isLoading: isLoadingMessages } = useMessages(
    company?.code ?? null,
    1,
    500
  );
  const messages = messagesResult?.data ?? [];

  const isLoading =
    isLoadingMetrics || isLoadingAchievements || isLoadingStats || isLoadingMessages;

  /* ── computed stats ── */
  const totalMessages =
    metrics?.pointsBreakdown?.totalMessages || messages.length || 0;
  const resolvedCount = stats?.resolved || 0;
  const totalProblems =
    (stats?.new || 0) + (stats?.inProgress || 0) + (stats?.resolved || 0);
  const resolvedPercent =
    totalProblems > 0 ? Math.round((resolvedCount / totalProblems) * 100) : 0;

  const getAverageResponseTime = () => {
    const msgsWithResp = messages.filter((m) => m.companyResponse && m.updatedAt);
    if (!msgsWithResp.length) return 0;
    let totalHours = 0;
    msgsWithResp.forEach((msg) => {
      const created = new Date(msg.createdAt);
      const updated = new Date(msg.updatedAt!);
      totalHours += (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
    });
    return Math.round((totalHours / msgsWithResp.length / 24) * 10) / 10;
  };
  const avgResponseDays = getAverageResponseTime();

  const currentMonthMessages = messages.filter((m) => {
    const d = new Date(m.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  /* ── rating description ── */
  const getRatingDescription = (r: number) => {
    if (r >= 8) return t("company.cultureExcellent");
    if (r >= 6) return t("company.cultureStrong");
    if (r >= 4) return t("company.cultureDeveloping");
    if (r >= 2) return t("company.cultureNeedsAttention");
    return t("company.cultureNeedsImprovement");
  };

  /* ── mood ── */
  const moodConfig = (mood: string) => {
    const lower = mood.toLowerCase();
    if (lower.includes("positive") || lower.includes("позитив")) {
      return { icon: <FiSmile className="h-5 w-5" />, label: t("company.positive"), color: SUCCESS };
    }
    if (lower.includes("negative") || lower.includes("негатив")) {
      return { icon: <FiFrown className="h-5 w-5" />, label: t("company.negative"), color: DANGER };
    }
    return { icon: <FiMeh className="h-5 w-5" />, label: t("company.neutral"), color: "#71717A" };
  };

  /* ── trend ── */
  const trendConfig = (trend: string) => {
    if (trend === "up") return { icon: <FiTrendingUp className="h-5 w-5" />, label: t("company.growing"), color: NEON };
    if (trend === "down") return { icon: <FiTrendingDown className="h-5 w-5" />, label: t("company.declining"), color: DANGER };
    return { icon: <FiMinus className="h-5 w-5" />, label: t("company.stable"), color: "#71717A" };
  };

  /* ── breakdown rows ── */
  const breakdown: BreakdownRow[] = metrics
    ? [
        {
          key: "resolved",
          labelKey: "company.resolvedCases",
          max: 3,
          value: Math.min(metrics.pointsBreakdown?.resolvedCases ?? 0, 3),
          color: SUCCESS,
        },
        {
          key: "speed",
          labelKey: "company.responseSpeed",
          max: 2,
          value: Math.min(metrics.pointsBreakdown?.responseSpeed ?? 0, 2),
          color: NEON,
        },
        {
          key: "praise",
          labelKey: "company.praiseBonus",
          max: 2,
          value: Math.min(metrics.pointsBreakdown?.praiseBonus ?? 0, 2),
          color: "#FF9900",
        },
        {
          key: "activity",
          labelKey: "company.activityBonus",
          max: 1.5,
          value: Math.min(metrics.pointsBreakdown?.activityBonus ?? 0, 1.5),
          color: "#00CFFF",
        },
        {
          key: "achievements",
          labelKey: "company.achievementsBonus",
          max: 1.5,
          value: Math.min(metrics.pointsBreakdown?.achievementsBonus ?? 0, 1.5),
          color: "#BF5FFF",
        },
      ]
    : [];

  /* ── render ── */
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
            {t("company.growth") || "GROWTH"}
          </h1>
          <div className="h-[3px] flex-1 mb-2" style={{ backgroundColor: NEON }} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
              {t("common.loading")}
            </span>
          </div>
        ) : (
          <>
            {/* ══ RATING HERO ══════════════════════════════════════════════ */}
            {permissions.canViewGrowth && (
              <div
                className="border-2 p-6 relative"
                style={{ borderColor: NEON, boxShadow: `6px 6px 0 ${NEON}` }}
              >
                {/* background watermark */}
                <span
                  className="absolute right-6 top-1/2 -translate-y-1/2 font-mono font-black text-[120px] leading-none select-none pointer-events-none"
                  style={{ color: `${NEON}12` }}
                >
                  {metrics?.rating?.toFixed(0) ?? "0"}
                </span>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                  {/* Left: star + label */}
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 flex-shrink-0"
                      style={{ backgroundColor: NEON }}
                    >
                      <FiStar className="h-6 w-6 fill-current" style={{ color: BLACK }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-brutal text-sm tracking-widest text-foreground">
                          {t("company.growthRating")}
                        </p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors rounded-none focus:outline-none"
                              aria-label={t("company.growthRatingInfo")}
                            >
                              <FiHelpCircle className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="bottom" align="start" sideOffset={8} className="max-w-xs z-[100]">
                            <p className="text-sm">{t("company.growthRatingTooltip")}</p>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getRatingDescription(metrics?.rating ?? 0)}
                      </p>
                    </div>
                  </div>

                  {/* Right: big number */}
                  <div className="sm:ml-auto flex items-baseline gap-2">
                    <span
                      className="font-mono font-black text-6xl sm:text-7xl leading-none"
                      style={{ color: NEON }}
                    >
                      {metrics?.rating?.toFixed(1) ?? "0.0"}
                    </span>
                    <span className="font-mono text-2xl text-muted-foreground">/ 10</span>
                  </div>
                </div>

                {/* Mood + Trend row */}
                {metrics && (
                  <div className="mt-5 pt-4 border-t-2 border-dashed flex flex-wrap gap-4" style={{ borderColor: `${NEON}40` }}>
                    {/* Mood */}
                    {(() => {
                      const mc = moodConfig(metrics.mood ?? "neutral");
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-brutal text-[10px] text-muted-foreground">
                            {t("company.overallMood")}:
                          </span>
                          <span style={{ color: mc.color }}>{mc.icon}</span>
                          <span
                            className="font-mono font-bold text-sm"
                            style={{ color: mc.color }}
                          >
                            {mc.label}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Trend */}
                    {(() => {
                      const tc = trendConfig(metrics.trend ?? "stable");
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-brutal text-[10px] text-muted-foreground">
                            {t("company.trend")}:
                          </span>
                          <span style={{ color: tc.color }}>{tc.icon}</span>
                          <span
                            className="font-mono font-bold text-sm"
                            style={{ color: tc.color }}
                          >
                            {tc.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ══ PLAN-GATED LOCK ══════════════════════════════════════════ */}
            {!permissions.canViewGrowth && (
              <div
                className="border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3"
                style={{ borderColor: DANGER }}
              >
                <FiLock className="h-8 w-8" style={{ color: DANGER }} />
                <p className="text-brutal text-sm tracking-widest" style={{ color: DANGER }}>
                  {t("company.upgradeRequired") || "UPGRADE REQUIRED"}
                </p>
              </div>
            )}

            {/* ══ RATING BREAKDOWN ═════════════════════════════════════════ */}
            {permissions.canViewGrowth && breakdown.length > 0 && (
              <div
                className="border-2 p-5"
                style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
              >
                <p className="text-brutal text-xs tracking-widest text-muted-foreground mb-4">
                  {t("company.ratingBreakdown") || "RATING BREAKDOWN"}
                </p>
                <div className="space-y-4">
                  {breakdown.map((row) => (
                    <div key={row.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                          {t(row.labelKey)}
                        </span>
                        <span className="font-mono text-sm font-black" style={{ color: row.color }}>
                          {row.value.toFixed(1)}
                          <span className="text-muted-foreground font-normal text-xs">
                            /{row.max}
                          </span>
                        </span>
                      </div>
                      {/* Brutalist progress bar — no rounding */}
                      <div
                        className="h-4 w-full border-2 relative overflow-hidden"
                        style={{ borderColor: row.color }}
                      >
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${Math.min((row.value / row.max) * 100, 100)}%`,
                            backgroundColor: row.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ STATS GRID ═══════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <FiMessageSquare className="h-4 w-4" />,
                  label: t("company.totalReviews"),
                  value: totalMessages,
                  sub: `+${currentMonthMessages} ${t("company.perMonth")}`,
                  color: NEON,
                },
                {
                  icon: <FiCheckCircle className="h-4 w-4" />,
                  label: t("company.resolvedProblems"),
                  value: resolvedCount,
                  sub: `${resolvedPercent}% ${t("company.resolved")}`,
                  color: SUCCESS,
                },
                {
                  icon: <FiClock className="h-4 w-4" />,
                  label: t("company.averageResponse"),
                  value: avgResponseDays || "—",
                  sub: t("company.days"),
                  color: "#00CFFF",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="border-2 p-5 flex flex-col"
                  style={{
                    borderColor: item.color,
                    backgroundColor: "hsl(var(--card))",
                  }}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center mb-3 flex-shrink-0"
                    style={{ backgroundColor: item.color, color: BLACK }}
                  >
                    {item.icon}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    {item.label}
                  </p>
                  <span
                    className="font-mono font-black text-4xl leading-none"
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </span>
                  <p
                    className="text-xs font-bold mt-1"
                    style={{ color: item.color }}
                  >
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* ══ ACHIEVEMENTS ══════════════════════════════════════════════ */}
            {permissions.canViewGrowth && (
              <div>
                <div className="flex items-end gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FiAward className="h-5 w-5" style={{ color: NEON }} />
                    <h2 className="text-brutal text-lg tracking-widest text-foreground">
                      {t("company.achievements")}
                    </h2>
                  </div>
                  <div className="h-[2px] flex-1 mb-1" style={{ backgroundColor: "hsl(var(--border))" }} />
                </div>

                {groupedAchievements.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-mono">{t("company.noAchievements")}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedAchievements.map((group) => {
                      const active =
                        group.achievements.find((a) => !a.completed) ||
                        group.achievements[group.achievements.length - 1];
                      if (!active) return null;

                      const level = active.achievement.level || 1;
                      const target = active.achievement.target;
                      const isUnlocked = active.completed;
                      const categoryTitle = t(group.categoryTitleKey);

                      let description = "";
                      const titleKey = active.achievement.titleKey;
                      if (titleKey) {
                        const params: Record<string, any> = { level, target };
                        description = String(t(titleKey, params));
                      }

                      return (
                        <div
                          key={group.category}
                          className="border-2 p-4 flex flex-col transition-all"
                          style={{
                            borderColor: isUnlocked ? NEON : "hsl(var(--border))",
                            boxShadow: isUnlocked ? `4px 4px 0 ${NEON}` : "none",
                            backgroundColor: isUnlocked
                              ? `${NEON}08`
                              : "hsl(var(--card))",
                            opacity: isUnlocked ? 1 : 0.65,
                          }}
                        >
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <FiAward
                              className="h-4 w-4 flex-shrink-0"
                              style={{ color: isUnlocked ? NEON : "#71717A" }}
                            />
                            <h4
                              className="text-brutal text-xs tracking-widest font-black flex-1 truncate"
                              style={{ color: isUnlocked ? NEON : "hsl(var(--foreground))" }}
                            >
                              {categoryTitle}
                            </h4>
                            <div className="flex items-center gap-1">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                                  >
                                    <FiHelpCircle className="h-3.5 w-3.5" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="start" sideOffset={8} className="max-w-xs z-[100]">
                                  <p className="text-sm">
                                    {t(
                                      `company.achievement.categoryTooltip.${
                                        group.category === "response_speed"
                                          ? "responseSpeed"
                                          : group.category
                                      }`
                                    )}
                                  </p>
                                </PopoverContent>
                              </Popover>
                              {isUnlocked ? (
                                <Badge
                                  className="text-[9px] px-1.5 py-0 text-brutal"
                                  style={{ backgroundColor: NEON, color: BLACK, borderRadius: 0 }}
                                >
                                  {t("company.completed")}
                                </Badge>
                              ) : (
                                <span className="font-mono text-xs font-bold text-muted-foreground">
                                  Lv.{group.currentLevel}/{group.maxLevel}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          {description && (
                            <p className="text-xs text-muted-foreground mb-3 leading-snug">{description}</p>
                          )}

                          {/* Progress */}
                          <div className="mt-auto">
                            <div className="flex justify-between text-[10px] font-mono mb-1">
                              <span className="text-muted-foreground">
                                {active.current}/{target}
                              </span>
                              <span
                                className="font-bold"
                                style={{ color: isUnlocked ? NEON : "hsl(var(--foreground))" }}
                              >
                                {active.progress}%
                              </span>
                            </div>
                            <div
                              className="h-3 border-2 overflow-hidden"
                              style={{ borderColor: isUnlocked ? NEON : "hsl(var(--border))" }}
                            >
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${active.progress}%`,
                                  backgroundColor: isUnlocked ? NEON : "#71717A",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CompanyGrowth;
