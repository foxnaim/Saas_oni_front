'use client';

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch } from "@/lib/redux";
import { registerAsync } from "@/lib/redux/slices/authSlice";
import { toast } from "sonner";
import {
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiArrowLeft,
  FiArrowRight,
  FiUser,
  FiMail,
  FiLock,
  FiCopy,
} from "react-icons/fi";
import { signIn } from "next-auth/react";

// ─── Zod schemas ────────────────────────────────────────────────────────────

const step1Schema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "uppercase")
      .regex(/[0-9]/, "digit")
      .regex(/[^A-Za-z0-9]/, "special"),
    confirmPassword: z.string(),
    name: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "mismatch",
  });

const step2Schema = z.object({
  companyName: z.string().min(2),
  companyCode: z.string().length(8),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

// ─── Helpers ────────────────────────────────────────────────────────────────

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const genCode = () =>
  Array.from({ length: 8 }, () =>
    CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  ).join("");

const getStrength = (pw: string): 0 | 1 | 2 | 3 | 4 => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
};

const STRENGTH_COLORS = ["#1a1a1a", "#ff4444", "#ff9900", "#ccff00", "#ccff00"];
const STRENGTH_LABELS = [
  "",
  "passwordStrengthWeak",
  "passwordStrengthMedium",
  "passwordStrengthStrong",
  "passwordStrengthStrong",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StrengthBars({ password }: { password: string }) {
  const { t } = useTranslation();
  const strength = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-1 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1"
            style={{
              background: i <= strength ? "#ccff00" : "#333",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
      {strength > 0 && (
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: STRENGTH_COLORS[strength] }}
        >
          {t(`auth.${STRENGTH_LABELS[strength]}`)}
        </p>
      )}
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            background: i === current ? "#ccff00" : "#333",
            border: "2px solid",
            borderColor: i === current ? "#ccff00" : "#555",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: "company" | "user";
}

const RegisterModal = ({
  open,
  onOpenChange,
  role = "company",
}: RegisterModalProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const totalSteps = role === "company" ? 2 : 1;
  const [step, setStep] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // step1
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);

  // step2
  const [companyCode, setCompanyCode] = useState(genCode);

  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: "", password: "", confirmPassword: "", name: "" },
    mode: "onChange",
  });

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { companyName: "", companyCode: companyCode },
    mode: "onChange",
  });

  const watchedPw = step1Form.watch("password");

  // Sync code into form whenever it changes
  useEffect(() => {
    step2Form.setValue("companyCode", companyCode);
  }, [companyCode, step2Form]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(0);
      setStep1Data(null);
      setShowPw(false);
      setShowConfirm(false);
      setCompanyCode(genCode());
      step1Form.reset();
      step2Form.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStep1 = step1Form.handleSubmit((data) => {
    setStep1Data(data);
    if (role === "company") {
      setStep(1);
    } else {
      submitRegister(data, null);
    }
  });

  const handleStep2 = step2Form.handleSubmit((data) => {
    if (!step1Data) return;
    submitRegister(step1Data, data);
  });

  const submitRegister = useCallback(
    async (s1: Step1Values, s2: Step2Values | null) => {
      setIsPending(true);
      try {
        const result = await dispatch(
          registerAsync({
            email: s1.email,
            password: s1.password,
            name: s1.name || undefined,
            role,
            companyName: s2?.companyName,
            companyCode: s2?.companyCode,
          })
        );

        if (registerAsync.fulfilled.match(result)) {
          toast.success(t("auth.registerSuccess"));
          requestAnimationFrame(() => {
            router.replace(role === "company" ? "/company" : "/");
            onOpenChange(false);
          });
        } else {
          const msg = result.payload as string;
          toast.error(mapError(msg, t));
        }
      } catch {
        toast.error(t("common.error"));
      } finally {
        setIsPending(false);
      }
    },
    [dispatch, onOpenChange, role, router, t]
  );

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/", redirect: true });
    } catch {
      setIsGoogleLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(companyCode);
    toast.success(t("common.copied") || "Copied!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        maxWidth="sm:max-w-[480px]"
        className="p-0 overflow-hidden"
        style={{
          border: "3px solid #ccff00",
          borderRadius: 0,
          background: "#0a0a0a",
          color: "#f0f0f0",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            background: "#ccff00",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#000",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FiArrowLeft size={18} />
            </button>
          )}
          <DialogHeader className="flex-1 p-0">
            <DialogTitle
              className="text-black font-black uppercase tracking-widest"
              style={{ fontSize: 20, letterSpacing: "0.15em" }}
            >
              JOIN SAYLESS
            </DialogTitle>
            <DialogDescription className="text-black/70 text-xs font-bold uppercase tracking-wider">
              {step === 0
                ? t("auth.fillRegistrationForm")
                : t("auth.companyName")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 py-6 sm:px-7 sm:pb-7">
          <StepDots current={step} total={totalSteps} />

          {/* ── STEP 1: Account info ── */}
          {step === 0 && (
            <form onSubmit={handleStep1} className="space-y-4">
              {/* Email */}
              <div>
                <Label
                  htmlFor="reg-email"
                  className="uppercase text-xs font-black tracking-widest text-[#999]"
                >
                  {t("auth.email")}
                </Label>
                <div className="relative mt-1">
                  <FiMail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                    size={14}
                  />
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@company.com"
                    {...step1Form.register("email")}
                    style={inputStyle}
                    className="pl-9"
                  />
                </div>
                {step1Form.formState.errors.email && (
                  <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                    {t("auth.invalidEmail")}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label
                  htmlFor="reg-pw"
                  className="uppercase text-xs font-black tracking-widest text-[#999]"
                >
                  {t("auth.password")}
                </Label>
                <div className="relative mt-1">
                  <FiLock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                    size={14}
                  />
                  <Input
                    id="reg-pw"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...step1Form.register("password")}
                    style={inputStyle}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#ccff00]"
                  >
                    {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
                <StrengthBars password={watchedPw} />
                {step1Form.formState.errors.password && (
                  <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                    {t("auth.passwordWeak")}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <Label
                  htmlFor="reg-confirm"
                  className="uppercase text-xs font-black tracking-widest text-[#999]"
                >
                  {t("auth.confirmPassword")}
                </Label>
                <div className="relative mt-1">
                  <FiLock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                    size={14}
                  />
                  <Input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...step1Form.register("confirmPassword")}
                    style={inputStyle}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#ccff00]"
                  >
                    {showConfirm ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
                {step1Form.formState.errors.confirmPassword && (
                  <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                    {t("auth.passwordMismatch")}
                  </p>
                )}
              </div>

              {/* Name (optional) */}
              <div>
                <Label
                  htmlFor="reg-name"
                  className="uppercase text-xs font-black tracking-widest text-[#999]"
                >
                  {t("auth.name") || "NAME"}{" "}
                  <span className="text-[#555] normal-case font-normal">
                    ({t("common.optional") || "optional"})
                  </span>
                </Label>
                <div className="relative mt-1">
                  <FiUser
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                    size={14}
                  />
                  <Input
                    id="reg-name"
                    autoComplete="name"
                    placeholder={t("auth.name") || "Your name"}
                    {...step1Form.register("name")}
                    style={inputStyle}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Next / Submit */}
              <Button
                type="submit"
                disabled={isPending}
                style={btnPrimaryStyle}
                className="w-full font-black uppercase tracking-widest"
              >
                {role === "company" ? (
                  <>
                    {t("common.next") || "NEXT"}{" "}
                    <FiArrowRight className="ml-2" size={16} />
                  </>
                ) : isPending ? (
                  t("common.loading")
                ) : (
                  t("auth.register")
                )}
              </Button>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "4px 0",
                }}
              >
                <div style={{ flex: 1, height: 2, background: "#222" }} />
                <span
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: "#555" }}
                >
                  {t("auth.or")}
                </span>
                <div style={{ flex: 1, height: 2, background: "#222" }} />
              </div>

              {/* Google */}
              <Button
                type="button"
                disabled={isGoogleLoading}
                onClick={handleGoogleSignIn}
                style={btnGhostStyle}
                className="w-full font-black uppercase tracking-widest"
              >
                <GoogleIcon />
                <span className="ml-2">
                  {isGoogleLoading
                    ? t("common.loading")
                    : "LOGIN WITH GOOGLE"}
                </span>
              </Button>

              {/* Login link */}
              <p
                className="text-center text-xs font-bold uppercase tracking-widest"
                style={{ color: "#555" }}
              >
                {t("auth.hasAccount")}{" "}
                <Link
                  href="/login"
                  onClick={() => onOpenChange(false)}
                  style={{ color: "#ccff00", textDecoration: "underline" }}
                >
                  {t("auth.login")}
                </Link>
              </p>
            </form>
          )}

          {/* ── STEP 2: Company setup ── */}
          {step === 1 && (
            <form onSubmit={handleStep2} className="space-y-4">
              {/* Company name */}
              <div>
                <Label
                  htmlFor="reg-company"
                  className="uppercase text-xs font-black tracking-widest text-[#999]"
                >
                  {t("auth.companyName")}
                </Label>
                <Input
                  id="reg-company"
                  autoComplete="organization"
                  placeholder="ACME Corp"
                  {...step2Form.register("companyName")}
                  style={{ ...inputStyle, marginTop: 4 }}
                />
                {step2Form.formState.errors.companyName && (
                  <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                    {t("auth.companyName")} is required
                  </p>
                )}
              </div>

              {/* Company code */}
              <div>
                <Label className="uppercase text-xs font-black tracking-widest text-[#999]">
                  COMPANY CODE
                </Label>
                <div className="flex gap-2 mt-1">
                  <div
                    style={{
                      flex: 1,
                      background: "#111",
                      border: "2px solid #ccff00",
                      padding: "10px 14px",
                      fontFamily: "monospace",
                      fontSize: 18,
                      fontWeight: 900,
                      letterSpacing: "0.3em",
                      color: "#ccff00",
                    }}
                  >
                    {companyCode}
                  </div>
                  <button
                    type="button"
                    onClick={copyCode}
                    style={iconBtnStyle}
                    title="Copy"
                  >
                    <FiCopy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyCode(genCode())}
                    style={iconBtnStyle}
                    title="Regenerate"
                  >
                    <FiRefreshCw size={16} />
                  </button>
                </div>
                <p
                  className="text-xs mt-1 font-bold uppercase tracking-wider"
                  style={{ color: "#555" }}
                >
                  {t("auth.uniqueCompanyCodeDescription")}
                </p>
              </div>

              {/* OR Telegram */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "4px 0",
                }}
              >
                <div style={{ flex: 1, height: 2, background: "#222" }} />
                <span
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: "#555" }}
                >
                  OR
                </span>
                <div style={{ flex: 1, height: 2, background: "#222" }} />
              </div>

              <Button
                type="button"
                style={btnTelegramStyle}
                className="w-full font-black uppercase tracking-widest"
              >
                <TelegramIcon />
                <span className="ml-2">REGISTER VIA TELEGRAM</span>
              </Button>

              <Button
                type="submit"
                disabled={isPending}
                style={btnPrimaryStyle}
                className="w-full font-black uppercase tracking-widest"
              >
                {isPending ? t("common.loading") : t("auth.register")}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "#111",
  border: "2px solid #333",
  borderRadius: 0,
  color: "#f0f0f0",
  fontWeight: 700,
  outline: "none",
};

const btnPrimaryStyle: React.CSSProperties = {
  background: "#ccff00",
  color: "#000",
  border: "3px solid #ccff00",
  borderRadius: 0,
  fontWeight: 900,
  letterSpacing: "0.1em",
  height: 48,
};

const btnGhostStyle: React.CSSProperties = {
  background: "transparent",
  color: "#f0f0f0",
  border: "2px solid #333",
  borderRadius: 0,
  fontWeight: 900,
  letterSpacing: "0.1em",
  height: 48,
};

const btnTelegramStyle: React.CSSProperties = {
  background: "#0088cc",
  color: "#fff",
  border: "2px solid #0088cc",
  borderRadius: 0,
  fontWeight: 900,
  letterSpacing: "0.1em",
  height: 48,
};

const iconBtnStyle: React.CSSProperties = {
  background: "#111",
  border: "2px solid #333",
  borderRadius: 0,
  color: "#ccff00",
  padding: "0 14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
    </svg>
  );
}

// ─── Error mapper ─────────────────────────────────────────────────────────────

function mapError(msg: string, t: (k: string) => string): string {
  const m = msg.toLowerCase();
  if (m.includes("code") && m.includes("already"))
    return t("auth.companyCodeAlreadyExists");
  if (m.includes("name") && m.includes("already") && m.includes("company"))
    return t("auth.companyNameAlreadyExists");
  if (m.includes("email") && m.includes("already") && m.includes("company"))
    return t("auth.companyEmailAlreadyExists");
  if (m.includes("email") && m.includes("already") && m.includes("admin"))
    return t("auth.adminEmailAlreadyExists");
  if (m.includes("user") && m.includes("already"))
    return t("auth.userEmailAlreadyExists");
  if (m.includes("required")) return t("auth.emailAndPasswordRequired");
  return t("common.error");
}

export default RegisterModal;
