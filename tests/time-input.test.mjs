import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateTimeLocal, resolveTimeRange } from '../src/timeInput.js';

test('editing a 40-second completed session preserves its exact timestamps', () => {
  const startAt = new Date(2026, 9, 22, 12, 35, 10, 250).getTime();
  const endAt = new Date(2026, 9, 22, 12, 35, 50, 750).getTime();
  const original = { startAt, endAt };
  const draft = { startLocal: formatDateTimeLocal(startAt), endLocal: formatDateTimeLocal(endAt) };
  assert.equal(draft.startLocal, draft.endLocal);
  assert.deepEqual(resolveTimeRange(draft, original), original);
});

test('unchanged minute inputs preserve seconds even when only the title changes', () => {
  const startAt = new Date(2026, 9, 22, 12, 35, 58).getTime();
  const endAt = new Date(2026, 9, 22, 12, 38, 1).getTime();
  const original = { startAt, endAt };
  assert.deepEqual(resolveTimeRange({
    startLocal: formatDateTimeLocal(startAt),
    endLocal: formatDateTimeLocal(endAt),
    title: '新标题',
  }, original), original);
});

test('a user changed date/time is parsed while unchanged endpoint keeps seconds', () => {
  const original = {
    startAt: new Date(2026, 9, 22, 12, 35, 10).getTime(),
    endAt: new Date(2026, 9, 22, 12, 35, 50).getTime(),
  };
  const range = resolveTimeRange({
    startLocal: '2026-10-22T12:34',
    endLocal: formatDateTimeLocal(original.endAt),
  }, original);
  assert.equal(range.startAt, new Date(2026, 9, 22, 12, 34).getTime());
  assert.equal(range.endAt, original.endAt);
});

test('invalid or reversed time ranges get actionable inline errors', () => {
  const invalid = [
    { startLocal: '2026-10-22T12:40', endLocal: '2026-10-22T12:35' },
    { startLocal: '2026-10-22T12:35', endLocal: '2026-10-22T12:35' },
    { startLocal: '', endLocal: '2026-10-22T12:35' },
    { startLocal: '2026-02-30T12:35', endLocal: '2026-03-01T12:35' },
  ];
  for (const x of invalid) assert.match(resolveTimeRange(x).error, /时间/);
});

test('cross-midnight manual session is valid', () => {
  const startLocal = '2026-10-22T23:50';
  const endLocal = '2026-10-23T00:20';
  const result = resolveTimeRange({ startLocal, endLocal });
  assert.ok(result.endAt > result.startAt);
  assert.equal(result.endAt - result.startAt, 30 * 60000);
});
