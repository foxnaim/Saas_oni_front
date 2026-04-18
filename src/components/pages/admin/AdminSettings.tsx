'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FiEdit2,
  FiLock,
  FiEye,
  FiEyeOff,
  FiMoon,
  FiSun,
  FiMonitor,
  FiMessageSquare,
  FiSend,
  FiUser,
  FiShield,
  FiSliders,
  FiPhoneCall,
} from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useAuth, setUser } from "@/lib/redux";
import { toast } from "sonner";
import { useAdminSettings, useUpdateAdminSettings } from "@/lib/query";
import { authService } from "@/lib/api/auth";
import { useDispatch } from "react-redux";
import { validatePasswordStrength, validateSupportPhone, isValidEmail } from "@/lib/utils/validation";

type Theme = "light" | "dark" | "system";
type Lang = "ru" | "en" | "kk";
const THEMES: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: "light", icon: <FiSun className="h-4 w-4" />, label: "LIGHT" },
  { value: "dark", icon: <FiMoon className="h-4 w-4" />, label: "DARK" },
  { value: "system", icon: <FiMonitor className="h-4 w-4" />, label: "SYSTEM" },
];
const LANGS: { value: Lang; label: string; native: string }[] = [
  { value: "ru", label: "RU", native: "Русский" },
  { value: "en", label: "EN", native: "English" },
  { value: "kk", label: "KK", native: "Қазақша" },
];

const SectionHeader = ({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) => (
  <div className="flex items-start gap-3 border-b-2 border-foreground pb-4 mb-6">
    <div className="border-2 border-foreground p-2 flex-shrink-0">{icon}</div>
    <div>
      <h2 className="text-lg font-black uppercase tracking-widest text-foreground">{title}</h2>
      {description && <p className="text-xs font-mono text-muted-foreground mt-0.5 uppercase tracking-wide">{description}</p>}
    </div>
  </div>
);

const AdminSettings = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch();

  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useAdminSettings({ enabled: isAuthenticated });
  const { mutateAsync: updateSettings, isPending: isUpdating } = useUpdateAdminSettings({
    onSuccess: async () => { await refetchSettings(); toast.success(t("admin.settingsSaved")); },
    onError: (error: any) => toast.error(error.message || t("common.error")),
  });

  // ── PROFILE ──
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [showEmailPwd, setShowEmailPwd] = useState(false);

  // ── SECURITY ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // ── PREFERENCES ──
  const [theme, setTheme] = useState<Theme>("system");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // ── SUPPORT ──
  const [supportWhatsApp, setSupportWhatsApp] = useState("");
  const [telegramStatus, setTelegramStatus] = useState<"connected" | "disconnected">("disconnected");

  // Sync settings on load
  useEffect(() => {
    if (settings) {
      setSupportWhatsApp(settings.supportWhatsAppNumber || "");
      if ((settings as any).theme) setTheme((settings as any).theme);
      if ((settings as any).itemsPerPage) setItemsPerPage((settings as any).itemsPerPage);
      if ((settings as any).telegramConnected) setTelegramStatus("connected");
    }
  }, [settings]);

  // Sync language only once on mount
  useEffect(() => {
    const storedLang = typeof window !== "undefined" ? localStorage.getItem("i18nextLng") : null;
    if (storedLang && ["en", "ru", "kk"].includes(storedLang)) return;
    if (!settings?.language) return;
    const currentLang = i18nInstance.language?.split("-")[0] || "ru";
    if (settings.language !== currentLang && ["en", "ru", "kk"].includes(settings.language)) {
      i18nInstance.changeLanguage(settings.language);
      localStorage.setItem("i18nextLng", settings.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmailSave = async () => {
    const trimmed = newEmail.trim();
    if (!emailPassword) { toast.error(t("admin.passwordRequiredForEmailChange")); return; }
    if (!trimmed || trimmed === user?.email) { toast.error(t("admin.emailNotChanged")); return; }
    if (!isValidEmail(trimmed)) { toast.error(t("admin.emailChangeInvalidFormat")); return; }
    try {
      const response = await authService.changeEmail({ newEmail: trimmed, password: emailPassword });
      if (response.data.user && user) dispatch(setUser({ ...user, email: response.data.user.email }));
      toast.success(t("admin.emailChanged"));
      setIsEditingEmail(false);
      setNewEmail("");
      setEmailPassword("");
    } catch (error: any) {
      toast.error(error?.message || t("common.error"));
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error(t("common.fillAllFields")); return; }
    if (newPassword !== confirmPassword) { toast.error(t("auth.passwordMismatch")); return; }
    const v = validatePasswordStrength(newPassword);
    if (!v.isValid) { toast.error(v.errors[0]); return; }
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success(t("admin.passwordChanged"));
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error: any) {
      toast.error(error?.message || t("admin.passwordChangeError"));
    }
  };

  const handleLanguageChange = async (lang: string) => {
    const prev = settings?.language || i18nInstance.language.split("-")[0] || "ru";
    i18nInstance.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
    try {
      await updateSettings({ language: lang as Lang });
    } catch {
      i18nInstance.changeLanguage(prev);
      localStorage.setItem("i18nextLng", prev);
    }
  };

  const handleSaveSupport = async () => {
    const validation = validateSupportPhone(supportWhatsApp);
    if (!validation.valid) { toast.error(validation.error || t("admin.supportPhoneInvalid")); return; }
    try {
      await updateSettings({ supportWhatsAppNumber: supportWhatsApp.trim() });
      toast.success(t("admin.settingsSaved"));
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    }
  };

  const currentLang = (settings?.language || i18nInstance.language.split("-")[0] || "ru") as Lang;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container py-6 space-y-8 max-w-2xl">

        {/* Page title */}
        <div className="border-b-4 border-foreground pb-4">
          <h1 className="text-3xl font-black tracking-tight uppercase text-foreground">SETTINGS</h1>
          <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
            {user?.email}
          </p>
        </div>

        {/* ── PROFILE ── */}
        <Card className="rounded-none border-2 border-foreground p-6">
          <SectionHeader
            icon={<FiUser className="h-5 w-5" />}
            title="PROFILE"
            description="Manage your account email"
          />
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-mono uppercase text-xs tracking-widest">{t("auth.email")}</Label>
                {!isEditingEmail && (
                  <button onClick={() => { setIsEditingEmail(true); setNewEmail(user?.email || ""); }} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground border border-foreground/30 hover:border-foreground px-2 py-1">
                    <FiEdit2 className="h-3 w-3" /> EDIT
                  </button>
                )}
              </div>
              {isEditingEmail ? (
                <form onSubmit={(e) => { e.preventDefault(); handleEmailSave(); }} className="space-y-3">
                  <input type="text" autoComplete="username" value={user?.email || ""} readOnly tabIndex={-1} aria-hidden style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
                  <div className="space-y-1.5">
                    <Label className="font-mono uppercase text-xs tracking-widest">NEW EMAIL</Label>
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="rounded-none border-2 border-foreground font-mono" autoComplete="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono uppercase text-xs tracking-widest flex items-center gap-2"><FiLock className="h-3.5 w-3.5" /> CURRENT PASSWORD</Label>
                    <div className="relative">
                      <Input type={showEmailPwd ? "text" : "password"} value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} className="rounded-none border-2 border-foreground font-mono pr-10" autoComplete="current-password" />
                      <button type="button" onClick={() => setShowEmailPwd(!showEmailPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showEmailPwd ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-none border-2 border-foreground font-black uppercase tracking-wider" onClick={() => { setIsEditingEmail(false); setNewEmail(""); setEmailPassword(""); }}>CANCEL</Button>
                    <Button type="submit" className="flex-1 rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider" disabled={!emailPassword || !newEmail.trim() || newEmail.trim() === user?.email}>SAVE</Button>
                  </div>
                </form>
              ) : (
                <div className="border-2 border-foreground/30 bg-foreground/5 px-3 py-2 font-mono text-sm text-foreground">
                  {user?.email || "—"}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ── SECURITY ── */}
        <Card className="rounded-none border-2 border-foreground p-6">
          <SectionHeader
            icon={<FiShield className="h-5 w-5" />}
            title="SECURITY"
            description="Change your password"
          />
          <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-4">
            <input type="text" autoComplete="username" value={user?.email || ""} readOnly tabIndex={-1} aria-hidden style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
            <div className="space-y-1.5">
              <Label className="font-mono uppercase text-xs tracking-widest">CURRENT PASSWORD</Label>
              <div className="relative">
                <Input id="currentPassword" type={showCurrentPwd ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-none border-2 border-foreground font-mono pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrentPwd ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono uppercase text-xs tracking-widest">NEW PASSWORD</Label>
              <div className="relative">
                <Input id="newPassword" type={showNewPwd ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-none border-2 border-foreground font-mono pr-10" autoComplete="new-password" />
                <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPwd ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono uppercase text-xs tracking-widest">CONFIRM NEW PASSWORD</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPwd ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-none border-2 border-foreground font-mono pr-10" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPwd ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider w-full sm:w-auto">
              CHANGE PASSWORD
            </Button>
          </form>
        </Card>

        {/* ── PREFERENCES ── */}
        <Card className="rounded-none border-2 border-foreground p-6">
          <SectionHeader
            icon={<FiSliders className="h-5 w-5" />}
            title="PREFERENCES"
            description="Theme, language, display"
          />
          <div className="space-y-6">

            {/* Theme selector */}
            <div className="space-y-2">
              <Label className="font-mono uppercase text-xs tracking-widest">THEME</Label>
              <div className="flex gap-0">
                {THEMES.map((t, i) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 border-2 font-mono text-xs font-bold uppercase tracking-widest transition-colors ${i > 0 ? "-ml-[2px]" : ""} ${theme === t.value ? "border-foreground bg-foreground text-background z-10" : "border-foreground/40 text-foreground/60 hover:border-foreground hover:text-foreground"}`}
                  >
                    {t.icon}
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language selector */}
            <div className="space-y-2">
              <Label className="font-mono uppercase text-xs tracking-widest">LANGUAGE</Label>
              <div className="flex gap-0">
                {LANGS.map((l, i) => (
                  <button
                    key={l.value}
                    onClick={() => handleLanguageChange(l.value)}
                    disabled={settingsLoading || isUpdating}
                    className={`flex-1 flex flex-col items-center justify-center py-2.5 px-3 border-2 font-mono font-bold uppercase tracking-widest transition-colors ${i > 0 ? "-ml-[2px]" : ""} ${currentLang === l.value ? "border-foreground bg-foreground text-background z-10" : "border-foreground/40 text-foreground/60 hover:border-foreground hover:text-foreground disabled:opacity-40"}`}
                  >
                    <span className="text-base">{l.label}</span>
                    <span className="text-[9px] opacity-70 font-normal normal-case">{l.native}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Items per page */}
            <div className="space-y-2">
              <Label className="font-mono uppercase text-xs tracking-widest">ITEMS PER PAGE</Label>
              <div className="flex gap-0">
                {[10, 25, 50, 100].map((n, i) => (
                  <button
                    key={n}
                    onClick={() => setItemsPerPage(n)}
                    className={`flex-1 py-2.5 border-2 font-mono text-xs font-bold uppercase tracking-widest transition-colors ${i > 0 ? "-ml-[2px]" : ""} ${itemsPerPage === n ? "border-foreground bg-foreground text-background z-10" : "border-foreground/40 text-foreground/60 hover:border-foreground hover:text-foreground"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* ── SUPPORT ── */}
        <Card className="rounded-none border-2 border-foreground p-6">
          <SectionHeader
            icon={<FiPhoneCall className="h-5 w-5" />}
            title="SUPPORT"
            description="Contact and bot configuration"
          />
          <div className="space-y-6">

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label className="font-mono uppercase text-xs tracking-widest flex items-center gap-2">
                <FiMessageSquare className="h-3.5 w-3.5 text-green-400" />
                WHATSAPP SUPPORT NUMBER
              </Label>
              <div className="flex gap-0">
                <Input
                  type="tel"
                  value={supportWhatsApp}
                  onChange={(e) => setSupportWhatsApp(e.target.value)}
                  placeholder="+7 700 123 4567"
                  className="rounded-none border-2 border-r-0 border-foreground font-mono flex-1"
                />
                <Button
                  onClick={handleSaveSupport}
                  disabled={isUpdating || supportWhatsApp === settings?.supportWhatsAppNumber}
                  className="rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider px-4"
                >
                  SAVE
                </Button>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Visible to all companies. Pro plan gets priority support.
              </p>
            </div>

            {/* Telegram bot */}
            <div className="space-y-2">
              <Label className="font-mono uppercase text-xs tracking-widest flex items-center gap-2">
                <FiSend className="h-3.5 w-3.5 text-sky-400" />
                TELEGRAM BOT
              </Label>
              <div className="flex items-center justify-between border-2 border-foreground px-4 py-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-foreground font-bold">CONNECTION STATUS</p>
                  <p className={`font-mono text-[10px] uppercase tracking-widest mt-0.5 ${telegramStatus === "connected" ? "text-green-400" : "text-red-400"}`}>
                    {telegramStatus === "connected" ? "● CONNECTED" : "● DISCONNECTED"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={`rounded-none border-2 font-black uppercase tracking-wider text-xs ${telegramStatus === "connected" ? "border-red-500 text-red-500 hover:bg-red-500/10" : "border-sky-400 text-sky-400 hover:bg-sky-400/10"}`}
                  onClick={() => setTelegramStatus(telegramStatus === "connected" ? "disconnected" : "connected")}
                >
                  {telegramStatus === "connected" ? "DISCONNECT" : "CONNECT"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminSettings;
