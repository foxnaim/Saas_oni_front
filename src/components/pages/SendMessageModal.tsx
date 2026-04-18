'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { FiSend, FiCopy, FiEye, FiEyeOff, FiAlertTriangle, FiExternalLink } from "react-icons/fi";
import { toast } from "sonner";
import { useCreateMessage } from "@/lib/query";
import { companyService } from "@/lib/query";
import { MessageType } from "@/types";
import { cn } from "@/lib/utils";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const verifySchema = z.object({
  companyCode: z
    .string()
    .length(8, "Company code must be exactly 8 characters")
    .toUpperCase(),
  password: z.string().min(1, "Password is required"),
});

const messageSchema = z.object({
  content: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message cannot exceed 5000 characters"),
});

type VerifyFormValues = z.infer<typeof verifySchema>;
type MessageFormValues = z.infer<typeof messageSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyCode?: string;
  companyName?: string;
  companyPlan?: string;
  onSuccess?: () => void;
}

// ─── Message type options ─────────────────────────────────────────────────────

type MessageTypeOption = {
  value: MessageType;
  labelKey: string;
};

const MESSAGE_TYPES: MessageTypeOption[] = [
  { value: "complaint", labelKey: "sendMessage.complaint" },
  { value: "praise",    labelKey: "sendMessage.praise" },
  { value: "suggestion",labelKey: "sendMessage.suggestion" },
];

// ─── Component ────────────────────────────────────────────────────────────────

const SendMessageModal = ({
  open,
  onOpenChange,
  companyCode: prefillCode = "",
  companyName: prefillName = "",
  companyPlan,
  onSuccess,
}: SendMessageModalProps) => {
  const { t } = useTranslation();

  // Steps: "verify" | "compose" | "success"
  const [step, setStep] = useState<"verify" | "compose" | "success">("verify");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [verifiedName, setVerifiedName] = useState(prefillName);
  const [selectedType, setSelectedType] = useState<MessageType>("complaint");
  const [messageId, setMessageId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  // Verify form
  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      companyCode: prefillCode.toUpperCase(),
      password: "",
    },
  });

  // Message form
  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: "" },
  });

  const content = messageForm.watch("content");

  // Reset all state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("verify");
      setVerifiedCode("");
      setVerifiedName(prefillName);
      setSelectedType("complaint");
      setMessageId("");
      setVerifyError("");
      setIsSubmittingLocal(false);
      verifyForm.reset({ companyCode: prefillCode.toUpperCase(), password: "" });
      messageForm.reset({ content: "" });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate: createMessage, isPending: isSubmitting } = useCreateMessage({
    onSuccess: (newMessage) => {
      setMessageId(newMessage.id);
      setStep("success");
      setIsSubmittingLocal(false);
    },
    onError: (error: any) => {
      setIsSubmittingLocal(false);
      let msg = t("sendMessage.error");
      if (error?.message) {
        const m = error.message.toLowerCase();
        if (m.includes("not found") || m.includes("company")) msg = t("sendMessage.companyNotFound");
        else if (m.includes("please wait") || m.includes("seconds")) msg = t("sendMessage.tooFast") || error.message;
        else if (error?.code === "TOO_MANY_MESSAGES" || error?.code === "TOO_MANY_REQUESTS" || m.includes("tomorrow")) msg = t("sendMessage.dailyLimitExceeded");
        else if (m.includes("limit") || m.includes("exceeded")) msg = t("sendMessage.messageLimitExceeded");
        else msg = error.message;
      }
      toast.error(msg);
    },
  });

  // ── Verify handler ────────────────────────────────────────────────────────

  const handleVerify = async (values: VerifyFormValues) => {
    setVerifyError("");
    setIsVerifying(true);
    try {
      const isValid = await companyService.verifyPassword(
        values.companyCode.toUpperCase(),
        values.password
      );
      if (!isValid) {
        setVerifyError(t("sendMessage.wrongPassword") || "Incorrect password. Please try again.");
        setIsVerifying(false);
        return;
      }
      // Also fetch company name if not pre-filled
      if (!prefillName) {
        try {
          const company = await companyService.getByCode(values.companyCode.toUpperCase());
          if (company) setVerifiedName(company.name);
        } catch {
          // non-fatal
        }
      }
      setVerifiedCode(values.companyCode.toUpperCase());
      setStep("compose");
    } catch {
      setVerifyError(t("sendMessage.error") || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Submit handler ────────────────────────────────────────────────────────

  const handleSubmit = async (values: MessageFormValues) => {
    if (isSubmittingLocal || isSubmitting) return;
    setIsSubmittingLocal(true);

    // Browser fingerprint (anti-spam)
    let fingerprint = "";
    try {
      const { getFingerprint } = await import("@/lib/utils/fingerprint");
      fingerprint = await getFingerprint();
    } catch {
      // proceed without fingerprint
    }

    createMessage({
      companyCode: verifiedCode,
      type: selectedType,
      content: values.content.trim(),
      status: "New",
      ...(fingerprint ? ({ fingerprint } as any) : {}),
    });
  };

  const copyMessageId = () => {
    navigator.clipboard.writeText(messageId);
    toast.success(t("sendMessage.idCopied"));
  };

  const handleClose = () => {
    onOpenChange(false);
    if (onSuccess && step === "success") onSuccess();
  };

  // ── Shared dialog wrapper ─────────────────────────────────────────────────

  const dialogContentClass =
    "max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto border-2 border-foreground bg-background p-0 shadow-[6px_6px_0px_0px_hsl(var(--foreground))]";

  // ── STEP: SUCCESS ─────────────────────────────────────────────────────────

  if (step === "success") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className="border-b-2 border-foreground px-6 py-4">
            <DialogTitle className="font-heading text-xl font-black uppercase tracking-widest text-foreground">
              {t("sendMessage.messageSent") || "MESSAGE SENT"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-6">
            {/* ID block */}
            <div className="border-2 border-foreground bg-muted p-4 shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("sendMessage.messageId") || "YOUR MESSAGE ID"}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-lg font-black text-primary">
                  {messageId}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyMessageId}
                  className="h-10 w-10 shrink-0 border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <FiCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Save hint */}
            <div className="border-2 border-primary bg-primary/5 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-primary">
                {t("sendMessage.saveIdHint") || "Save this ID to check status later."}
              </p>
            </div>

            {/* Telegram link */}
            <a
              href="https://t.me/sayless_app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-2 border-foreground bg-background px-4 py-3 text-sm font-bold uppercase tracking-widest text-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
            >
              <FiExternalLink className="h-4 w-4" />
              {t("sendMessage.sendViaTelegram") || "OR SEND VIA TELEGRAM"}
            </a>

            <Button
              onClick={handleClose}
              className="w-full border-2 border-foreground font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all h-12"
            >
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── STEP: COMPOSE ─────────────────────────────────────────────────────────

  if (step === "compose") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className="border-b-2 border-foreground px-6 py-4">
            <DialogTitle className="font-heading text-xl font-black uppercase tracking-widest text-foreground">
              SPEAK UP
            </DialogTitle>
            {verifiedName && (
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {verifiedCode} &mdash; {verifiedName}
                {companyPlan && <span className="ml-2 text-primary">[{companyPlan}]</span>}
              </p>
            )}
          </DialogHeader>

          <Form {...messageForm}>
            <form onSubmit={messageForm.handleSubmit(handleSubmit)} className="space-y-6 p-6">

              {/* Message type selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">
                  {t("sendMessage.messageType")}
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {MESSAGE_TYPES.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedType(value)}
                      className={cn(
                        "border-2 border-foreground px-3 py-3 text-xs font-black uppercase tracking-widest transition-all",
                        selectedType === value
                          ? "bg-[#ccff00] text-black shadow-none translate-x-[2px] translate-y-[2px]"
                          : "bg-background text-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
                      )}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content textarea */}
              <FormField
                control={messageForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-widest">
                        {t("sendMessage.yourMessage")}
                      </Label>
                      <span
                        className={cn(
                          "text-xs font-mono font-bold",
                          content.length > 4500 ? "text-destructive" : "text-muted-foreground"
                        )}
                      >
                        {content.length} / 5000
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("sendMessage.enterMessage")}
                        maxLength={5000}
                        className="min-h-[160px] resize-none border-2 border-foreground font-mono text-sm shadow-[4px_4px_0px_0px_hsl(var(--foreground))] focus:shadow-none focus:translate-x-[4px] focus:translate-y-[4px] transition-all"
                      />
                    </FormControl>
                    <FormMessage className="font-bold text-destructive" />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-2 border-foreground font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all h-12"
                  onClick={() => onOpenChange(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={!content || isSubmitting || isSubmittingLocal}
                  className="flex-1 border-2 border-foreground bg-primary font-black uppercase tracking-widest text-primary-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-[4px_4px_0px_0px_hsl(var(--foreground))] disabled:translate-x-0 disabled:translate-y-0 h-12"
                >
                  <FiSend className="mr-2 h-4 w-4" />
                  {isSubmitting || isSubmittingLocal
                    ? (t("sendMessage.sending") || "SENDING...")
                    : (t("sendMessage.anonymousMessage") || "SEND")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // ── STEP: VERIFY ─────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className="border-b-2 border-foreground px-6 py-4">
          <DialogTitle className="font-heading text-xl font-black uppercase tracking-widest text-foreground">
            SPEAK UP
          </DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wide font-bold">
            {t("sendMessage.anonymousNote")}
          </p>
        </DialogHeader>

        <Form {...verifyForm}>
          <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-5 p-6">

            {/* Company code */}
            {!prefillCode && (
              <FormField
                control={verifyForm.control}
                name="companyCode"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs font-bold uppercase tracking-widest">
                      {t("sendMessage.companyCode")}
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("sendMessage.enterCode") || "XXXXXXXX"}
                        maxLength={8}
                        autoComplete="off"
                        className="border-2 border-foreground font-mono text-base uppercase tracking-widest shadow-[4px_4px_0px_0px_hsl(var(--foreground))] focus:shadow-none focus:translate-x-[4px] focus:translate-y-[4px] transition-all h-12"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage className="font-bold text-destructive" />
                  </FormItem>
                )}
              />
            )}

            {/* Pre-filled code display */}
            {prefillCode && (
              <div className="border-2 border-foreground bg-muted p-3 shadow-[3px_3px_0px_0px_hsl(var(--foreground))]">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {t("sendMessage.companyCode")}
                </p>
                <p className="font-mono text-base font-black uppercase tracking-widest text-foreground">
                  {prefillCode.toUpperCase()}
                  {prefillName && <span className="ml-3 text-primary normal-case tracking-normal">{prefillName}</span>}
                </p>
              </div>
            )}

            {/* Password */}
            <FormField
              control={verifyForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-xs font-bold uppercase tracking-widest">
                    {t("sendMessage.password") || "PASSWORD"}
                  </Label>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder={t("sendMessage.enterPassword") || "Daily or company password"}
                        autoComplete="off"
                        className="border-2 border-foreground pr-12 font-mono text-base shadow-[4px_4px_0px_0px_hsl(var(--foreground))] focus:shadow-none focus:translate-x-[4px] focus:translate-y-[4px] transition-all h-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="font-bold text-destructive" />
                </FormItem>
              )}
            />

            {/* Verify error */}
            {verifyError && (
              <div className="flex items-center gap-2 border-2 border-destructive bg-destructive/5 p-3">
                <FiAlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm font-bold text-destructive">{verifyError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-2 border-foreground font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all h-12"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isVerifying}
                className="flex-1 border-2 border-foreground bg-primary font-black uppercase tracking-widest text-primary-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 h-12"
              >
                {isVerifying
                  ? (t("sendMessage.checking") || "VERIFYING...")
                  : (t("sendMessage.validateCode") || "VERIFY")}
              </Button>
            </div>

            {/* Telegram alt */}
            <div className="border-t-2 border-foreground pt-4">
              <a
                href="https://t.me/sayless_app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border-2 border-foreground bg-background px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all w-full"
              >
                <FiExternalLink className="h-3.5 w-3.5" />
                {t("sendMessage.sendViaTelegram") || "OR SEND VIA TELEGRAM BOT"}
              </a>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageModal;
