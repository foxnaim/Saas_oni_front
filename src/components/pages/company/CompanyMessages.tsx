'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useCompany, useMessages, useUpdateMessageStatus } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiX,
  FiAlertCircle,
  FiAlertTriangle,
  FiCreditCard,
  FiMessageSquare,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiSend,
  FiEdit2,
} from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { Message, MessageStatus } from "@/types";
import { toast } from "sonner";
import { MESSAGE_STATUSES } from "@/lib/utils/constants";
import { useSocketMessages } from "@/lib/websocket/useSocket";
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";
import { useDebounce } from "@/hooks/use-debounce";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { useRouter } from "next/navigation";
import { PAGINATION } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";

// ─── helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string, locale: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return locale.startsWith("ru") ? "только что" : locale.startsWith("kk") ? "жаңа ғана" : "just now";
    if (mins < 60) return locale.startsWith("ru") ? `${mins} мин. назад` : locale.startsWith("kk") ? `${mins} мин. бұрын` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return locale.startsWith("ru") ? `${hours} ч. назад` : locale.startsWith("kk") ? `${hours} сағ. бұрын` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return locale.startsWith("ru") ? `${days} д. назад` : locale.startsWith("kk") ? `${days} күн бұрын` : `${days}d ago`;
  } catch {
    return iso;
  }
}

function normalizeId(id: string) {
  return id.replace(/[-_\s]/g, "").toUpperCase();
}

function looksLikeId(q: string) {
  return q.length >= 6 && /^FB/i.test(q) && /\d/.test(q);
}

// ─── type-badge colours ─────────────────────────────────────────────────────

const TYPE_COLOURS: Record<string, string> = {
  complaint:  "border-accent bg-accent/10 text-accent",
  praise:     "border-emerald-500 bg-emerald-500/10 text-emerald-600",
  suggestion: "border-sky-500 bg-sky-500/10 text-sky-600",
};

// ─── status-badge colours ────────────────────────────────────────────────────

function statusColour(status: string): string {
  if (status === MESSAGE_STATUSES.NEW || status === "New")           return "border-primary bg-primary/10 text-primary";
  if (status === MESSAGE_STATUSES.IN_PROGRESS || status === "InProgress") return "border-violet-500 bg-violet-500/10 text-violet-600";
  if (status === MESSAGE_STATUSES.RESOLVED || status === "Resolved")     return "border-emerald-500 bg-emerald-500/10 text-emerald-600";
  if (status === MESSAGE_STATUSES.REJECTED || status === "Rejected")  return "border-foreground/40 bg-muted text-muted-foreground";
  if (status === MESSAGE_STATUSES.SPAM || status === "Spam")           return "border-destructive bg-destructive/10 text-destructive";
  return "border-foreground/20 bg-muted text-muted-foreground";
}

// ─── skeleton row ─────────────────────────────────────────────────────────

function MessageSkeleton() {
  return (
    <div className="border-2 border-foreground/10 bg-card p-5 flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-32 rounded-none" />
          <Skeleton className="h-5 w-20 rounded-none" />
          <Skeleton className="h-5 w-20 rounded-none" />
        </div>
        <Skeleton className="h-4 w-full rounded-none" />
        <Skeleton className="h-4 w-3/4 rounded-none" />
      </div>
      <Skeleton className="h-9 w-24 rounded-none self-start" />
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

const CompanyMessages = () => {
  const { isFullscreen } = useFullscreenContext();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const permissions = usePlanPermissions();

  const { data: company } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  const isTrialExpired =
    permissions.isFree && company?.trialEndDate
      ? (() => {
          try {
            return new Date() > new Date(company.trialEndDate);
          } catch {
            return false;
          }
        })()
      : false;

  // ── filter state ────────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter]     = useState("all");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [currentPage, setCurrentPage]   = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const trimmed    = debouncedSearch.trim();
  const isIdSearch = looksLikeId(trimmed);
  const normalizedId = isIdSearch ? normalizeId(trimmed) : undefined;

  const pageForApi  = isIdSearch ? undefined : currentPage;
  const limitForApi = isIdSearch ? undefined : PAGINATION.MESSAGES_PAGE_SIZE;

  // ── data fetching ────────────────────────────────────────────────────────

  const { data: messagesResult, isLoading, refetch } = useMessages(
    company?.code,
    pageForApi,
    limitForApi,
    normalizedId,
    {
      enabled: !!company?.code,
      staleTime: 5_000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  const messages   = messagesResult?.data ?? [];
  const pagination = messagesResult?.pagination;

  useSocketMessages(company?.code);

  // ── mutations ────────────────────────────────────────────────────────────

  const lastLocalUpdateRef = useRef<number>(0);

  const [selectedMessage, setSelectedMessage]     = useState<Message | null>(null);
  const [responseText, setResponseText]           = useState("");
  const [isSheetOpen, setIsSheetOpen]             = useState(false);
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [expandedIds, setExpandedIds]             = useState<Set<string>>(new Set());

  const { mutate: updateMessageStatus } = useUpdateMessageStatus({
    onMutate: async (variables) => {
      lastLocalUpdateRef.current = Date.now();
      if (selectedMessage && selectedMessage.id === variables.id) {
        const optimistic: Message = {
          ...selectedMessage,
          status:          variables.status || selectedMessage.status,
          companyResponse: variables.response !== undefined ? variables.response : selectedMessage.companyResponse,
          updatedAt:       new Date().toISOString(),
          lastUpdate:      new Date().toISOString().split("T")[0],
        };
        setSelectedMessage(optimistic);
        setResponseText(optimistic.companyResponse || "");
        setIsEditingResponse(false);
      }
      return {} as any;
    },
    onSuccess: (updated) => {
      lastLocalUpdateRef.current = Date.now();
      toast.success(t("messages.statusUpdated"));
      let msg = updated;
      if (!updated.companyResponse && responseText?.trim()) {
        msg = { ...updated, companyResponse: responseText };
      }
      setSelectedMessage(msg);
      setResponseText(msg.companyResponse || "");
      setIsEditingResponse(false);
      setIsSheetOpen(false);
    },
    onError: (error: any) => {
      setIsEditingResponse(true);
      const raw = error?.response?.data?.message || error?.message || "";
      const lo  = raw.toLowerCase();
      let msg   = t("messages.statusUpdateError");
      if (lo.includes("insufficient permissions") || lo.includes("access denied") || lo.includes("forbidden")) {
        msg = t("auth.accessDenied");
      } else if (raw.includes("Cannot modify") && lo.includes("rejected by admin")) {
        msg = t("messages.cannotModifyRejected");
      } else if (raw && !raw.includes("HTTP error")) {
        msg = raw;
      }
      toast.error(msg);
    },
  });

  // ── helpers ───────────────────────────────────────────────────────────────

  const isRejectedByAdmin = (m: Message) => m.status === "Spam" && !!m.previousStatus;

  const normalizeStatus = useCallback(
    (s: string): string => {
      if (s === "all") return "all";
      const map: Record<string, string> = {
        [t("checkStatus.new")]:        MESSAGE_STATUSES.NEW,
        [t("checkStatus.inProgress")]: MESSAGE_STATUSES.IN_PROGRESS,
        [t("checkStatus.resolved")]:   MESSAGE_STATUSES.RESOLVED,
        [t("checkStatus.rejected")]:   MESSAGE_STATUSES.REJECTED,
        [t("checkStatus.spam")]:       MESSAGE_STATUSES.SPAM,
      };
      return map[s] || s;
    },
    [t]
  );

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "complaint":  return t("sendMessage.complaint");
      case "praise":     return t("sendMessage.praise");
      case "suggestion": return t("sendMessage.suggestion");
      default:           return type;
    }
  };

  // ── client-side filtering ─────────────────────────────────────────────────

  const filteredMessages = messages.filter((m) => {
    const ns  = normalizeStatus(statusFilter);
    const okStatus = ns === "all" || m.status === ns;
    const okType   = typeFilter === "all" || m.type === typeFilter;

    let okDate = true;
    if (dateFrom || dateTo) {
      const created = new Date(m.createdAt);
      if (dateFrom && created < new Date(dateFrom))                 okDate = false;
      if (dateTo   && created > new Date(dateTo + "T23:59:59"))     okDate = false;
    }

    if (isIdSearch && normalizedId) {
      return okStatus && okType && okDate;
    }

    const qn     = normalizeId(searchQuery);
    const idNorm = normalizeId(m.id);
    const okSearch =
      !searchQuery ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idNorm.includes(qn) ||
      m.companyCode.toUpperCase().includes(searchQuery.toUpperCase());

    return okStatus && okType && okDate && okSearch;
  });

  // ── actions ───────────────────────────────────────────────────────────────

  const openSheet = (m: Message) => {
    setSelectedMessage(m);
    setResponseText(m.companyResponse || "");
    setIsEditingResponse(false);
    setIsSheetOpen(true);
  };

  const handleUpdateStatus = (status: MessageStatus) => {
    if (!selectedMessage) return;
    lastLocalUpdateRef.current = Date.now();
    setIsEditingResponse(false);
    updateMessageStatus({ id: selectedMessage.id, status, response: responseText || undefined });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── sync selectedMessage when list updates ────────────────────────────────

  const prevSelectedRef = useRef<Message | null>(null);

  useEffect(() => {
    if (!selectedMessage) return;
    const updated = messages.find((m) => m.id === selectedMessage.id);
    if (!updated) return;

    const staleStatus   = updated.status === "New" && selectedMessage.status !== "New";
    const staleResponse = !updated.companyResponse && selectedMessage.companyResponse;
    const inGrace       = Date.now() - lastLocalUpdateRef.current < 10_000;

    if (staleStatus || staleResponse || inGrace) return;

    const updDate = new Date(updated.updatedAt).toISOString().split("T")[0];
    const selDate = new Date(selectedMessage.updatedAt).toISOString().split("T")[0];
    const changed =
      updated.companyResponse !== selectedMessage.companyResponse ||
      updated.status !== selectedMessage.status ||
      updDate !== selDate;

    if (changed) {
      setSelectedMessage(updated);
      if (!isEditingResponse) setResponseText(updated.companyResponse || "");
    }
    prevSelectedRef.current = selectedMessage;
  }, [messages, selectedMessage, isEditingResponse]);

  // reset page on filter changes
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter, typeFilter, dateFrom, dateTo]);

  // refetch on tab focus
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && company?.code) refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [company?.code, refetch]);

  // ── status tab options ────────────────────────────────────────────────────

  const statusTabs = [
    { value: "all",                           label: t("messages.allStatuses") || "ALL" },
    { value: t("checkStatus.new"),            label: t("checkStatus.new") },
    { value: t("checkStatus.inProgress"),     label: t("checkStatus.inProgress") },
    { value: t("checkStatus.resolved"),       label: t("checkStatus.resolved") },
    { value: t("checkStatus.rejected"),       label: t("checkStatus.rejected") },
    { value: t("checkStatus.spam"),           label: t("checkStatus.spam") },
  ];

  const typeOptions = [
    { value: "all",        label: t("messages.allTypes") || "ALL TYPES" },
    { value: "complaint",  label: t("sendMessage.complaint") },
    { value: "praise",     label: t("sendMessage.praise") },
    { value: "suggestion", label: t("sendMessage.suggestion") },
  ];

  // ── locale string for relative time ──────────────────────────────────────

  const locale = i18n.language || "en";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "min-h-screen bg-background flex flex-col overflow-x-hidden w-full",
        isFullscreen && "h-auto overflow-y-auto"
      )}
    >
      <CompanyHeader />

      <main className="flex-1 px-4 sm:px-6 py-6 w-full flex flex-col gap-6">

        {/* ── PAGE TITLE ── */}
        <div className="flex items-end justify-between gap-4 border-b-4 border-foreground pb-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
            {t("company.messages") || "MESSAGES"}
          </h1>
          {pagination?.total != null && (
            <span className="font-mono text-sm text-muted-foreground mb-1">
              {pagination.total} TOTAL
            </span>
          )}
        </div>

        {/* ── TRIAL EXPIRED WARNING ── */}
        {isTrialExpired && permissions.isReadOnly && !permissions.canReply && (
          <div className="border-2 border-destructive bg-destructive/5 p-4 flex items-start gap-3">
            <FiAlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold uppercase text-destructive mb-1">
                {t("company.tariffExpiredTitle")}
              </p>
              <p className="text-xs text-foreground mb-3">
                {t("company.tariffExpiredMessageShort")}
              </p>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => router.push("/company/billing")}
              >
                <FiCreditCard className="h-3 w-3" />
                {t("company.upgradeTariff")}
              </Button>
            </div>
          </div>
        )}

        {/* ── FILTER BAR ── */}
        <div className="border-2 border-foreground/20 bg-card p-4 flex flex-col gap-4">

          {/* Status tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="flex-wrap gap-0 h-auto border-b-0 overflow-x-auto">
              {statusTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "border-2 border-foreground/20 -m-[1px] px-3 py-2 text-xs font-black uppercase tracking-wide",
                    "data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background",
                    "data-[state=inactive]:bg-background data-[state=inactive]:text-foreground/60",
                    "rounded-none border-b-0"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Second row: type + search + dates */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Type filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger
                className={cn(
                  "rounded-none border-2 border-foreground/20 font-mono text-xs uppercase tracking-wide",
                  "h-10 w-full sm:w-[170px] focus:border-foreground focus:ring-0"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2 border-foreground">
                {typeOptions.map((o) => (
                  <SelectItem
                    key={o.value}
                    value={o.value}
                    className="font-mono text-xs uppercase rounded-none focus:bg-foreground focus:text-background"
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("messages.searchPlaceholder") || "SEARCH BY ID OR CONTENT"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-2 border-foreground/20 focus:border-foreground uppercase placeholder:uppercase placeholder:text-xs"
                autoComplete="off"
              />
            </div>

            {/* Date from */}
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-9 border-2 border-foreground/20 focus:border-foreground font-mono text-xs w-full sm:w-[150px]"
              />
            </div>

            {/* Date to */}
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-9 border-2 border-foreground/20 focus:border-foreground font-mono text-xs w-full sm:w-[150px]"
              />
            </div>
          </div>
        </div>

        {/* ── MESSAGES LIST ── */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <MessageSkeleton key={i} />
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div className="border-2 border-foreground/20 bg-card flex flex-col items-center justify-center py-20 gap-6">
            {/* Illustration placeholder */}
            <div className="w-24 h-24 border-4 border-foreground/20 flex items-center justify-center">
              <FiMessageSquare className="h-12 w-12 text-foreground/20" />
            </div>
            <p className="font-black text-2xl uppercase tracking-tighter text-foreground/30">
              NO MESSAGES YET
            </p>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
              {t("messages.noMessagesFound")}
            </p>
          </div>
        ) : (
          <>
            {/* Count line */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wide">
                {t("messages.found")}: {filteredMessages.length}
                {messages.length !== filteredMessages.length && ` / ${messages.length}`}
                {pagination && ` — ${t("company.page") || "PAGE"} ${pagination.page}/${pagination.totalPages}`}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {filteredMessages.map((msg) => {
                const rejected  = isRejectedByAdmin(msg);
                const expanded  = expandedIds.has(msg.id);
                const typeLabel = getTypeLabel(msg.type);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "border-2 bg-card transition-all duration-100",
                      rejected ? "border-destructive/60" : "border-foreground/15 hover:border-foreground/40",
                    )}
                  >
                    {/* ── card header row ── */}
                    <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-start">

                      {/* Meta */}
                      <div className="flex-1 min-w-0 space-y-2">

                        {/* rejected banner */}
                        {rejected && (
                          <div className="border-l-4 border-destructive bg-destructive/5 px-3 py-1.5 mb-2">
                            <p className="text-xs font-bold uppercase text-destructive">
                              {t("checkStatus.rejectedByAdmin")}
                            </p>
                          </div>
                        )}

                        {/* ID + badges + date */}
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="font-mono text-xs font-bold text-primary tracking-wide">
                            {msg.id}
                          </code>
                          <Badge
                            className={cn(
                              "rounded-none border-2 text-[10px] font-bold uppercase tracking-wider",
                              TYPE_COLOURS[msg.type] ?? "border-foreground/30 bg-muted text-foreground"
                            )}
                          >
                            {typeLabel}
                          </Badge>
                          <Badge
                            className={cn(
                              "rounded-none border-2 text-[10px] font-bold uppercase tracking-wider",
                              statusColour(msg.status)
                            )}
                          >
                            {msg.status}
                          </Badge>
                          <span className="font-mono text-[10px] text-muted-foreground uppercase">
                            {relativeTime(msg.createdAt, locale)}
                          </span>
                        </div>

                        {/* Content preview / full */}
                        <p className={cn(
                          "text-sm text-foreground leading-relaxed break-words",
                          !expanded && "line-clamp-2"
                        )}>
                          {msg.content}
                        </p>

                        {/* Response preview */}
                        {msg.companyResponse && !expanded && (
                          <div className="border-l-2 border-primary/40 pl-3">
                            <p className="text-xs font-mono text-muted-foreground uppercase mb-0.5">
                              {t("messages.yourResponse")}
                            </p>
                            <p className="text-xs text-foreground line-clamp-1">
                              {msg.companyResponse}
                            </p>
                          </div>
                        )}

                        {/* Expanded response */}
                        {msg.companyResponse && expanded && (
                          <div className="border-l-2 border-primary pl-3 mt-2">
                            <p className="text-xs font-mono text-muted-foreground uppercase mb-1">
                              {t("messages.yourResponse")}
                            </p>
                            <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                              {msg.companyResponse}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background rounded-none font-bold uppercase text-xs tracking-wide"
                          onClick={() => openSheet(msg)}
                        >
                          {t("messages.open") || "OPEN"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="border-2 border-foreground/20 rounded-none text-xs font-mono w-9 h-9 p-0"
                          onClick={() => toggleExpand(msg.id)}
                          title={expanded ? "Collapse" : "Expand"}
                        >
                          {expanded ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── PAGINATION ── */}
            {!isIdSearch && pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t-2 border-foreground/10 pt-4 mt-2">
                <span className="font-mono text-xs text-muted-foreground uppercase">
                  {currentPage} / {pagination.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <Button
                    variant="outline"
                    className="h-9 w-9 p-0 rounded-none border-2 border-foreground/20 hover:border-foreground font-mono"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                    const total = pagination.totalPages;
                    let page: number;
                    if (total <= 7) {
                      page = i + 1;
                    } else if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= total - 3) {
                      page = total - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }
                    // On mobile: only show current page ±1 (hide outer pages)
                    const isNearCurrent = Math.abs(page - currentPage) <= 1;
                    return (
                      <Button
                        key={page}
                        variant="outline"
                        className={cn(
                          "h-9 w-9 p-0 rounded-none border-2 font-mono text-xs",
                          !isNearCurrent && "hidden sm:inline-flex",
                          page === currentPage
                            ? "border-foreground bg-foreground text-background"
                            : "border-foreground/20 hover:border-foreground"
                        )}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}

                  {/* Next */}
                  <Button
                    variant="outline"
                    className="h-9 w-9 p-0 rounded-none border-2 border-foreground/20 hover:border-foreground font-mono"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════════
          DETAIL SHEET
      ════════════════════════════════════════════════════════════════════ */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg border-l-4 border-foreground bg-background p-0 overflow-y-auto"
          style={{ maxWidth: "100vw" }}
        >
          {selectedMessage && (
            <div className="flex flex-col h-full">

              {/* Sheet header */}
              <div className="border-b-2 border-foreground/20 px-6 py-5">
                <SheetHeader>
                  <SheetTitle className="text-xl font-black uppercase tracking-tighter">
                    {t("messages.messageDetails") || "MESSAGE DETAILS"}
                  </SheetTitle>
                  <SheetDescription asChild>
                    <code className="font-mono text-xs text-primary tracking-wide">
                      {selectedMessage.id}
                    </code>
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* Rejected-by-admin banner */}
                {isRejectedByAdmin(selectedMessage) && (
                  <div className="border-l-4 border-destructive bg-destructive/5 p-4">
                    <p className="text-sm font-bold uppercase text-destructive mb-1">
                      {t("checkStatus.rejectedByAdmin")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("messages.cannotModifyRejected")}
                    </p>
                  </div>
                )}

                {/* Badges + timestamps */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={cn(
                        "rounded-none border-2 text-[10px] font-bold uppercase tracking-wider",
                        TYPE_COLOURS[selectedMessage.type] ?? "border-foreground/30 bg-muted"
                      )}
                    >
                      {getTypeLabel(selectedMessage.type)}
                    </Badge>
                    <Badge
                      className={cn(
                        "rounded-none border-2 text-[10px] font-bold uppercase tracking-wider",
                        statusColour(selectedMessage.status)
                      )}
                    >
                      {selectedMessage.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-muted-foreground uppercase">
                    <div>
                      <span className="block text-foreground/40">{t("checkStatus.created")}</span>
                      {new Date(selectedMessage.createdAt).toLocaleString(locale)}
                    </div>
                    <div>
                      <span className="block text-foreground/40">{t("checkStatus.updated")}</span>
                      {new Date(selectedMessage.updatedAt).toLocaleString(locale)}
                    </div>
                  </div>
                </div>

                {/* Full content */}
                <div className="space-y-2">
                  <Label className="font-black uppercase text-xs tracking-wide">
                    {t("sendMessage.message") || "MESSAGE"}
                  </Label>
                  <div className="border-2 border-foreground/20 bg-muted/30 p-4 max-h-56 overflow-y-auto">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
                      {selectedMessage.content}
                    </p>
                  </div>
                </div>

                {/* Response section */}
                {selectedMessage.companyResponse && !isEditingResponse ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-black uppercase text-xs tracking-wide">
                        {t("messages.yourResponse") || "YOUR RESPONSE"}
                      </Label>
                      {permissions.canReply && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs font-mono uppercase rounded-none border border-foreground/20 hover:bg-foreground hover:text-background"
                          onClick={() => setIsEditingResponse(true)}
                        >
                          <FiEdit2 className="h-3 w-3" />
                          {t("common.edit") || "EDIT"}
                        </Button>
                      )}
                    </div>
                    <div className="border-l-4 border-primary bg-primary/5 p-4">
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {selectedMessage.companyResponse}
                      </p>
                    </div>
                  </div>
                ) : permissions.canReply ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-black uppercase text-xs tracking-wide">
                        {t("messages.response") || "RESPONSE"}
                      </Label>
                      {selectedMessage.companyResponse && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs font-mono uppercase rounded-none border border-foreground/20 hover:bg-foreground hover:text-background"
                          onClick={() => setIsEditingResponse(false)}
                        >
                          <FiX className="h-3 w-3" />
                          {t("common.cancel") || "CANCEL"}
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder={t("messages.enterResponse") || "TYPE YOUR RESPONSE…"}
                      className="min-h-[120px] border-2 border-foreground/20 focus:border-foreground rounded-none font-mono text-sm"
                      disabled={isRejectedByAdmin(selectedMessage)}
                    />
                  </div>
                ) : (
                  <div className="border-2 border-destructive/40 bg-destructive/5 p-4 flex gap-3">
                    <FiAlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold uppercase text-destructive mb-1">
                        {t("company.functionUnavailable")}
                      </p>
                      <p className="text-xs text-foreground mb-3">
                        {isTrialExpired ? t("company.tariffExpiredMessageShort") : t("company.upgradeRequired")}
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => router.push("/company/billing")}
                      >
                        <FiCreditCard className="h-3 w-3" />
                        {t("company.upgradeTariff")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status change buttons */}
                {permissions.canChangeStatus && (
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs tracking-wide">
                      {t("checkStatus.status") || "CHANGE STATUS"}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none border-2 border-violet-500/50 text-violet-600 hover:bg-violet-500 hover:text-white font-bold uppercase text-xs tracking-wide"
                        onClick={() => handleUpdateStatus("InProgress" as MessageStatus)}
                        disabled={isRejectedByAdmin(selectedMessage) || selectedMessage.status === "InProgress"}
                      >
                        <FiClock className="h-3 w-3" />
                        {t("checkStatus.inProgress")}
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-none border-2 border-emerald-500 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white font-bold uppercase text-xs tracking-wide shadow-none"
                        onClick={() => handleUpdateStatus("Resolved" as MessageStatus)}
                        disabled={isRejectedByAdmin(selectedMessage) || selectedMessage.status === "Resolved"}
                      >
                        <FiCheckCircle className="h-3 w-3" />
                        {t("checkStatus.resolved")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none border-2 border-foreground/30 font-bold uppercase text-xs tracking-wide"
                        onClick={() => handleUpdateStatus("Rejected" as MessageStatus)}
                        disabled={isRejectedByAdmin(selectedMessage) || selectedMessage.status === "Rejected"}
                      >
                        <FiX className="h-3 w-3" />
                        {t("messages.reject")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none border-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-white font-bold uppercase text-xs tracking-wide"
                        onClick={() => handleUpdateStatus("Spam" as MessageStatus)}
                        disabled={isRejectedByAdmin(selectedMessage) || selectedMessage.status === "Spam"}
                      >
                        <FiAlertCircle className="h-3 w-3" />
                        {t("checkStatus.spam")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status-gate hint */}
                {permissions.canReply && responseText.trim() && selectedMessage.status === "New" && (
                  <p className="font-mono text-xs text-destructive uppercase tracking-wide text-center border-2 border-destructive/30 py-2">
                    {t("messages.changeStatusBeforeReply") || "SELECT A STATUS BEFORE SENDING A RESPONSE"}
                  </p>
                )}
              </div>

              {/* Sheet footer — send button */}
              {permissions.canReply && responseText.trim() && selectedMessage.status !== "New" && (
                <div className="border-t-2 border-foreground/20 px-6 py-4">
                  <Button
                    className="w-full rounded-none border-2 border-foreground font-black uppercase tracking-wide text-sm shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    onClick={() => {
                      if (responseText.trim()) handleUpdateStatus(selectedMessage.status);
                    }}
                    disabled={!responseText.trim()}
                  >
                    <FiSend className="h-4 w-4" />
                    {t("company.saveResponse") || "SEND RESPONSE"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CompanyMessages;
