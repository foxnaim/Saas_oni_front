/**
 * WelcomeServer — RSC wrapper for the landing page.
 *
 * Responsibilities:
 *   1. Fetch public companies for SEO (ISR, revalidate every 120 s).
 *   2. Optionally resolve a specific company by code (from /[code] route).
 *   3. Pass all pre-fetched data to the Welcome client component.
 *
 * This file must NOT contain 'use client'.
 */

import Welcome from "@/components/pages/Welcome";
import { serverApiClient } from "@/lib/api/server";
import type { Company } from "@/types";

// ── ISR ────────────────────────────────────────────────────────────────────────
// Next.js reads this export from the nearest page or layout, not from a
// Server Component inside /components — but we declare it here as documentation
// and re-export it from the actual page files when needed.
export const revalidate = 120;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface WelcomeServerProps {
  /** 8-character company code from the /[code] URL segment. */
  initialCompanyCode?: string;
  /** Raw search params forwarded from the Next.js page. */
  searchParams?: { code?: string; lang?: string; register?: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Component
// ─────────────────────────────────────────────────────────────────────────────

export default async function WelcomeServer({
  initialCompanyCode,
  searchParams,
}: WelcomeServerProps) {
  // ── Resolve company code (prop takes precedence over search param) ──────────
  const rawCode = initialCompanyCode ?? searchParams?.code;
  const code = rawCode?.toUpperCase().trim();
  const isValidCode = typeof code === "string" && code.length === 8;

  // ── Parallel data fetching ──────────────────────────────────────────────────
  const [initialCompany, publicCompanies] = await Promise.all([
    // Fetch the specific company when a valid code is present.
    isValidCode
      ? serverApiClient.getCompanyByCode(code as string)
      : Promise.resolve(null as Company | null),

    // Fetch public company list for SEO (sitemap / structured data hydration).
    // Falls back to [] on network error — graceful degradation.
    serverApiClient.getPublicCompanies(),
  ]);

  return (
    <Welcome
      initialCompanyCode={isValidCode ? code : undefined}
      initialCompany={initialCompany}
      publicCompanies={publicCompanies}
    />
  );
}
