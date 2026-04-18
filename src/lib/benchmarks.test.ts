import assert from 'node:assert/strict';
import { test } from 'node:test';

import { percentImprovement, percentile, summarizeCycleTimes } from './benchmarks';

test('percentile returns null for empty and correct values for p50/p90', () => {
  assert.equal(percentile([], 50), null);
  assert.equal(percentile([10, 20, 30, 40], 50), 20);
  assert.equal(percentile([10, 20, 30, 40], 90), 40);
});

test('summarizeCycleTimes computes n, median and p90', () => {
  const stats = summarizeCycleTimes([
    { cycleHours: 10 },
    { cycleHours: 2 },
    { cycleHours: 18 },
    { cycleHours: 4 },
    { cycleHours: 36 },
  ]);
  assert.equal(stats.n, 5);
  assert.equal(stats.medianHours, 10);
  assert.equal(stats.p90Hours, 36);
});

test('percentImprovement returns null on invalid baseline and percent otherwise', () => {
  assert.equal(percentImprovement(null, 10), null);
  assert.equal(percentImprovement(0, 10), null);
  assert.equal(Math.round((percentImprovement(20, 10) || 0) * 100) / 100, 50);
});
