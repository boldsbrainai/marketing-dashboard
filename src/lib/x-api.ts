export interface XSummary {
  username: string;
  followers: number;
  following?: number;
  postsInRange: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
}

export interface XSeriesPoint {
  date: string; // YYYY-MM-DD
  posts: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

async function xGet<T>(bearerToken: string, url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${bearerToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`X API failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export async function fetchXAccountAnalytics(opts: {
  bearerToken: string;
  username: string;
  days: number;
}): Promise<{ summary: XSummary; series: XSeriesPoint[] }> {
  const user = await xGet<any>(
    opts.bearerToken,
    `https://api.x.com/2/users/by/username/${encodeURIComponent(
      opts.username
    )}?user.fields=public_metrics`
  );

  const userId = user?.data?.id as string | undefined;
  if (!userId) throw new Error("X user lookup failed");

  const followers = num(user?.data?.public_metrics?.followers_count);
  const following = num(user?.data?.public_metrics?.following_count);

  const start = new Date(Date.now() - opts.days * 24 * 60 * 60 * 1000);
  const startTime = start.toISOString();

  const buckets = new Map<string, XSeriesPoint>();
  for (let i = 0; i < opts.days; i++) {
    const d = new Date(Date.now() - (opts.days - 1 - i) * 24 * 60 * 60 * 1000);
    const key = isoDay(d);
    buckets.set(key, { date: key, posts: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 });
  }

  let nextToken: string | undefined;
  const maxPages = 5;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      max_results: "100",
      "tweet.fields": "created_at,public_metrics",
      exclude: "retweets,replies",
      start_time: startTime,
    });
    if (nextToken) params.set("pagination_token", nextToken);

    const tweets = await xGet<any>(
      opts.bearerToken,
      `https://api.x.com/2/users/${encodeURIComponent(userId)}/tweets?${params.toString()}`
    );

    const data = Array.isArray(tweets?.data) ? tweets.data : [];

    for (const t of data) {
      const created = typeof t?.created_at === "string" ? t.created_at : null;
      if (!created) continue;
      const day = created.slice(0, 10);
      const b = buckets.get(day);
      if (!b) continue;
      b.posts += 1;
      b.likes += num(t?.public_metrics?.like_count);
      b.replies += num(t?.public_metrics?.reply_count);
      b.reposts += num(t?.public_metrics?.retweet_count);
      b.quotes += num(t?.public_metrics?.quote_count);
    }

    nextToken = tweets?.meta?.next_token;
    if (!nextToken) break;
  }

  const series = Array.from(buckets.values());
  const summary = series.reduce(
    (acc, p) => {
      acc.postsInRange += p.posts;
      acc.likes += p.likes;
      acc.replies += p.replies;
      acc.reposts += p.reposts;
      acc.quotes += p.quotes;
      return acc;
    },
    {
      username: opts.username,
      followers,
      following,
      postsInRange: 0,
      likes: 0,
      replies: 0,
      reposts: 0,
      quotes: 0,
    } as XSummary
  );

  return { summary, series };
}

