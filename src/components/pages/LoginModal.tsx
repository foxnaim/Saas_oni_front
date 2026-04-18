'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/redux";
import { FiEye, FiEyeOff, FiLoader } from "react-icons/fi";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { toast } from "sonner";
import { useSupportInfo } from "@/lib/query";
import { cn } from "@/lib/utils/cn";

// ─── Zod schema ────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().min(1, "auth.emailRequired").email("auth.invalidEmail"),
  password: z.string().min(1, "auth.passwordRequired"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Props ─────────────────────────────────────────────────────────────────────
interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Neon spinner ──────────────────────────────────────────────────────────────
function NeonSpinner({ className }: { className?: string }) {
  return (
    <FiLoader
      className={cn(
        "animate-spin text-primary",
        className,
      )}
    />
  );
}

// ─── OR Divider ────────────────────────────────────────────────────────────────
function BrutalDivider({ label }: { label: string }) {
  return (
    <div className="relative my-5 flex items-center gap-3">
      <span className="h-[2px] flex-1 bg-foreground/20" />
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="h-[2px] flex-1 bg-foreground/20" />
    </div>
  );
}

// ─── Google OAuth SVG ─────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ─── Telegram icon ────────────────────────────────────────────────────────────
function TelegramIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.448 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.367l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.963.192z" />
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const { data: supportInfo } = useSupportInfo();

  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "telegram" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const result = await login(values.email, values.password);
      if (result.success && result.user) {
        const role = result.user.role?.toLowerCase();
        onOpenChange(false);
        reset();
        if (role === "admin" || role === "super_admin") {
          router.replace("/admin");
        } else if (role === "company") {
          router.replace("/company");
        } else {
          router.replace("/");
        }
      }
    } catch (error: any) {
      const backendMessage = String(error?.message || "").trim();
      const errorStatus = error?.status || 0;
      const msgLower = backendMessage.toLowerCase();

      let errorMessage = "";

      if (backendMessage.includes("Email and password are required") || msgLower.includes("required")) {
        errorMessage = t("auth.emailAndPasswordRequired");
      } else if (
        backendMessage.includes("COMPANY_BLOCKED") ||
        backendMessage.includes("company blocked") ||
        (errorStatus === 403 && msgLower.includes("blocked"))
      ) {
        const num = backendMessage.includes("|")
          ? backendMessage.split("|")[1]?.trim()
          : supportInfo?.supportWhatsAppNumber;
        errorMessage = num
          ? t("auth.companyBlockedWhatsAppWithNumber", { number: num })
          : t("auth.companyBlockedWhatsApp");
      } else if (
        backendMessage.includes("Invalid email or password") ||
        backendMessage.includes("invalid") ||
        backendMessage.includes("incorrect") ||
        errorStatus === 401
      ) {
        errorMessage = t("auth.loginError");
      } else if (backendMessage && !backendMessage.includes("HTTP error")) {
        errorMessage = backendMessage;
      } else {
        errorMessage = t("auth.loginError");
      }

      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setOauthLoading("google");
    try {
      await signIn("google", { callbackUrl: "/", redirect: true });
    } catch {
      setOauthLoading(null);
    }
  };

  const isLoading = isSubmitting;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent maxWidth="sm:max-w-md" className="px-4 py-6 sm:px-8 sm:py-8">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black uppercase tracking-tight [font-family:var(--font-space-grotesk,'Space_Grotesk',sans-serif)]">
              {t("auth.login", { defaultValue: "LOG IN" })}
            </DialogTitle>
            <DialogDescription className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {t("auth.loginSubtitle", { defaultValue: "Enter your credentials to continue" })}
            </DialogDescription>
          </DialogHeader>

          {/* ── Error banner ────────────────────────────────────────────────── */}
          {formError && (
            <div className="mb-4 border-2 border-[#FF3D00] bg-[#FF3D00]/10 px-4 py-3">
              <p className="font-mono text-xs font-bold text-[#FF3D00] uppercase tracking-wide">
                {formError}
              </p>
            </div>
          )}

          {/* ── Email / Password form ────────────────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <Label
                htmlFor="login-email"
                className="font-mono text-xs font-bold uppercase tracking-widest"
              >
                {t("auth.email", { defaultValue: "Email" })}
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="username"
                disabled={isLoading}
                className={cn(
                  "border-2 border-foreground/30 focus:border-primary",
                  errors.email && "border-[#FF3D00] focus:border-[#FF3D00]",
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="font-mono text-[11px] text-[#FF3D00]">
                  {t(errors.email.message as string, { defaultValue: errors.email.message })}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label
                htmlFor="login-password"
                className="font-mono text-xs font-bold uppercase tracking-widest"
              >
                {t("auth.password", { defaultValue: "Password" })}
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={cn(
                    "border-2 border-foreground/30 pr-12 focus:border-primary",
                    errors.password && "border-[#FF3D00] focus:border-[#FF3D00]",
                  )}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center border-l-2 border-foreground/20 text-muted-foreground transition-colors hover:bg-primary hover:text-black"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="font-mono text-[11px] text-[#FF3D00]">
                  {t(errors.password.message as string, { defaultValue: errors.password.message })}
                </p>
              )}
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  setIsForgotOpen(true);
                }}
                className="font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {t("auth.forgotPassword", { defaultValue: "Forgot password?" })}
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full border-2 border-foreground bg-primary text-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none font-black uppercase tracking-wide"
            >
              {isLoading ? (
                <>
                  <NeonSpinner className="mr-2 h-4 w-4" />
                  {t("common.loading", { defaultValue: "Loading..." })}
                </>
              ) : (
                t("auth.login", { defaultValue: "LOG IN" })
              )}
            </Button>
          </form>

          {/* ── OR divider ───────────────────────────────────────────────────── */}
          <BrutalDivider label={t("auth.or", { defaultValue: "OR" })} />

          {/* ── OAuth buttons ─────────────────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Google */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={oauthLoading !== null || isLoading}
              className="w-full border-2 border-foreground font-bold uppercase tracking-wide"
            >
              {oauthLoading === "google" ? (
                <NeonSpinner className="mr-2 h-4 w-4" />
              ) : (
                <GoogleIcon />
              )}
              <span className="ml-2">
                {t("auth.loginWithGoogle", { defaultValue: "Continue with Google" })}
              </span>
            </Button>

            {/* Telegram */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={oauthLoading !== null || isLoading}
              onClick={() => {
                setOauthLoading("telegram");
                // Telegram Login Widget — triggers via custom event / redirect
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("sayless:telegram-login"));
                }
              }}
              className="w-full border-2 border-foreground font-bold uppercase tracking-wide"
            >
              {oauthLoading === "telegram" ? (
                <NeonSpinner className="mr-2 h-4 w-4" />
              ) : (
                <TelegramIcon />
              )}
              <span className="ml-2">
                {t("auth.loginWithTelegram", { defaultValue: "Continue with Telegram" })}
              </span>
            </Button>
          </div>

          {/* ── Register link ─────────────────────────────────────────────────── */}
          <p className="mt-6 text-center font-mono text-xs text-muted-foreground">
            {t("auth.noAccount", { defaultValue: "No account?" })}{" "}
            <Link
              href="/register"
              onClick={() => onOpenChange(false)}
              className="font-bold uppercase tracking-wide text-foreground underline underline-offset-4 hover:text-primary"
            >
              {t("auth.register", { defaultValue: "Register" })}
            </Link>
          </p>
        </DialogContent>
      </Dialog>

      <ForgotPasswordModal open={isForgotOpen} onOpenChange={setIsForgotOpen} />
    </>
  );
};

export default LoginModal;
