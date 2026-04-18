import type { DailyMetrics } from "@/types";

export interface SocialAnalyticsSummary {
  impressions: number;
  engagement: number;
  engagementRatePct: number;
  xPosts: number;
  xReplies: number;
  xQuoteTweets: number;
  xFollows: number;
  linkedinComments: number;
  leads: number;
  emailsSent: number;
}

export interface SocialAnalyticsPoint {
  date: string;
  impressions: number;
  engagement: number;
  leads: number;
  emailsSent: number;
}

export function clampDays(raw: unknown, fallback = 30): number {
  const n =
    typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(365, Math.floor(n)));
}

export function computeSocialAnalytics(
  daily: DailyMetrics[]
): {
  summary: SocialAnalyticsSummary;
  series: SocialAnalyticsPoint[];
} {
  const series = daily
    .filter((d) => Boolean(d?.date))
    .map((d) => ({
      date: d.date,
      impressions: d.total_impressions ?? 0,
      engagement: d.total_engagement ?? 0,
      leads: d.discoveries ?? 0,
      emailsSent: d.sends ?? 0,
    }));

  const sums = daily.reduce(
    (acc, d) => {
      acc.impressions += d.total_impressions ?? 0;
      acc.engagement += d.total_engagement ?? 0;
      acc.xPosts += d.x_posts ?? 0;
      acc.xReplies += d.x_replies ?? 0;
      acc.xQuoteTweets += d.x_quote_tweets ?? 0;
      acc.xFollows += d.x_follows ?? 0;
      acc.linkedinComments += d.linkedin_comments ?? 0;
      acc.leads += d.discoveries ?? 0;
      acc.emailsSent += d.sends ?? 0;
      return acc;
    },
    {
      impressions: 0,
      engagement: 0,
      xPosts: 0,
      xReplies: 0,
      xQuoteTweets: 0,
      xFollows: 0,
      linkedinComments: 0,
      leads: 0,
      emailsSent: 0,
    }
  );

  const engagementRatePct =
    sums.impressions > 0 ? (sums.engagement / sums.impressions) * 100 : 0;

  return {
    summary: {
      impressions: sums.impressions,
      engagement: sums.engagement,
      engagementRatePct,
      xPosts: sums.xPosts,
      xReplies: sums.xReplies,
      xQuoteTweets: sums.xQuoteTweets,
      xFollows: sums.xFollows,
      linkedinComments: sums.linkedinComments,
      leads: sums.leads,
      emailsSent: sums.emailsSent,
    },
    series,
  };
}

export function isSafeExternalUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return Boolean(u.hostname);
  } catch {
    return false;
  }
}

export function formatDurationSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0s";
  const s = Math.floor(totalSeconds);
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hours > 0) return String(hours) + "h " + String(mins).padStart(2, "0") + "m";
  if (mins > 0) return String(mins) + "m " + String(secs).padStart(2, "0") + "s";
  return String(secs) + "s";
}

