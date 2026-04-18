'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FiCheck, FiAlertTriangle, FiShield } from "react-icons/fi";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface PlanFeature {
  label: string;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  price: number;
  features?: PlanFeature[];
  onSuccess: (orderId: string) => void;
  onClose?: () => void;
}

/* ─── Constants ────────────────────────────────────────────────────────────── */

// KZT → USD. ~490 KZT = 1 USD (2026).
// TODO: fetch live rate from exchange-rate API in production.
const KZT_TO_USD_RATE = 1 / 490;

/* ─── Neon spinner ─────────────────────────────────────────────────────────── */

const NeonSpinner = () => (
  <span
    className="inline-block h-5 w-5 border-2 border-foreground border-t-neon animate-spin"
    style={{ borderRadius: 0 }}
    aria-hidden="true"
  />
);

/* ─── PayPal not configured fallback ───────────────────────────────────────── */

const PayPalMissingBanner = ({ message }: { message: string }) => (
  <div className="flex items-start gap-2 border-2 border-accent bg-accent/10 p-3">
    <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
    <p className="text-sm font-mono text-accent">{message}</p>
  </div>
);

/* ─── Component ────────────────────────────────────────────────────────────── */

const PaymentModal = ({
  open,
  onOpenChange,
  planId: _planId,
  planName,
  price,
  features = [],
  onSuccess,
  onClose,
}: PaymentModalProps) => {
  const { t } = useTranslation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const priceUSD = Math.max(1, Math.round(price * KZT_TO_USD_RATE * 100) / 100).toFixed(2);

  const handleOpenChange = (value: boolean) => {
    if (isProcessing) return;
    if (!value) {
      // Reset on close
      setPaymentState("idle");
      setErrorMessage("");
      onClose?.();
    }
    onOpenChange(value);
  };

  const handleError = (msg?: string) => {
    setIsProcessing(false);
    setPaymentState("error");
    setErrorMessage(msg || t("payment.failed"));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/*
        DialogContent already ships with:
          border-2 border-foreground rounded-none shadow-brutal
        Override max-width and deepen the brutal shadow for this modal.
      */}
      <DialogContent
        maxWidth="max-w-md"
        className="shadow-[8px_8px_0_0_hsl(var(--primary))]"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <DialogHeader>
          <DialogTitle className="text-xl tracking-widest">
            {t("payment.upgradePlan", "UPGRADE PLAN")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("payment.description", {
              plan: planName,
              price,
            })}
          </DialogDescription>
        </DialogHeader>

        {/* ── Plan summary ─────────────────────────────────────────────── */}
        <div className="border-2 border-foreground p-4 space-y-3">
          {/* Plan name row */}
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
              {t("payment.plan", "PLAN")}
            </span>
            <span className="font-bold uppercase tracking-wider text-foreground">
              {planName}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-foreground/20" />

          {/* Price — big mono number */}
          <div className="flex items-end justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
              {t("payment.amount", "AMOUNT")}
            </span>
            <div className="text-right">
              <span className="font-mono text-3xl font-black text-primary leading-none">
                {price.toLocaleString()}
              </span>
              <span className="font-mono text-lg font-bold text-primary ml-1">₸</span>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                ≈&nbsp;${priceUSD}&nbsp;USD
              </p>
            </div>
          </div>

          {/* Features list */}
          {features.length > 0 && (
            <>
              <div className="h-px bg-foreground/20" />
              <ul className="space-y-1.5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-mono">
                    <FiCheck className="h-3 w-3 shrink-0 text-neon" />
                    <span className="text-foreground">{f.label}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* ── Payment section ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Section label */}
          <p className="text-xs uppercase tracking-widest font-mono text-muted-foreground">
            {t("payment.paymentMethod", "PAYMENT METHOD")}
          </p>

          {/* ── Success state ── */}
          {paymentState === "success" && (
            <div className="border-2 border-neon bg-neon/10 p-4 flex items-center gap-3">
              <FiCheck className="h-6 w-6 shrink-0 text-neon" />
              <span className="font-mono font-black uppercase tracking-widest text-foreground">
                {t("payment.success", "PAYMENT SUCCESSFUL")}
              </span>
            </div>
          )}

          {/* ── Error state ── */}
          {paymentState === "error" && (
            <div className="border-2 border-accent bg-accent/10 p-3 flex items-start gap-2">
              <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span className="font-mono text-sm text-accent">
                {errorMessage || t("payment.failed")}
              </span>
            </div>
          )}

          {/* ── PayPal not configured ── */}
          {!clientId && paymentState === "idle" && (
            <PayPalMissingBanner message={t("payment.paypalNotConfigured")} />
          )}

          {/* ── PayPal buttons ── */}
          {clientId && paymentState !== "success" && (
            <div className="relative">
              {/* Processing overlay */}
              {isProcessing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 border-2 border-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <NeonSpinner />
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {t("common.loading", "PROCESSING...")}
                    </span>
                  </div>
                </div>
              )}

              <PayPalScriptProvider
                options={{
                  clientId,
                  currency: "USD",
                  intent: "capture",
                }}
              >
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    color: "black",
                    shape: "rect",
                    label: "pay",
                    height: 48,
                  }}
                  disabled={isProcessing}
                  createOrder={(_data, actions) =>
                    actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          description: `${planName} — Sayless`,
                          amount: {
                            currency_code: "USD",
                            value: priceUSD,
                          },
                        },
                      ],
                    })
                  }
                  onApprove={async (_data, actions) => {
                    setIsProcessing(true);
                    setPaymentState("idle");
                    try {
                      const details = await actions.order?.capture();
                      if (details?.status === "COMPLETED") {
                        setPaymentState("success");
                        onSuccess(details.id || "");
                      } else {
                        handleError(t("payment.failed"));
                      }
                    } catch {
                      handleError(t("payment.failed"));
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  onError={() => handleError(t("payment.failed"))}
                  onCancel={() => {
                    setPaymentState("error");
                    setErrorMessage(t("payment.cancelled"));
                    setIsProcessing(false);
                  }}
                />
              </PayPalScriptProvider>
            </div>
          )}

          {/* ── Future payment methods placeholder ── */}
          <div className="border-2 border-dashed border-foreground/20 p-3 flex items-center justify-center opacity-40 pointer-events-none select-none">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {t("payment.moreMethods", "MORE METHODS — COMING SOON")}
            </span>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <FiShield className="h-3 w-3 text-muted-foreground" />
          <p className="font-mono text-xs text-muted-foreground">
            {t("payment.securePayment")}
          </p>
        </div>

        {/* ── Close button (success state only — explicit dismiss) ────── */}
        {paymentState === "success" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-2 border-foreground"
            onClick={() => handleOpenChange(false)}
          >
            {t("common.close", "CLOSE")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
