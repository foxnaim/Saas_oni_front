'use client';

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FiSearch,
  FiEye,
  FiCheckCircle,
  FiX,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
} from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useMessages, useDeleteMessage } from "@/lib/query";
import { messageService } from "@/lib/query/services";
import { Message } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MESSAGE_STATUSES, PAGINATION } from "@/lib/utils/constants";
import { useSocketMessages } from "@/lib/websocket/useSocket";

/* ─── helpers ──────────────────────────────────────────────────────────── */
const fmtDate = (d: string | Date | undefined): string => {
  if (!d) return "—";
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

/* ─── status colour map ────────────────────────────────────────────────── */
const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  [MESSAGE_STATUSES.NEW]:         { bg: "#FF3D00",  text: "#FFFFFF", border: "#FF3D00" },
  [MESSAGE_STATUSES.IN_PROGRESS]: { bg: "#1A1A1A",  text: "#CCFF00", border: "#CCFF00" },
  [MESSAGE_STATUSES.RESOLVED]:    { bg: "#CCFF00",  text: "#0A0A0A", border: "#CCFF00" },
  [MESSAGE_STATUSES.REJECTED]:    { bg: "#71717A",  text: "#FFFFFF", border: "#71717A" },
  [MESSAGE_STATUSES.SPAM]:        { bg: "#FF3D00",  text: "#0A0A0A", border: "#FF3D00" },
};

function StatusPill({ status, label }: { status: string; label: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "#71717A", text: "#FFF", border: "#71717A" };
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {label}
    </span>
  );
}

/* ─── TH / TD helpers ──────────────────────────────────────────────────── */
function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[10px] font-mono font-black uppercase tracking-widest text-background whitespace-nowrap",
        className
      )}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-3 py-3 align-top text-xs font-mono text-foreground", className)}>
      {children}
    </td>
  );
}

/* ─── View / moderation modal ──────────────────────────────────────────── */
interface ViewModalProps {
  message: Message | null;
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDeleteRequest: () => void;
  translateStatus: (s: string) => string;
  getTypeLabel: (s: string) => string;
}
function ViewModal({
  message,
  open,
  onClose,
  onApprove,
  onReject,
  onDeleteRequest,
  translateStatus,
  getTypeLabel,
}: ViewModalProps) {
  const { t } = useTranslation();
  if (!open || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card border-2 border-foreground shadow-brutal overflow-y-auto max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 bg-foreground">
          <span className="text-xs font-mono font-black uppercase tracking-widest text-background">
            {t("admin.messageModeration").toUpperCase()}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-background text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-2 border-foreground p-4">
            {[
              { label: "ID", value: <code className="text-[10px] break-all">{message.id}</code> },
              { label: t("admin.companyName").toUpperCase(), value: message.companyCode },
              { label: t("messages.type").toUpperCase(), value: getTypeLabel(message.type) },
              {
                label: t("checkStatus.status").toUpperCase(),
                value: <StatusPill status={message.status} label={translateStatus(message.status)} />,
              },
              { label: "CREATED", value: fmtDate(String(message.createdAt ?? "")) },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <p className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <div className="text-xs font-mono text-foreground break-all">{value}</div>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-1">
            <p className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground">
              {t("sendMessage.message").toUpperCase()}
            </p>
            <div className="border-2 border-foreground p-4 bg-background">
              <p className="text-sm font-mono text-foreground whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          </div>

          {/* Company response */}
          {message.companyResponse && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground">
                {t("checkStatus.companyResponse").toUpperCase()}
              </p>
              <div className="border-2 border-primary p-4 bg-background">
                <p className="text-sm font-mono text-foreground whitespace-pre-wrap break-words">
                  {message.companyResponse}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t-2 border-foreground">
            <button
              onClick={onApprove}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground border-2 border-foreground font-mono font-black text-xs uppercase tracking-wide shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <FiCheckCircle className="w-4 h-4" />
              {t("admin.approve").toUpperCase()}
            </button>
            <button
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-background text-foreground border-2 border-foreground font-mono font-black text-xs uppercase tracking-wide shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <FiX className="w-4 h-4" />
              {t("admin.reject").toUpperCase()}
            </button>
            <button
              onClick={onDeleteRequest}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive text-destructive-foreground border-2 border-destructive font-mono font-black text-xs uppercase tracking-wide shadow-brutal-danger hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <FiTrash2 className="w-4 h-4" />
              {t("admin.deleteMessage").toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AdminMessages ──────────────────────────────────────────────────────── */
const AdminMessages = () => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter]     = useState<string>("all");
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isViewOpen, setIsViewOpen]     = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());

  const { data: messagesResult, isLoading, refetch } = useMessages(
    undefined,
    currentPage,
    PAGINATION.MESSAGES_PAGE_SIZE
  );
  const messages   = messagesResult?.data ?? [];
  const pagination = messagesResult?.pagination;

  useSocketMessages();

  const deleteMessageMutation = useDeleteMessage({
    onMutate: () => {
      setIsDeleteOpen(false);
      setIsViewOpen(false);
    },
    onSuccess: () => toast.success(t("admin.messageDeleted")),
    onError: (error) => {
      const status = (error as any)?.status ?? (error as any)?.response?.status;
      if (status === 404) toast.info(t("admin.messageNotFound") || "Already deleted");
      else toast.error(t("admin.deleteMessageError"));
    },
  });

  /* ── status/type helpers ── */
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
      return map[s] ?? s;
    },
    [t]
  );

  const translateStatus = useCallback(
    (s: string): string => {
      const map: Record<string, string> = {
        [MESSAGE_STATUSES.NEW]:         t("checkStatus.new"),
        [MESSAGE_STATUSES.IN_PROGRESS]: t("checkStatus.inProgress"),
        [MESSAGE_STATUSES.RESOLVED]:    t("checkStatus.resolved"),
        [MESSAGE_STATUSES.REJECTED]:    t("checkStatus.rejected"),
        [MESSAGE_STATUSES.SPAM]:        t("checkStatus.spam"),
      };
      return map[s] ?? s;
    },
    [t]
  );

  const getTypeLabel = useCallback(
    (type: string) => {
      const map: Record<string, string> = {
        complaint:  t("sendMessage.complaint"),
        praise:     t("sendMessage.praise"),
        suggestion: t("sendMessage.suggestion"),
      };
      return map[type] ?? type;
    },
    [t]
  );

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, typeFilter]);

  /* ── filtering ── */
  const filtered = messages.filter((msg) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      msg.content.toLowerCase().includes(q) ||
      msg.id.toLowerCase().includes(q) ||
      msg.companyCode.toLowerCase().includes(q);
    const normStatus  = normalizeStatus(statusFilter);
    const matchStatus = normStatus === "all" || msg.status === normStatus;
    const matchType   = typeFilter === "all" || msg.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  /* ── bulk selection ── */
  const allSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));
  const toggleAll   = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((m) => m.id)));
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ── handlers ── */
  const handleView = (msg: Message) => {
    setSelectedMessage(msg);
    setIsViewOpen(true);
  };

  const handleModerate = async (action: "approve" | "reject") => {
    if (!selectedMessage) return;
    try {
      await messageService.moderate(selectedMessage.id, action);
      toast.success(
        action === "approve" ? t("admin.messageApproved") : t("admin.messageRejected")
      );
      setIsViewOpen(false);
      refetch();
    } catch {
      toast.error(t("admin.moderationError"));
    }
  };

  const handleDeleteConfirm = () => {
    if (!selectedMessage) return;
    deleteMessageMutation.mutate({
      id: selectedMessage.id,
      companyCode: selectedMessage.companyCode,
    });
  };

  /* ── option lists ── */
  const STATUS_OPTIONS = [
    { value: "all",                         label: t("messages.allStatuses") },
    { value: t("checkStatus.new"),          label: t("checkStatus.new") },
    { value: t("checkStatus.inProgress"),   label: t("checkStatus.inProgress") },
    { value: t("checkStatus.resolved"),     label: t("checkStatus.resolved") },
    { value: t("checkStatus.rejected"),     label: t("checkStatus.rejected") },
    { value: t("checkStatus.spam"),         label: t("checkStatus.spam") },
  ];
  const TYPE_OPTIONS = [
    { value: "all",         label: t("messages.allTypes") || "ALL TYPES" },
    { value: "complaint",   label: t("sendMessage.complaint") },
    { value: "praise",      label: t("sendMessage.praise") },
    { value: "suggestion",  label: t("sendMessage.suggestion") },
  ];

  /* ── max page buttons to show ── */
  const totalPages = pagination?.totalPages ?? 1;
  const pageButtons = Array.from(
    { length: Math.min(totalPages, 7) },
    (_, i) => i + 1
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container px-4 sm:px-6 py-6 sm:py-10 space-y-6">

        {/* ── Title ── */}
        <div className="border-b-2 border-foreground pb-4">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-brutal text-foreground">
            MODERATION
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
            ALL MESSAGES — ALL COMPANIES
          </p>
        </div>

        {/* ── Filters toolbar ── */}
        <div className="border-2 border-foreground bg-card p-4 shadow-brutal">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t("admin.searchMessages")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 font-mono text-xs border-2 border-foreground bg-background"
                autoComplete="off"
              />
            </div>

            {/* Status filter */}
            <div className="w-40">
              <p className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground mb-1">
                STATUS
              </p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="font-mono text-xs border-2 border-foreground bg-background h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-foreground">
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="font-mono text-xs">
                      {o.label.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type filter */}
            <div className="w-40">
              <p className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground mb-1">
                TYPE
              </p>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="font-mono text-xs border-2 border-foreground bg-background h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-foreground">
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="font-mono text-xs">
                      {o.label.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="h-9 w-9 flex items-center justify-center border-2 border-foreground bg-background hover:bg-foreground hover:text-background transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Bulk actions banner ── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 border-2 border-primary bg-primary px-4 py-2 shadow-brutal-neon">
            <span className="text-xs font-mono font-black text-primary-foreground uppercase">
              {selectedIds.size} SELECTED
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto px-3 py-1 text-[10px] font-mono font-black uppercase bg-primary-foreground text-primary border border-primary-foreground hover:opacity-80 transition-opacity"
            >
              CLEAR
            </button>
          </div>
        )}

        {/* ── Count ── */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>
            {filtered.length} {t("messages.messages")}
            {pagination?.total != null && ` / ${pagination.total} total`}
          </span>
          {pagination && totalPages > 1 && (
            <span className="font-bold text-foreground">
              PAGE {currentPage} / {totalPages}
            </span>
          )}
        </div>

        {/* ── Table ── */}
        <div className="border-2 border-foreground shadow-brutal overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-foreground">
                <Th>
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    className="border-background data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </Th>
                <Th>ID</Th>
                <Th>COMPANY</Th>
                <Th>TYPE</Th>
                <Th>STATUS</Th>
                <Th className="hidden lg:table-cell">CONTENT</Th>
                <Th className="hidden sm:table-cell">DATE</Th>
                <Th>ACTIONS</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-3 bg-muted w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-xs font-mono uppercase tracking-widest text-muted-foreground"
                  >
                    {t("messages.noMessagesFound")}
                  </td>
                </tr>
              ) : (
                filtered.map((msg, idx) => (
                  <tr
                    key={msg.id}
                    className={cn(
                      "border-b border-border transition-colors",
                      idx % 2 === 0 ? "bg-card" : "bg-background",
                      selectedIds.has(msg.id) && "bg-primary/10",
                      "hover:bg-muted/60"
                    )}
                  >
                    {/* Checkbox */}
                    <Td>
                      <Checkbox
                        checked={selectedIds.has(msg.id)}
                        onCheckedChange={() => toggleOne(msg.id)}
                        className="border-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </Td>

                    {/* ID */}
                    <Td>
                      <code className="text-[10px] text-muted-foreground">
                        {msg.id.slice(0, 8)}…
                      </code>
                    </Td>

                    {/* Company */}
                    <Td>
                      <span className="inline-block border border-foreground px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase">
                        {msg.companyCode}
                      </span>
                    </Td>

                    {/* Type */}
                    <Td>
                      <span className="text-[10px] uppercase font-mono font-bold">
                        {getTypeLabel(msg.type)}
                      </span>
                    </Td>

                    {/* Status */}
                    <Td>
                      <StatusPill status={msg.status} label={translateStatus(msg.status)} />
                    </Td>

                    {/* Content preview */}
                    <Td className="hidden lg:table-cell max-w-[200px]">
                      <span className="text-[11px] line-clamp-1 text-muted-foreground">
                        {msg.content}
                      </span>
                    </Td>

                    {/* Date */}
                    <Td className="hidden sm:table-cell whitespace-nowrap">
                      <span className="text-[10px]">
                        {fmtDate(String(msg.createdAt ?? ""))}
                      </span>
                    </Td>

                    {/* Actions */}
                    <Td>
                      <div className="flex items-center gap-1">
                        {/* View */}
                        <button
                          onClick={() => handleView(msg)}
                          className="w-7 h-7 flex items-center justify-center border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors"
                          title="View"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                        </button>
                        {/* Quick approve */}
                        <button
                          onClick={async () => {
                            try {
                              await messageService.moderate(msg.id, "approve");
                              toast.success(t("admin.messageApproved"));
                              refetch();
                            } catch {
                              toast.error(t("admin.moderationError"));
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center border border-primary bg-primary text-primary-foreground hover:opacity-80 transition-opacity"
                          title="Approve"
                        >
                          <FiCheckCircle className="w-3.5 h-3.5" />
                        </button>
                        {/* Quick reject */}
                        <button
                          onClick={async () => {
                            try {
                              await messageService.moderate(msg.id, "reject");
                              toast.success(t("admin.messageRejected"));
                              refetch();
                            } catch {
                              toast.error(t("admin.moderationError"));
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center border border-destructive bg-destructive text-destructive-foreground hover:opacity-80 transition-opacity"
                          title="Reject"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between border-2 border-foreground bg-card px-4 py-2 shadow-brutal">
            <span className="text-xs font-mono font-bold uppercase text-muted-foreground">
              PAGE {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center border-2 border-foreground bg-background disabled:opacity-40 hover:bg-foreground hover:text-background transition-colors"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              {pageButtons.map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    "w-8 h-8 text-xs font-mono font-black border-2 transition-colors",
                    p === currentPage
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-foreground hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center border-2 border-foreground bg-background disabled:opacity-40 hover:bg-foreground hover:text-background transition-colors"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── View / moderation modal ── */}
      <ViewModal
        message={selectedMessage}
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        onApprove={() => handleModerate("approve")}
        onReject={() => handleModerate("reject")}
        onDeleteRequest={() => setIsDeleteOpen(true)}
        translateStatus={translateStatus}
        getTypeLabel={getTypeLabel}
      />

      {/* ── Delete confirmation ── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="border-2 border-destructive shadow-brutal-danger">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono font-black uppercase tracking-wide">
              {t("admin.deleteMessage").toUpperCase()}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              {t("admin.deleteMessageConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono font-black text-xs uppercase border-2 border-foreground">
              {t("common.cancel").toUpperCase()}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="font-mono font-black text-xs uppercase bg-destructive text-destructive-foreground border-2 border-destructive hover:bg-destructive/90"
            >
              {t("common.delete").toUpperCase()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMessages;
