import { NextRequest, NextResponse } from "next/server";
import { getDailyMetrics } from "@/lib/queries";
import { requireApiUser } from "@/lib/api-auth";
import { clampDays, computeSocialAnalytics, isSafeExternalUrl } from "@/lib/analytics";
import { fetchPlausibleWebsiteAnalytics } from "@/lib/plausible";
import { fetchGa4WebsiteAnalytics } from "@/lib/ga4";
import { fetchXAccountAnalytics } from "@/lib/x-api";
import { fetchLinkedInOrgAnalytics } from "@/lib/linkedin";

export async function GET(req: NextRequest) {
  const auth = requireApiUser(req as Request);
  if (auth) return auth;

  const { searchParams } = req.nextUrl;
  const days = clampDays(searchParams.get("days"), 30);
  const real = searchParams.get("real") === "true";

  const rawDaily = getDailyMetrics(days, { excludeSeed: real });
  const dailyAsc = [...rawDaily].reverse();
  const social = computeSocialAnalytics(dailyAsc);

  const websiteIframeUrlRaw = process.env.HERMES_ANALYTICS_WEBSITE_IFRAME_URL;
  const socialIframeUrlRaw = process.env.HERMES_ANALYTICS_SOCIAL_IFRAME_URL;
  const websiteIframeUrl = isSafeExternalUrl(websiteIframeUrlRaw) ? websiteIframeUrlRaw : null;
  const socialIframeUrl = isSafeExternalUrl(socialIframeUrlRaw) ? socialIframeUrlRaw : null;

  // Website analytics preference: GA4 -> Plausible -> embed.
  const ga4PropertyId = process.env.GA4_PROPERTY_ID || process.env.GA4_PROPERTY || null;
  const ga4ServiceAccountJson = process.env.GA4_SERVICE_ACCOUNT_JSON || null;
  const ga4ServiceAccountJsonB64 = process.env.GA4_SERVICE_ACCOUNT_JSON_B64 || null;

  const plausibleSiteId = process.env.PLAUSIBLE_SITE_ID;
  const plausibleApiKey = process.env.PLAUSIBLE_API_KEY;
  const plausibleBaseUrl = process.env.PLAUSIBLE_BASE_URL || "https://plausible.io";

  let website: any = { provider: "none", configured: false };

  if (ga4PropertyId && (ga4ServiceAccountJson || ga4ServiceAccountJsonB64)) {
    try {
      const ga4 = await fetchGa4WebsiteAnalytics({
        propertyId: ga4PropertyId,
        days,
        serviceAccountJson: ga4ServiceAccountJson,
        serviceAccountJsonB64: ga4ServiceAccountJsonB64,
      });
      website = {
        provider: "ga4",
        configured: true,
        summary: ga4.summary,
        series: ga4.series,
        topPages: ga4.topPages,
        trafficSources: ga4.trafficSources,
        deviceSplit: ga4.deviceSplit,
        newVsReturning: ga4.newVsReturning,
        countries: ga4.countries,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "GA4 analytics fetch failed";
      website = {
        provider: "ga4",
        configured: false,
        error: msg,
        ...(websiteIframeUrl ? { iframeUrl: websiteIframeUrl } : {}),
      };
    }
  } else if (plausibleSiteId && plausibleApiKey) {
    try {
      const plausible = await fetchPlausibleWebsiteAnalytics({
        baseUrl: plausibleBaseUrl,
        siteId: plausibleSiteId,
        apiKey: plausibleApiKey,
        days,
      });
      website = {
        provider: "plausible",
        configured: true,
        summary: plausible.summary,
        series: plausible.series,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Website analytics fetch failed";
      website = {
        provider: "plausible",
        configured: false,
        error: msg,
        ...(websiteIframeUrl ? { iframeUrl: websiteIframeUrl } : {}),
      };
    }
  } else if (websiteIframeUrl) {
    website = { provider: "iframe", configured: true, iframeUrl: websiteIframeUrl };
  } else {
    website = {
      provider: "none",
      configured: false,
      error:
        "Not configured. Set GA4_PROPERTY_ID + GA4_SERVICE_ACCOUNT_JSON (recommended) or PLAUSIBLE_SITE_ID + PLAUSIBLE_API_KEY, or HERMES_ANALYTICS_WEBSITE_IFRAME_URL.",
    };
  }

  // Social native connectors.
  let x: any = { provider: "x", configured: false };
  const xBearer = process.env.X_BEARER_TOKEN || process.env.X_API_BEARER_TOKEN || null;
  const xUsername = process.env.X_USERNAME || null;
  if (xBearer && xUsername) {
    try {
      const out = await fetchXAccountAnalytics({ bearerToken: xBearer, username: xUsername, days });
      x = { provider: "x", configured: true, summary: out.summary, series: out.series };
    } catch (err) {
      x = {
        provider: "x",
        configured: false,
        error: err instanceof Error ? err.message : "X analytics fetch failed",
      };
    }
  }

  let linkedin: any = { provider: "linkedin", configured: false };
  const liToken = process.env.LINKEDIN_ACCESS_TOKEN || null;
  const liOrgUrn = process.env.LINKEDIN_ORGANIZATION_URN || null;
  const liVersion = process.env.LINKEDIN_VERSION || null;
  if (liToken && liOrgUrn) {
    try {
      const out = await fetchLinkedInOrgAnalytics({
        accessToken: liToken,
        organizationUrn: liOrgUrn,
        version: liVersion || undefined,
      });
      linkedin = { provider: "linkedin", configured: true, summary: out.summary, series: out.series };
    } catch (err) {
      linkedin = {
        provider: "linkedin",
        configured: false,
        error: err instanceof Error ? err.message : "LinkedIn analytics fetch failed",
      };
    }
  }

  return NextResponse.json({
    days,
    website,
    x,
    linkedin,
    social: {
      provider: "internal",
      configured: true,
      summary: social.summary,
      series: social.series,
      iframeUrl: socialIframeUrl,
    },
  });
}
