'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { FiUpload, FiX, FiCopy, FiCheck, FiSend } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import {
  useCompany,
  useUpdateCompany,
  useUpdateCompanyPassword,
  useDeleteCompany,
} from "@/lib/query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/lib/api/auth";
import { validatePasswordStrength } from "@/lib/utils/validation";
import { compressImage, validateFileSize, validateImageType } from "@/lib/utils/imageCompression";
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";
import { cn } from "@/lib/utils/cn";

/* ─── Zod schemas ─────────────────────────────────────────────────────────── */

const profileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  adminEmail: z.string().email("Invalid email address"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const passwordSchemaNoCurrentPassword = z
  .object({
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  telegramNotifications: z.boolean(),
  whatsappSupport: z.string().optional(),
});

const deleteSchema = z.object({
  confirmName: z.string().min(1, "Type the company name to confirm"),
  deletePassword: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type NotificationsForm = z.infer<typeof notificationsSchema>;
type DeleteForm = z.infer<typeof deleteSchema>;

/* ─── Sub-component: SectionCard ─────────────────────────────────────────── */

interface SectionCardProps {
  title: string;
  danger?: boolean;
  children: React.ReactNode;
  className?: string;
}

const SectionCard = ({ title, danger, children, className }: SectionCardProps) => (
  <Card
    className={cn(
      "border-2 border-foreground bg-card shadow-[4px_4px_0_0_hsl(var(--foreground)/0.15)]",
      danger && "border-accent shadow-[4px_4px_0_0_hsl(var(--accent)/0.4)]",
      className,
    )}
  >
    <CardHeader className="pb-4 border-b-2 border-foreground/10">
      <CardTitle
        className={cn(
          "text-sm font-bold uppercase tracking-widest",
          danger && "text-accent",
        )}
      >
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6">{children}</CardContent>
  </Card>
);

/* ─── Main component ──────────────────────────────────────────────────────── */

const CompanySettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const { isFullscreen } = useFullscreenContext();

  /* logo state */
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* copy state */
  const [codeCopied, setCodeCopied] = useState(false);

  /* delete dialog */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  /* telegram mock state */
  const [telegramConnected, setTelegramConnected] = useState(false);

  /* queries */
  const { data: company, refetch: refetchCompany } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  /* mutations */
  const { mutateAsync: updateCompany, isPending: isSavingProfile } = useUpdateCompany({
    onError: (error: any) => {
      const msg = (error.response?.data?.message || error?.message || "").toLowerCase();
      if (msg.includes("insufficient permissions") || msg.includes("access denied") || msg.includes("forbidden")) {
        toast.error(t("auth.accessDenied"));
      } else {
        toast.error(error.response?.data?.message || t("common.error"));
      }
    },
  });

  const { mutateAsync: updateCompanyPassword, isPending: isUpdatingPassword } = useUpdateCompanyPassword({
    onError: (error: any) => {
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("insufficient permissions") || msg.includes("access denied") || msg.includes("forbidden")) {
        toast.error(t("auth.accessDenied"));
      } else {
        toast.error(error?.message || t("common.error"));
      }
    },
  });

  const { mutateAsync: deleteCompany, isPending: isDeleting } = useDeleteCompany({
    onSuccess: () => {
      setIsDeleteOpen(false);
      toast.success(t("company.deleteCompany"));
      router.push("/");
    },
    onError: (error: any) => {
      const backendMessage = error?.message || error?.response?.data?.message || "";
      const errorStatus = error?.status || error?.response?.status;
      const msgLower = backendMessage.toLowerCase();

      if (errorStatus === 404 || backendMessage.includes("not found")) {
        toast.success(t("company.deleteCompany"));
        router.push("/");
        return;
      }

      if (msgLower.includes("access denied") || msgLower.includes("forbidden") || msgLower.includes("insufficient permissions") || errorStatus === 403) {
        toast.error(t("auth.accessDenied"));
      } else if (msgLower.includes("invalid password") || errorStatus === 401) {
        toast.error(t("auth.invalidPassword") || t("auth.loginError"));
      } else {
        toast.error(backendMessage || t("common.error"));
      }
    },
  });

  /* ── forms ── */
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { companyName: "", adminEmail: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(
      user?.role === "super_admin"
        ? passwordSchemaNoCurrentPassword
        : passwordSchema,
    ),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const notificationsForm = useForm<NotificationsForm>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: true,
      telegramNotifications: false,
      whatsappSupport: "",
    },
  });

  const deleteForm = useForm<DeleteForm>({
    resolver: zodResolver(
      deleteSchema.superRefine((data, ctx) => {
        if (company?.name && data.confirmName !== company.name) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Type "${company.name}" to confirm`,
            path: ["confirmName"],
          });
        }
      }),
    ),
    defaultValues: { confirmName: "", deletePassword: "" },
  });

  /* sync company data into forms */
  useEffect(() => {
    if (company) {
      setLogoPreview(company.logoUrl || null);
      profileForm.reset({
        companyName: company.name || "",
        adminEmail: company.adminEmail || user?.email || "",
      });
    }
  }, [company]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── logo handlers ── */
  const processLogoFile = useCallback(async (file: File) => {
    if (!validateFileSize(file, 5)) { toast.error(t("company.fileTooLarge")); return; }
    if (!validateImageType(file)) { toast.error(t("company.invalidFileType")); return; }
    try {
      setIsCompressing(true);
      const compressed: string = await compressImage(file);
      setLogoPreview(compressed);
    } catch {
      toast.error(t("company.imageProcessingError"));
    } finally {
      setIsCompressing(false);
    }
  }, [t]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── copy code ── */
  const handleCopyCode = () => {
    if (!company?.code) return;
    navigator.clipboard.writeText(company.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  /* ── submit handlers ── */
  const onProfileSubmit = async (data: ProfileForm) => {
    if (!user?.companyId) return;
    const updates: Record<string, any> = {};

    if (data.companyName !== company?.name) updates.name = data.companyName;

    const hasBase64Logo = typeof logoPreview === "string" && logoPreview.startsWith("data:image/");
    const removedLogo = logoPreview === null && company?.logoUrl;
    if (hasBase64Logo) updates.logoUrl = logoPreview;
    else if (removedLogo) updates.logoUrl = "";

    if (Object.keys(updates).length === 0 && data.adminEmail === company?.adminEmail) {
      toast.info("No changes to save");
      return;
    }

    if (data.adminEmail !== company?.adminEmail) {
      /* email change requires password — handled separately via inline flow */
      toast.info(t("company.emailChanged") || "Use the email edit flow to change email");
      return;
    }

    try {
      await updateCompany({ id: user.companyId, updates });
      toast.success(t("company.settingsSaved"));
      refetchCompany();
    } catch {
      /* errors handled in mutation */
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    const passwordCheck = validatePasswordStrength(data.newPassword);
    if (!passwordCheck.isValid) {
      toast.error(passwordCheck.errors[0] || t("auth.passwordRequirements"));
      return;
    }
    try {
      if (user?.role === "super_admin" && user?.companyId) {
        await updateCompanyPassword({ id: user.companyId, password: data.newPassword });
      } else {
        await authService.changePassword({
          currentPassword: data.currentPassword ?? "",
          newPassword: data.newPassword,
        });
        toast.success(t("auth.passwordUpdated"));
      }
      passwordForm.reset();
    } catch (error: any) {
      const msg = (error.response?.data?.message || error?.message || "").toLowerCase();
      toast.error(
        msg.includes("access denied") || msg.includes("forbidden")
          ? t("auth.accessDenied")
          : error.response?.data?.message || error?.message || t("common.error"),
      );
    }
  };

  const onDeleteSubmit = async (data: DeleteForm) => {
    if (!user?.companyId) return;
    if (user.role === "company" && !data.deletePassword) {
      toast.error(t("company.passwordRequired") || "Password required");
      return;
    }
    await deleteCompany({
      id: user.companyId,
      password: user.role === "company" ? data.deletePassword : undefined,
    });
  };

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className={cn(
        "min-h-screen bg-background overflow-x-hidden",
        isFullscreen && "h-auto overflow-y-auto",
      )}
    >
      <CompanyHeader />

      <main
        className={cn(
          "container max-w-2xl py-10 space-y-8",
          isFullscreen && "h-auto overflow-visible",
        )}
      >
        {/* ── 1. Company Profile ─────────────────────────────────────────── */}
        <SectionCard title={t("company.companyInfo")}>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">

              {/* Logo drop zone */}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider font-bold">
                  {t("company.companyLogo")}
                </Label>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !logoPreview && fileInputRef.current?.click()}
                  className={cn(
                    "relative border-2 border-dashed transition-colors",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-foreground/30 hover:border-foreground/60",
                    !logoPreview && "cursor-pointer",
                    "flex items-center gap-5 p-4",
                  )}
                >
                  {logoPreview ? (
                    <>
                      <div className="relative w-20 h-20 border-2 border-foreground flex-shrink-0 overflow-hidden">
                        <Image
                          src={logoPreview}
                          alt={t("company.companyLogo")}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                          className="absolute top-0 right-0 w-6 h-6 bg-accent text-white flex items-center justify-center hover:bg-accent/80 transition-colors"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{t("company.companyLogo")}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isCompressing}
                        >
                          {isCompressing ? t("company.processing") : t("company.changeLogo")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-2 py-4 select-none">
                      <FiUpload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm font-bold uppercase tracking-wide">
                        {isCompressing ? t("company.processing") : t("company.uploadLogo")}
                      </span>
                      <span className="text-xs text-muted-foreground text-center">
                        {t("company.logoRequirementsHint")}
                      </span>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleLogoChange}
                />
              </div>

              {/* Company Name */}
              <FormField
                control={profileForm.control}
                name="companyName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-bold">
                      {t("company.companyName")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("company.companyNamePlaceholder")}
                        className={cn(fieldState.error && "border-accent")}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-accent" />
                  </FormItem>
                )}
              />

              {/* Company Code — read-only */}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider font-bold">
                  {t("company.companyCodeLabel")}
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center h-10 border-2 border-foreground/20 bg-muted px-3 font-mono text-sm tracking-widest select-all">
                    {company?.code ?? "—"}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    disabled={!company?.code}
                    aria-label={t("common.copy")}
                  >
                    {codeCopied ? <FiCheck className="w-4 h-4 text-primary" /> : <FiCopy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("company.codeForEmployees")}
                </p>
              </div>

              {/* Admin Email */}
              <FormField
                control={profileForm.control}
                name="adminEmail"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-bold">
                      {t("company.adminEmail")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="admin@company.com"
                        className={cn(fieldState.error && "border-accent")}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-accent" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? t("common.loading") : t("company.saveChanges")}
                </Button>
              </div>
            </form>
          </Form>
        </SectionCard>

        {/* ── 2. Security ────────────────────────────────────────────────── */}
        <SectionCard title={t("company.changePassword")}>
          {user?.role === "super_admin" && (
            <div className="mb-5 px-3 py-2 border-l-4 border-accent bg-accent/5">
              <p className="text-xs text-foreground/80">
                {t("admin.superAdminPasswordWarning") ||
                  "Warning: you are changing the company password without confirming the old one."}
              </p>
            </div>
          )}

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
              <input
                type="email"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="username"
                defaultValue={company?.adminEmail || user?.email || ""}
              />

              {user?.role !== "super_admin" && (
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider font-bold">
                        {t("company.currentPassword")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="current-password"
                          className={cn(fieldState.error && "border-accent")}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-accent" />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-bold">
                      {t("company.newPassword")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        className={cn(fieldState.error && "border-accent")}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-accent" />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-bold">
                      {t("company.confirmNewPassword")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        className={cn(fieldState.error && "border-accent")}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-accent" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? t("common.loading") : t("company.updatePassword")}
                </Button>
              </div>
            </form>
          </Form>

          {/* ── Telegram 2FA ── */}
          <div className="mt-6 pt-6 border-t-2 border-foreground/10 space-y-4">
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Two-Factor / Notifications
            </p>

            <div className="flex items-center justify-between gap-4 p-3 border-2 border-foreground/20">
              <div className="space-y-0.5">
                <p className="text-sm font-bold">
                  Telegram
                </p>
                <p className="text-xs text-muted-foreground">
                  {telegramConnected
                    ? "Connected — notifications will be sent to your Telegram"
                    : "Not connected — link your Telegram account for alerts"}
                </p>
                {!telegramConnected && (
                  <a
                    href="https://t.me/your_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1 text-xs font-bold underline underline-offset-2 hover:text-primary transition-colors"
                  >
                    <FiSend className="w-3 h-3" />
                    Connect via @your_bot
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={cn(
                    "inline-block w-2 h-2 rounded-none",
                    telegramConnected ? "bg-green-500" : "bg-muted-foreground",
                  )}
                />
                <span className="text-xs font-bold uppercase">
                  {telegramConnected ? "Connected" : "Not connected"}
                </span>
                <Button
                  type="button"
                  variant={telegramConnected ? "outline" : "default"}
                  size="sm"
                  onClick={() => setTelegramConnected((v) => !v)}
                >
                  {telegramConnected ? "Disconnect" : "Connect Telegram"}
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 3. Notifications ───────────────────────────────────────────── */}
        <SectionCard title={t("company.notifications")}>
          <Form {...notificationsForm}>
            <form className="space-y-5">

              {/* Email toggle */}
              <FormField
                control={notificationsForm.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 p-3 border-2 border-foreground/20">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold cursor-pointer">
                        {t("company.emailNotifications")}
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {t("company.emailNotificationsDescription")}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Telegram toggle */}
              <FormField
                control={notificationsForm.control}
                name="telegramNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 p-3 border-2 border-foreground/20">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold cursor-pointer">
                        Telegram Notifications
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Receive new-message alerts in Telegram
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!telegramConnected}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* WhatsApp support number */}
              <FormField
                control={notificationsForm.control}
                name="whatsappSupport"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-bold">
                      WhatsApp Support Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+7 700 000 0000"
                        className={cn(fieldState.error && "border-accent")}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Displayed to users as a support contact
                    </p>
                    <FormMessage className="text-xs text-accent" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    notificationsForm.handleSubmit(() => {
                      toast.success(t("company.settingsSaved"));
                    })();
                  }}
                >
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </Form>
        </SectionCard>

        {/* ── 4. Danger Zone ─────────────────────────────────────────────── */}
        <SectionCard title={t("company.dangerZone")} danger>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold">{t("company.deleteCompany")}</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {t("company.deleteCompanyWarning")}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => { deleteForm.reset(); setIsDeleteOpen(true); }}
              disabled={isDeleting}
              className="flex-shrink-0"
            >
              {t("common.delete")}
            </Button>
          </div>
        </SectionCard>
      </main>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) deleteForm.reset();
        }}
      >
        <DialogContent maxWidth="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-accent">
              {t("company.deleteCompany")}
            </DialogTitle>
            <DialogDescription>
              {t("company.deleteCompanyWarning")}
              {company?.name && (
                <span className="block mt-2 font-bold text-foreground">
                  &ldquo;{company.name}&rdquo;
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...deleteForm}>
            <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4 pt-2">

              {/* Type company name to confirm */}
              <FormField
                control={deleteForm.control}
                name="confirmName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-bold">
                      Type <span className="font-mono">{company?.name}</span> to confirm
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={company?.name}
                        className={cn("border-2", fieldState.error && "border-accent")}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-accent" />
                  </FormItem>
                )}
              />

              {/* Password for company role */}
              {user?.role === "company" && (
                <FormField
                  control={deleteForm.control}
                  name="deletePassword"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider font-bold">
                        {t("company.currentPassword")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder={t("company.enterPasswordToDelete")}
                          autoComplete="current-password"
                          className={cn("border-2", fieldState.error && "border-accent")}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-accent" />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsDeleteOpen(false); deleteForm.reset(); }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={
                    isDeleting ||
                    !deleteForm.watch("confirmName") ||
                    deleteForm.watch("confirmName") !== company?.name ||
                    (user?.role === "company" && !deleteForm.watch("deletePassword"))
                  }
                >
                  {isDeleting ? t("common.loading") : t("company.deleteCompany")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanySettings;
