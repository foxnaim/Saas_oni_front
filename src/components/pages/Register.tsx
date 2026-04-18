'use client';

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FiZap,
} from "react-icons/fi";
import { signIn } from "next-auth/react";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const genCode = () =>
  Array.from({ length: 8 }, () =>
    CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  ).join("");

const getStrength = (pw: string): 0 | 1 | 2 | 3 | 4 => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StrengthBars({ password }: { password: string }) {
  const { t } = useTranslation();
  const strength = getStrength(password);
  if (!password) return null;
  const labels = [
    "",
    "passwordStrengthWeak",
    "passwordStrengthMedium",
    "passwordStrengthStrong",
    "passwordStrengthStrong",
  ];
  const colors = ["#1a1a1a", "#ff4444", "#ff9900", "#ccff00", "#ccff00"];
  return (
    <div className="mt-1 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1"
            style={{ background: i <= strength ? "#ccff00" : "#333" }}
          />
        ))}
      </div>
      {strength > 0 && (
        <p
          className="text-xs font-black uppercase tracking-widest"
          style={{ color: colors[strength] }}
        >
          {t(`auth.${labels[strength]}`)}
        </p>
      )}
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 12,
            height: 12,
            background: i === current ? "#ccff00" : "#222",
            border: `2px solid ${i === current ? "#ccff00" : "#444"}`,
          }}
        />
      ))}
      <span
        className="ml-2 text-xs font-black uppercase tracking-widest"
        style={{ color: "#555" }}
      >
        STEP {current + 1} / {total}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const Register = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const role = "company";
  const totalSteps = 2;
  const [step, setStep] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
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

  const handleStep1 = step1Form.handleSubmit((data) => {
    setStep1Data(data);
    setStep(1);
  });

  const submitRegister = useCallback(
    async (s1: Step1Values, s2: Step2Values) => {
      setIsPending(true);
      try {
        const result = await dispatch(
          registerAsync({
            email: s1.email,
            password: s1.password,
            name: s1.name || undefined,
            role,
            companyName: s2.companyName,
            companyCode: s2.companyCode,
          })
        );
        if (registerAsync.fulfilled.match(result)) {
          toast.success(t("auth.registerSuccess"));
          requestAnimationFrame(() => router.replace("/company"));
        } else {
          toast.error(mapError(result.payload as string, t));
        }
      } catch {
        toast.error(t("common.error"));
      } finally {
        setIsPending(false);
      }
    },
    [dispatch, router, t]
  );

  const handleStep2 = step2Form.handleSubmit((data) => {
    if (!step1Data) return;
    submitRegister(step1Data, { ...data, companyCode });
  });

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
    <div
      className="min-h-screen flex"
      style={{ background: "#0a0a0a", color: "#f0f0f0" }}
    >
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{
          width: "42%",
          background: "#ccff00",
          padding: "48px 52px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,0,0,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Link href="/">
            <span
              className="font-black uppercase"
              style={{ fontSize: 28, letterSpacing: "0.15em", color: "#000" }}
            >
              SAYLESS
            </span>
          </Link>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            className="font-black uppercase"
            style={{
              fontSize: 56,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#000",
            }}
          >
            ANON
            <br />
            YMOUS.
            <br />
            DIRECT.
          </p>
          <p
            className="mt-6 font-bold uppercase tracking-widest"
            style={{ fontSize: 13, color: "#000", opacity: 0.6 }}
          >
            Feedback without fear.
            <br />
            Insights without bias.
          </p>
        </div>

        <div
          style={{ position: "relative", zIndex: 1 }}
          className="flex gap-3"
        >
          {["NO FLUFF", "BRUTAL TRUTH", "REAL FEEDBACK"].map((tag) => (
            <span
              key={tag}
              style={{
                background: "#000",
                color: "#ccff00",
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.15em",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center" style={{ padding: "48px 52px" }}>
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/">
            <span
              className="font-black uppercase"
              style={{ fontSize: 22, letterSpacing: "0.15em", color: "#ccff00" }}
            >
              SAYLESS
            </span>
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 font-black uppercase tracking-widest"
          style={{ color: "#555", fontSize: 11 }}
        >
          <FiArrowLeft size={14} /> {t("common.back")}
        </Link>

        <div style={{ maxWidth: 440 }}>
          {/* Title */}
          <div className="mb-6">
            <p
              className="font-black uppercase tracking-widest"
              style={{ fontSize: 11, color: "#ccff00", marginBottom: 8 }}
            >
              JOIN SAYLESS
            </p>
            <h1
              className="font-black uppercase"
              style={{ fontSize: 36, lineHeight: 1, letterSpacing: "-0.01em" }}
            >
              {step === 0 ? "CREATE ACCOUNT" : "SETUP COMPANY"}
            </h1>
          </div>

          <StepDots current={step} total={totalSteps} />

          {/* ── STEP 1 ── */}
          {step === 0 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <Field
                label={t("auth.email")}
                id="r-email"
                icon={<FiMail size={13} />}
                error={
                  step1Form.formState.errors.email
                    ? t("auth.invalidEmail")
                    : undefined
                }
              >
                <Input
                  id="r-email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  {...step1Form.register("email")}
                  style={inputStyle}
                  className="pl-9"
                />
              </Field>

              <Field
                label={t("auth.password")}
                id="r-pw"
                icon={<FiLock size={13} />}
                error={
                  step1Form.formState.errors.password
                    ? t("auth.passwordWeak")
                    : undefined
                }
                extra={<StrengthBars password={watchedPw} />}
              >
                <div className="relative">
                  <FiLock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                    size={13}
                  />
                  <Input
                    id="r-pw"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...step1Form.register("password")}
                    style={inputStyle}
                    className="pl-9 pr-10"
                  />
                  <EyeBtn show={showPw} toggle={() => setShowPw((p) => !p)} />
                </div>
              </Field>

              <Field
                label={t("auth.confirmPassword")}
                id="r-confirm"
                error={
                  step1Form.formState.errors.confirmPassword
                    ? t("auth.passwordMismatch")
                    : undefined
                }
              >
                <div className="relative">
                  <FiLock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                    size={13}
                  />
                  <Input
                    id="r-confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...step1Form.register("confirmPassword")}
                    style={inputStyle}
                    className="pl-9 pr-10"
                  />
                  <EyeBtn
                    show={showConfirm}
                    toggle={() => setShowConfirm((p) => !p)}
                  />
                </div>
              </Field>

              <Field
                label={`${t("auth.name") || "NAME"} (${t("common.optional") || "optional"})`}
                id="r-name"
                icon={<FiUser size={13} />}
              >
                <Input
                  id="r-name"
                  autoComplete="name"
                  placeholder={t("auth.name") || "Your name"}
                  {...step1Form.register("name")}
                  style={inputStyle}
                  className="pl-9"
                />
              </Field>

              <Button
                type="submit"
                style={btnPrimary}
                className="w-full font-black uppercase tracking-widest"
              >
                NEXT <FiArrowRight className="ml-2" size={16} />
              </Button>

              <Divider label={t("auth.or")} />

              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                style={btnGhost}
                className="w-full font-black uppercase tracking-widest"
              >
                <GoogleIcon />
                <span className="ml-2">
                  {isGoogleLoading ? t("common.loading") : "LOGIN WITH GOOGLE"}
                </span>
              </Button>

              <p
                className="text-center text-xs font-bold uppercase tracking-widest"
                style={{ color: "#555" }}
              >
                {t("auth.hasAccount")}{" "}
                <Link
                  href="/login"
                  style={{ color: "#ccff00", textDecoration: "underline" }}
                >
                  {t("auth.login")}
                </Link>
              </p>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 1 && (
            <form onSubmit={handleStep2} className="space-y-5">
              <Field
                label={t("auth.companyName")}
                id="r-cname"
                icon={<FiZap size={13} />}
                error={
                  step2Form.formState.errors.companyName
                    ? `${t("auth.companyName")} required`
                    : undefined
                }
              >
                <Input
                  id="r-cname"
                  autoComplete="organization"
                  placeholder="ACME Corp"
                  {...step2Form.register("companyName")}
                  style={inputStyle}
                  className="pl-9"
                />
              </Field>

              <div>
                <p className="uppercase text-xs font-black tracking-widest text-[#999] mb-2">
                  COMPANY CODE
                </p>
                <div className="flex gap-2">
                  <div
                    style={{
                      flex: 1,
                      background: "#111",
                      border: "2px solid #ccff00",
                      padding: "10px 16px",
                      fontFamily: "monospace",
                      fontSize: 20,
                      fontWeight: 900,
                      letterSpacing: "0.35em",
                      color: "#ccff00",
                    }}
                  >
                    {companyCode}
                  </div>
                  <button
                    type="button"
                    onClick={copyCode}
                    style={iconBtn}
                    title="Copy"
                  >
                    <FiCopy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyCode(genCode())}
                    style={iconBtn}
                    title="Regenerate"
                  >
                    <FiRefreshCw size={16} />
                  </button>
                </div>
                <p
                  className="text-xs mt-2 font-bold uppercase tracking-wider"
                  style={{ color: "#555" }}
                >
                  {t("auth.uniqueCompanyCodeDescription")}
                </p>
              </div>

              <Divider label="OR" />

              <Button
                type="button"
                style={btnTelegram}
                className="w-full font-black uppercase tracking-widest"
              >
                <TelegramIcon />
                <span className="ml-2">REGISTER VIA TELEGRAM</span>
              </Button>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setStep(0)}
                  style={{ ...btnGhost, flex: 1 }}
                  className="font-black uppercase tracking-widest"
                >
                  <FiArrowLeft className="mr-1" size={14} /> BACK
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  style={{ ...btnPrimary, flex: 2 }}
                  className="font-black uppercase tracking-widest"
                >
                  {isPending ? t("common.loading") : t("auth.register")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Reusable sub-components ──────────────────────────────────────────────────

function Field({
  label,
  id,
  icon,
  error,
  extra,
  children,
}: {
  label: string;
  id: string;
  icon?: React.ReactNode;
  error?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block uppercase text-xs font-black tracking-widest mb-1"
        style={{ color: "#999" }}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]">
            {icon}
          </span>
        )}
        {children}
      </div>
      {extra}
      {error && (
        <p className="text-xs mt-1 font-bold" style={{ color: "#ff4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2"
      style={{ color: "#555", background: "none", border: "none", cursor: "pointer" }}
    >
      {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
    </button>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 2, background: "#222" }} />
      <span
        className="text-xs font-black uppercase tracking-widest"
        style={{ color: "#555" }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 2, background: "#222" }} />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "#111",
  border: "2px solid #2a2a2a",
  borderRadius: 0,
  color: "#f0f0f0",
  fontWeight: 700,
  height: 46,
};

const btnPrimary: React.CSSProperties = {
  background: "#ccff00",
  color: "#000",
  border: "3px solid #ccff00",
  borderRadius: 0,
  fontWeight: 900,
  height: 50,
};

const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "#f0f0f0",
  border: "2px solid #2a2a2a",
  borderRadius: 0,
  fontWeight: 900,
  height: 50,
};

const btnTelegram: React.CSSProperties = {
  background: "#0088cc",
  color: "#fff",
  border: "2px solid #0088cc",
  borderRadius: 0,
  fontWeight: 900,
  height: 50,
};

const iconBtn: React.CSSProperties = {
  background: "#111",
  border: "2px solid #2a2a2a",
  borderRadius: 0,
  color: "#ccff00",
  padding: "0 14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

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
  const m = (msg || "").toLowerCase();
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

export default Register;
