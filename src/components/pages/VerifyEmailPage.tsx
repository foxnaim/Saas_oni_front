'use client';

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/redux";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiXCircle, FiLoader, FiArrowLeft } from "react-icons/fi";

// ─── States ───────────────────────────────────────────────────────────────────

type Status = "loading" | "success" | "error";

// ─── Inner component (needs searchParams) ─────────────────────────────────────

function VerifyEmailContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail } = useAuth();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    if (!token) {
      setStatus("error");
      return;
    }

    const run = async () => {
      try {
        const ok = await verifyEmail(token);
        setStatus(ok ? "success" : "error");
        if (ok) {
          setTimeout(() => router.push("/company"), 3500);
        }
      } catch {
        setStatus("error");
      }
    };

    run();
  }, [token, verifyEmail, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0a0a0a" }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          border: `3px solid ${
            status === "loading"
              ? "#333"
              : status === "success"
              ? "#ccff00"
              : "#ff4444"
          }`,
          background: "#111",
          padding: "48px 40px",
          transition: "border-color 0.3s",
        }}
      >
        {/* Logo / brand */}
        <Link href="/">
          <p
            className="font-black uppercase tracking-widest mb-10"
            style={{ fontSize: 16, color: "#ccff00" }}
          >
            SAYLESS
          </p>
        </Link>

        {/* ── LOADING ── */}
        {status === "loading" && (
          <StatusBlock
            icon={
              <FiLoader
                size={44}
                style={{ color: "#ccff00", animation: "spin 1s linear infinite" }}
              />
            }
            title={t("auth.verifyingEmail")}
            description={t("auth.verifyEmailWait")}
            accent="#ccff00"
          />
        )}

        {/* ── SUCCESS ── */}
        {status === "success" && (
          <>
            <StatusBlock
              icon={<FiCheckCircle size={44} style={{ color: "#ccff00" }} />}
              title={t("auth.emailVerified")}
              description={t("auth.emailVerifiedSuccess")}
              accent="#ccff00"
            />
            <div className="mt-8 space-y-3">
              <Button
                onClick={() => router.push("/company")}
                style={btnPrimary}
                className="w-full font-black uppercase tracking-widest"
              >
                {t("auth.goToDashboard")}
              </Button>
              <p
                className="text-center text-xs font-bold uppercase tracking-widest"
                style={{ color: "#555" }}
              >
                {t("auth.login") + " — "}
                <Link
                  href="/login"
                  style={{ color: "#ccff00", textDecoration: "underline" }}
                >
                  {t("auth.login")}
                </Link>
              </p>
            </div>
          </>
        )}

        {/* ── ERROR ── */}
        {status === "error" && (
          <>
            <StatusBlock
              icon={<FiXCircle size={44} style={{ color: "#ff4444" }} />}
              title={t("auth.verificationFailed")}
              description={t("auth.verificationLinkInvalid")}
              accent="#ff4444"
            />
            <div className="mt-8 space-y-3">
              <Link href="/login">
                <Button
                  style={btnPrimary}
                  className="w-full font-black uppercase tracking-widest"
                >
                  {t("auth.login")}
                </Button>
              </Link>
              <Link href="/">
                <Button
                  style={btnGhost}
                  className="w-full font-black uppercase tracking-widest"
                >
                  <FiArrowLeft className="mr-2" size={14} />
                  {t("auth.returnHome")}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Spin keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Status block sub-component ───────────────────────────────────────────────

function StatusBlock({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div>
      {/* Icon */}
      <div className="mb-6">{icon}</div>

      {/* Accent bar */}
      <div
        style={{ width: 48, height: 4, background: accent, marginBottom: 20 }}
      />

      <h1
        className="font-black uppercase"
        style={{ fontSize: 26, letterSpacing: "-0.01em", color: "#f0f0f0", marginBottom: 12 }}
      >
        {title}
      </h1>
      <p
        className="font-bold"
        style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}
      >
        {description}
      </p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

// ─── Page export with Suspense boundary ──────────────────────────────────────

export default function VerifyEmailPage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "#0a0a0a" }}
        >
          <div
            style={{
              border: "3px solid #333",
              background: "#111",
              padding: "48px 40px",
              textAlign: "center",
              width: 460,
            }}
          >
            <p
              className="font-black uppercase tracking-widest mb-8"
              style={{ fontSize: 16, color: "#ccff00" }}
            >
              SAYLESS
            </p>
            <FiLoader
              size={40}
              style={{
                color: "#ccff00",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
              }}
            />
            <p
              className="mt-6 font-bold uppercase tracking-widest text-xs"
              style={{ color: "#555" }}
            >
              {t("common.loading")}
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
