import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clampDays,
  computeSocialAnalytics,
  formatDurationSeconds,
  isSafeExternalUrl,
} from "./analytics";
import type { DailyMetrics } from "@/types";

test("clampDays clamps and defaults", () => {
  assert.equal(clampDays("30"), 30);
  assert.equal(clampDays("0"), 1);
  assert.equal(clampDays("999"), 365);
  assert.equal(clampDays("nope", 7), 7);
});

test("isSafeExternalUrl allows http/https only", () => {
  assert.equal(isSafeExternalUrl("https://example.com/embed"), true);
  assert.equal(isSafeExternalUrl("http://example.com/embed"), true);
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
  assert.equal(isSafeExternalUrl("data:text/html,hi"), false);
  assert.equal(isSafeExternalUrl("not-a-url"), false);
});

test("formatDurationSeconds formats human-friendly", () => {
  assert.equal(formatDurationSeconds(0), "0s");
  assert.equal(formatDurationSeconds(7), "7s");
  assert.equal(formatDurationSeconds(67), "1m 07s");
  assert.equal(formatDurationSeconds(3601), "1h 00m");
});

test("computeSocialAnalytics sums correctly", () => {
  const daily: DailyMetrics[] = [
    {
      date: "2026-01-01",
      x_posts: 1,
      x_threads: 0,
      linkedin_drafts: 0,
      x_replies: 2,
      x_quote_tweets: 1,
      x_follows: 3,
      linkedin_comments: 4,
      discoveries: 5,
      enrichments: 0,
      sends: 6,
      replies_triaged: 0,
      opt_outs: 0,
      bounces: 0,
      total_impressions: 100,
      total_engagement: 10,
    },
    {
      date: "2026-01-02",
      x_posts: 2,
      x_threads: 0,
      linkedin_drafts: 0,
      x_replies: 0,
      x_quote_tweets: 0,
      x_follows: 0,
      linkedin_comments: 0,
      discoveries: 1,
      enrichments: 0,
      sends: 2,
      replies_triaged: 0,
      opt_outs: 0,
      bounces: 0,
      total_impressions: 50,
      total_engagement: 5,
    },
  ];

  const out = computeSocialAnalytics(daily);
  assert.equal(out.summary.impressions, 150);
  assert.equal(out.summary.engagement, 15);
  assert.equal(out.summary.xPosts, 3);
  assert.equal(out.summary.xReplies, 2);
  assert.equal(out.summary.xQuoteTweets, 1);
  assert.equal(out.summary.xFollows, 3);
  assert.equal(out.summary.linkedinComments, 4);
  assert.equal(out.summary.leads, 6);
  assert.equal(out.summary.emailsSent, 8);
  assert.equal(out.summary.engagementRatePct, 10);
  assert.equal(out.series.length, 2);
});
