export interface CycleTimeSample {
  cycleHours: number;
}

export interface CycleTimeStats {
  n: number;
  medianHours: number | null;
  p90Hours: number | null;
}

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[rank];
}

export function summarizeCycleTimes(samples: CycleTimeSample[]): CycleTimeStats {
  const values = samples
    .map((s) => s.cycleHours)
    .filter((v) => Number.isFinite(v) && v >= 0);
  return {
    n: values.length,
    medianHours: percentile(values, 50),
    p90Hours: percentile(values, 90),
  };
}

export function percentImprovement(before: number | null, after: number | null): number | null {
  if (before === null || after === null) return null;
  if (!Number.isFinite(before) || !Number.isFinite(after) || before <= 0) return null;
  return ((before - after) / before) * 100;
}
