'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useMessageDistribution,
  useCompanyStats,
  useGrowthMetrics,
  useCompany,
} from "@/lib/query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FiDownload,
  FiMessageSquare,
  FiAlertCircle,
  FiAward,
  FiZap,
  FiBarChart2,
  FiCheckCircle,
  FiX,
  FiTrendingUp,
  FiLock,
  FiCalendar,
} from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { robotoRegular, robotoMedium } from "@/lib/fonts/roboto";
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";

/* ─── constants ──────────────────────────────────────────────────────────── */

const NEON = "#CCFF00";
const BLACK = "#0A0A0A";
const DANGER = "#FF3D00";
const SUCCESS = "#00FF88";

/* ─── component ──────────────────────────────────────────────────────────── */

const CompanyReports = () => {
  const { isFullscreen } = useFullscreenContext();
  const { t, i18n: i18nInstance } = useTranslation();
  const { user } = useAuth();
  const permissions = usePlanPermissions();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>((now.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(now.getFullYear().toString());

  const { data: distribution, isLoading: distributionLoading } = useMessageDistribution(
    user?.companyId || 0,
    { enabled: !!user?.companyId }
  );
  const { data: stats, isLoading: statsLoading } = useCompanyStats(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: growthMetrics, isLoading: growthLoading } = useGrowthMetrics(
    user?.companyId || 0,
    { enabled: !!user?.companyId }
  );
  const { data: company, isLoading: companyLoading } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  const isLoading = distributionLoading || statsLoading || growthLoading || companyLoading;

  /* ── computed ── */
  const total = distribution
    ? distribution.complaints + distribution.praises + distribution.suggestions
    : 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const complaintsPercent = pct(distribution?.complaints || 0);
  const praisesPercent = pct(distribution?.praises || 0);
  const suggestionsPercent = pct(distribution?.suggestions || 0);
  const resolved = stats?.resolved || 0;
  const unresolved = (stats?.new || 0) + (stats?.inProgress || 0);
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  /* ── locale helpers ── */
  const currentLang = i18nInstance.language || "ru";
  const localeMap: Record<string, string> = { ru: "ru-RU", en: "en-US", kk: "kk-KZ" };
  const locale = localeMap[currentLang] || "ru-RU";

  const getSelectedMonthPeriod = () => {
    const date = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
    const monthName = date.toLocaleDateString(locale, { month: "long" });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${selectedYear}`;
  };

  const getMonthOptions = () =>
    Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2024, i, 1);
      const monthName = date.toLocaleDateString(locale, { month: "long" });
      return { value: (i + 1).toString(), label: monthName.charAt(0).toUpperCase() + monthName.slice(1) };
    });

  const getMoodLabel = (mood: string) => {
    const lower = mood.toLowerCase();
    if (lower.includes("positive") || lower.includes("позитив")) return t("company.positive");
    if (lower.includes("negative") || lower.includes("негатив")) return t("company.negative");
    return t("company.neutral");
  };

  const getTrendLabel = (trend: string) => {
    if (trend === "up") return t("company.growing");
    if (trend === "down") return t("company.declining");
    return t("company.stable");
  };

  /* ── PDF generation ── */
  const generatePdfReport = async () => {
    if (!permissions.canViewReports || !distribution || !stats || !growthMetrics || !company) return;

    const month = parseInt(selectedMonth).toString().padStart(2, "0");
    const generatedDate = new Date().toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const doc = new jsPDF();

    doc.addFileToVFS("Roboto-Regular.ttf", robotoRegular);
    doc.addFileToVFS("Roboto-Bold.ttf", robotoMedium);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
    doc.setFont("Roboto");

    /* Title */
    doc.setFontSize(20);
    doc.setFont("Roboto", "normal");
    doc.text(t("company.reports") || "Отчёт", 105, 20, { align: "center" });

    /* Meta */
    autoTable(doc, {
      startY: 30,
      head: [],
      body: [
        [t("company.period") || "Период", getSelectedMonthPeriod()],
        [t("company.companyName") || "Компания", company.name],
        [t("company.codeForEmployees") || "Код", company.code],
      ],
      theme: "plain",
      styles: { fontSize: 12, cellPadding: 2, font: "Roboto" },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    });

    /* Distribution */
    doc.setFontSize(14);
    doc.text(
      t("company.messageDistribution") || "Распределение",
      14,
      (doc as any).lastAutoTable.finalY + 15
    );
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[t("messages.type") || "Тип", t("messages.total") || "Кол-во", "%"]],
      body: [
        [t("sendMessage.complaint") || "Жалоба", String(distribution.complaints), `${complaintsPercent}%`],
        [t("sendMessage.praise") || "Похвала", String(distribution.praises), `${praisesPercent}%`],
        [t("sendMessage.suggestion") || "Предложение", String(distribution.suggestions), `${suggestionsPercent}%`],
        [t("admin.totalMessages") || "Всего", String(total), ""],
      ],
      theme: "grid",
      headStyles: { fillColor: [10, 10, 10], textColor: [204, 255, 0], fontStyle: "bold", font: "Roboto" },
      bodyStyles: { fontSize: 11, font: "Roboto" },
      didParseCell: (data: any) => {
        if (data.row.index === data.table.body.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    /* Case status */
    doc.setFontSize(14);
    doc.text(
      t("company.resolvedCases") || "Статус кейсов",
      14,
      (doc as any).lastAutoTable.finalY + 15
    );
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[t("company.resolvedCases") || "Статус", t("messages.total") || "Кол-во"]],
      body: [
        [t("company.resolved") || "Resolved", String(resolved)],
        [t("company.unresolved") || "Нерешено", String(unresolved)],
        [t("company.resolutionRate") || "% решения", `${resolutionRate}%`],
      ],
      theme: "grid",
      headStyles: { fillColor: [10, 10, 10], textColor: [204, 255, 0], fontStyle: "bold", font: "Roboto" },
      bodyStyles: { fontSize: 11, font: "Roboto" },
      columnStyles: { 0: { cellWidth: 120 }, 1: { halign: "right" } },
    });

    /* Mood */
    doc.setFontSize(14);
    doc.text(
      t("company.teamMood") || "Настроение команды",
      14,
      (doc as any).lastAutoTable.finalY + 15
    );
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[t("company.teamMood") || "Параметр", t("messages.total") || "Значение"]],
      body: [
        [t("company.growthRating") || "Рейтинг", String(growthMetrics.rating)],
        [t("company.overallMood") || "Настрой", getMoodLabel(growthMetrics.mood)],
        [t("company.trend") || "Тренд", getTrendLabel(growthMetrics.trend)],
      ],
      theme: "grid",
      headStyles: { fillColor: [10, 10, 10], textColor: [204, 255, 0], fontStyle: "bold", font: "Roboto" },
      bodyStyles: { fontSize: 11, font: "Roboto" },
      columnStyles: { 0: { cellWidth: 120 }, 1: { halign: "right" } },
    });

    /* Footer */
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `${t("company.generatedAt") || "Сформировано"}: ${generatedDate}`,
        195,
        285,
        { align: "right" }
      );
    }

    const safeName = company.name.replace(/[^a-zA-Z0-9а-яА-Я]/g, "_");
    doc.save(`Report_${safeName}_${selectedYear}-${month}.pdf`);
  };

  /* ── render ── */
  return (
    <div
      className={`min-h-screen bg-background flex flex-col overflow-x-hidden ${
        isFullscreen ? "h-auto overflow-y-auto" : ""
      }`}
    >
      <CompanyHeader />

      <main
        className={`flex-1 px-4 sm:px-6 py-6 flex flex-col gap-6 ${
          isFullscreen ? "h-auto overflow-visible" : "overflow-y-auto"
        }`}
      >
        {/* ── PAGE TITLE ── */}
        <div className="flex items-end gap-4">
          <h1
            className="text-brutal text-4xl sm:text-5xl font-black leading-none"
            style={{ color: NEON, textShadow: `2px 2px 0 ${BLACK}` }}
          >
            {t("company.reports") || "REPORTS"}
          </h1>
          <div className="h-[3px] flex-1 mb-2" style={{ backgroundColor: NEON }} />
        </div>

        {/* ── CONTROLS BAR ── */}
        <div
          className="border-2 p-4 flex flex-wrap items-end gap-4"
          style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
        >
          {/* Month */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-brutal text-[10px] tracking-widest text-muted-foreground flex items-center gap-1">
              <FiCalendar className="h-3 w-3" />
              {t("company.selectMonth")}
            </label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger
                className="font-mono text-sm border-2"
                style={{ borderRadius: 0, borderColor: "hsl(var(--foreground))" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ borderRadius: 0 }}>
                {getMonthOptions().map((m) => (
                  <SelectItem key={m.value} value={m.value} className="font-mono">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <label className="text-brutal text-[10px] tracking-widest text-muted-foreground flex items-center gap-1">
              <FiBarChart2 className="h-3 w-3" />
              {t("company.selectYear")}
            </label>
            <input
              type="number"
              min="1900"
              max="2100"
              step="1"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value || now.getFullYear().toString())}
              className="font-mono text-sm bg-background border-2 border-foreground px-3 py-2 focus:outline-none focus:border-primary w-full"
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Generate / Download button */}
          {permissions.canViewReports ? (
            <Button
              onClick={generatePdfReport}
              disabled={isLoading}
              className="text-brutal text-xs tracking-widest font-black flex items-center gap-2 flex-shrink-0"
              style={{
                borderRadius: 0,
                backgroundColor: NEON,
                color: BLACK,
                border: `2px solid ${BLACK}`,
                boxShadow: `3px 3px 0 ${BLACK}`,
              }}
            >
              <FiDownload className="h-4 w-4" />
              {t("company.downloadMonthlyReport")}
            </Button>
          ) : (
            <div
              className="flex items-center gap-2 border-2 border-dashed px-4 py-2 text-xs font-mono flex-shrink-0"
              style={{ borderColor: DANGER, color: DANGER }}
            >
              <FiLock className="h-4 w-4" />
              {t("company.upgradeRequired") || "UPGRADE REQUIRED"}
            </div>
          )}
        </div>

        {/* ── PREVIEW PERIOD ── */}
        <div className="flex items-center gap-2">
          <span className="text-brutal text-[10px] tracking-widest text-muted-foreground">
            {t("company.period")}:
          </span>
          <span
            className="font-mono font-black text-sm"
            style={{ color: NEON }}
          >
            {getSelectedMonthPeriod()}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
              {t("common.loading")}
            </span>
          </div>
        ) : (
          <>
            {/* ══ STAT CARDS ══════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: <FiMessageSquare className="h-4 w-4" />,
                  label: t("admin.totalMessages"),
                  value: total,
                  sub: null,
                  color: NEON,
                },
                {
                  icon: <FiAlertCircle className="h-4 w-4" />,
                  label: t("sendMessage.complaint"),
                  value: distribution?.complaints || 0,
                  sub: `${complaintsPercent}%`,
                  color: DANGER,
                },
                {
                  icon: <FiAward className="h-4 w-4" />,
                  label: t("sendMessage.praise"),
                  value: distribution?.praises || 0,
                  sub: `${praisesPercent}%`,
                  color: SUCCESS,
                },
                {
                  icon: <FiZap className="h-4 w-4" />,
                  label: t("sendMessage.suggestion"),
                  value: distribution?.suggestions || 0,
                  sub: `${suggestionsPercent}%`,
                  color: "#00CFFF",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="border-2 p-4 flex flex-col"
                  style={{ borderColor: card.color, backgroundColor: "hsl(var(--card))" }}
                >
                  <div
                    className="w-7 h-7 flex items-center justify-center mb-3 flex-shrink-0"
                    style={{ backgroundColor: card.color, color: BLACK }}
                  >
                    {card.icon}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    {card.label}
                  </p>
                  <span
                    className="font-mono font-black text-3xl leading-none"
                    style={{ color: card.color }}
                  >
                    {card.value}
                  </span>
                  {card.sub && (
                    <span className="font-mono text-xs font-bold mt-1" style={{ color: card.color }}>
                      {card.sub}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* ══ REPORT PREVIEW AREA ════════════════════════════════════ */}
            <div
              className="border-2 p-5"
              style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
            >
              <p className="text-brutal text-xs tracking-widest text-muted-foreground mb-5">
                {t("company.reportPreview") || "REPORT PREVIEW"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ── Distribution bars ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FiBarChart2 className="h-4 w-4" style={{ color: NEON }} />
                    <h3 className="text-brutal text-xs tracking-widest text-foreground">
                      {t("company.messageDistribution")}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: t("sendMessage.complaint"), pct: complaintsPercent, color: DANGER },
                      { label: t("sendMessage.praise"), pct: praisesPercent, color: SUCCESS },
                      { label: t("sendMessage.suggestion"), pct: suggestionsPercent, color: "#00CFFF" },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="font-bold" style={{ color: row.color }}>
                            {row.pct}%
                          </span>
                        </div>
                        <div
                          className="h-4 border-2 overflow-hidden"
                          style={{ borderColor: row.color }}
                        >
                          <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Cases ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FiCheckCircle className="h-4 w-4" style={{ color: SUCCESS }} />
                    <h3 className="text-brutal text-xs tracking-widest text-foreground">
                      {t("company.resolvedCases")}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: <FiCheckCircle className="h-4 w-4" />, label: t("company.resolved"), value: resolved, color: SUCCESS },
                      { icon: <FiX className="h-4 w-4" />, label: t("company.unresolved"), value: unresolved, color: DANGER },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between border-2 px-3 py-2"
                        style={{ borderColor: row.color }}
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ color: row.color }}>{row.icon}</span>
                          <span className="text-xs font-mono text-muted-foreground">{row.label}</span>
                        </div>
                        <span className="font-mono font-black text-2xl" style={{ color: row.color }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                    <div className="border-t-2 border-dashed pt-3" style={{ borderColor: "hsl(var(--border))" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-muted-foreground">
                          {t("company.resolutionRate")}
                        </span>
                        <span className="font-mono font-black text-xl" style={{ color: SUCCESS }}>
                          {resolutionRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Team mood (plan-gated) ── */}
                {permissions.canViewTeamMood && growthMetrics ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FiTrendingUp className="h-4 w-4" style={{ color: NEON }} />
                      <h3 className="text-brutal text-xs tracking-widest text-foreground">
                        {t("company.teamMood")}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: t("company.growthRating"), value: String(growthMetrics.rating), color: NEON },
                        { label: t("company.overallMood"), value: getMoodLabel(growthMetrics.mood), color: "#00CFFF" },
                        { label: t("company.trend"), value: getTrendLabel(growthMetrics.trend), color: SUCCESS },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between border-2 px-3 py-2"
                          style={{ borderColor: "hsl(var(--border))" }}
                        >
                          <span className="text-xs font-mono text-muted-foreground">{row.label}</span>
                          <span className="font-mono font-bold text-base" style={{ color: row.color }}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !permissions.canViewTeamMood ? (
                  <div
                    className="border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2"
                    style={{ borderColor: DANGER }}
                  >
                    <FiLock className="h-6 w-6" style={{ color: DANGER }} />
                    <p className="text-brutal text-[10px] tracking-widest" style={{ color: DANGER }}>
                      {t("company.upgradeRequired") || "UPGRADE REQUIRED"}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* ── Download CTA ── */}
            {permissions.canViewReports && (
              <div className="flex justify-end">
                <Button
                  onClick={generatePdfReport}
                  disabled={isLoading}
                  className="text-brutal text-xs tracking-widest font-black flex items-center gap-2"
                  style={{
                    borderRadius: 0,
                    backgroundColor: BLACK,
                    color: NEON,
                    border: `2px solid ${NEON}`,
                    boxShadow: `4px 4px 0 ${NEON}`,
                  }}
                >
                  <FiDownload className="h-4 w-4" />
                  {t("company.downloadMonthlyReport")}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CompanyReports;
