'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  FiSearch,
  FiRefreshCw,
  FiX,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiMessageSquare,
  FiAlertCircle,
} from "react-icons/fi";
import { useMessage } from "@/lib/query";
import { cn } from "@/lib/utils";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

// Accepts FB-YYYY-XXXXXX or just bare IDs
const searchSchema = z.object({
  messageId: z
    .string()
    .min(1, "Please enter a message ID")
    .regex(
      /^(FB-\d{4}-[A-Z0-9]{6}|[a-f0-9-]{20,})$/i,
      "Invalid format. Expected: FB-YYYY-XXXXXX"
    ),
});

type SearchFormValues = z.infer<typeof searchSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CheckStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Status config ────────────────────────────────────────────────────────────

type StatusVariant = "new" | "inProgress" | "resolved" | "rejected" | "spam" | "default";

interface StatusConfig {
  variant: StatusVariant;
  bg: string;
  border: string;
  text: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function getStatusConfig(status: string): StatusConfig {
  const s = status?.toLowerCase() ?? "";
  if (s === "новое" || s === "new") {
    return { variant: "new", bg: "bg-primary/10", border: "border-primary", text: "text-primary", Icon: FiMessageSquare };
  }
  if (s === "в работе" || s === "in progress") {
    return { variant: "inProgress", bg: "bg-yellow-400/10", border: "border-yellow-500", text: "text-yellow-600 dark:text-yellow-400", Icon: FiClock };
  }
  if (s === "решено" || s === "resolved") {
    return { variant: "resolved", bg: "bg-[#ccff00]/20", border: "border-[#88cc00]", text: "text-[#557700] dark:text-[#ccff00]", Icon: FiCheckCircle };
  }
  if (s === "отклонено" || s === "rejected") {
    return { variant: "rejected", bg: "bg-destructive/10", border: "border-destructive", text: "text-destructive", Icon: FiAlertCircle };
  }
  if (s === "спам" || s === "spam") {
    return { variant: "spam", bg: "bg-destructive/10", border: "border-destructive", text: "text-destructive", Icon: FiAlertTriangle };
  }
  return { variant: "default", bg: "bg-muted", border: "border-foreground", text: "text-foreground", Icon: FiMessageSquare };
}

function getTypeLabel(type: string, t: (key: string) => string): string {
  switch (type) {
    case "complaint":  return t("sendMessage.complaint");
    case "praise":     return t("sendMessage.praise");
    case "suggestion": return t("sendMessage.suggestion");
    default:           return type;
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const config = getStatusConfig(status);
  const { Icon } = config;

  // Map raw status to i18n key
  const statusKey = (() => {
    const s = status?.toLowerCase() ?? "";
    if (s === "новое" || s === "new") return "checkStatus.new";
    if (s === "в работе" || s === "in progress") return "checkStatus.inProgress";
    if (s === "решено" || s === "resolved") return "checkStatus.resolved";
    if (s === "отклонено" || s === "rejected") return "checkStatus.rejected";
    if (s === "спам" || s === "spam") return "checkStatus.spam";
    return null;
  })();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border-2 px-3 py-1 text-xs font-black uppercase tracking-widest",
        config.bg,
        config.border,
        config.text
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {statusKey ? t(statusKey) : status}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const CheckStatusModal = ({ open, onOpenChange }: CheckStatusModalProps) => {
  const { t } = useTranslation();
  const [searchId, setSearchId] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { messageId: "" },
  });

  const { data: message, isLoading, refetch } = useMessage(searchId, {
    enabled: !!searchId,
  });

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchId("");
      setHasSearched(false);
      form.reset({ messageId: "" });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (values: SearchFormValues) => {
    const id = values.messageId.trim().toUpperCase();
    if (id === searchId) {
      // Same ID — just refetch
      refetch();
    } else {
      setSearchId(id);
    }
    setHasSearched(true);
  };

  const handleReset = () => {
    setSearchId("");
    setHasSearched(false);
    form.reset({ messageId: "" });
  };

  const dialogContentClass =
    "max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto border-2 border-foreground bg-background p-0 shadow-[6px_6px_0px_0px_hsl(var(--foreground))]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className="border-b-2 border-foreground px-6 py-4">
          <DialogTitle className="font-heading text-xl font-black uppercase tracking-widest text-foreground">
            {t("checkStatus.title") || "CHECK STATUS"}
          </DialogTitle>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("checkStatus.description")}
          </p>
        </DialogHeader>

        <div className="space-y-6 p-6">

          {/* Search form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
              <FormField
                control={form.control}
                name="messageId"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs font-bold uppercase tracking-widest">
                      {t("checkStatus.messageId")}
                    </Label>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          {...field}
                          placeholder={t("checkStatus.messageIdPlaceholder") || "FB-2024-A7K9X2"}
                          autoComplete="off"
                          spellCheck={false}
                          className="flex-1 border-2 border-foreground font-mono text-base uppercase tracking-widest shadow-[4px_4px_0px_0px_hsl(var(--foreground))] focus:shadow-none focus:translate-x-[4px] focus:translate-y-[4px] transition-all h-12"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="shrink-0 border-2 border-foreground bg-primary font-black uppercase tracking-widest text-primary-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 h-12 px-5"
                        >
                          <FiSearch className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">{t("checkStatus.search")}</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="font-bold text-destructive" />
                  </FormItem>
                )}
              />
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                {t("checkStatus.enterIdDescription")}
              </p>
            </form>
          </Form>

          {/* Loading */}
          {isLoading && searchId && (
            <div className="border-2 border-foreground bg-muted p-6 text-center shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
              <p className="font-black uppercase tracking-widest text-foreground animate-pulse">
                {t("common.loading")}
              </p>
            </div>
          )}

          {/* Not found */}
          {!isLoading && hasSearched && searchId && !message && (
            <div className="flex items-start gap-3 border-2 border-destructive bg-destructive/5 p-4 shadow-[4px_4px_0px_0px_hsl(var(--destructive))]">
              <FiAlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
              <div>
                <p className="font-black uppercase tracking-widest text-destructive text-sm">
                  {t("checkStatus.notFound")}
                </p>
                <p className="mt-1 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {searchId}
                </p>
              </div>
            </div>
          )}

          {/* Result */}
          {!isLoading && message && (
            <div className="space-y-4 border-t-2 border-foreground pt-4">

              {/* Header row: ID + status badge */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <code className="block break-all font-mono text-base font-black text-primary">
                    {message.id}
                  </code>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Type badge */}
                    <span className="inline-flex border-2 border-foreground px-2 py-0.5 text-xs font-black uppercase tracking-widest">
                      {getTypeLabel(message.type, t)}
                    </span>
                    {/* Date */}
                    {message.createdAt && (
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {t("checkStatus.sentOn")}{" "}
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <StatusBadge status={message.status} t={t} />
              </div>

              {/* Message content */}
              {message.content && (
                <div className="border-2 border-foreground bg-muted p-4 shadow-[3px_3px_0px_0px_hsl(var(--foreground))]">
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {t("sendMessage.message")}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                    {message.content}
                  </p>
                </div>
              )}

              {/* Company response */}
              {message.companyResponse && (
                <div className="border-2 border-[#ccff00] bg-[#ccff00]/10 p-4 shadow-[3px_3px_0px_0px_hsl(84_100%_50%/0.5)]">
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-foreground">
                    {t("checkStatus.companyResponse")}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                    {message.companyResponse}
                  </p>
                  {message.lastUpdate && (
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {t("checkStatus.lastUpdate")}{" "}
                      {new Date(message.lastUpdate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-foreground font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all h-11"
                  onClick={handleReset}
                >
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  {t("checkStatus.checkAnother")}
                </Button>
                <Button
                  className="flex-1 border-2 border-foreground font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all h-11"
                  onClick={() => onOpenChange(false)}
                >
                  <FiX className="mr-2 h-4 w-4" />
                  {t("common.close")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckStatusModal;
