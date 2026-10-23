// A minute-precision datetime-local control must not silently truncate a recorded
// session's exact timestamps when the user only edits the title or notes.
export function formatDateTimeLocal(timestamp) {
  if (!Number.isFinite(timestamp)) return '';
  const d = new Date(timestamp);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocalTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return NaN;
  const ms = new Date(value).getTime();
  // Reject impossible dates and DST gaps that Date might otherwise normalize.
  return Number.isFinite(ms) && formatDateTimeLocal(ms) === value ? ms : NaN;
}

export function resolveTimeRange(draft, original = null) {
  if (!draft?.startLocal || !draft?.endLocal) return { error: '请选择开始和结束时间' };
  const startAt = original && draft.startLocal === formatDateTimeLocal(original.startAt)
    ? original.startAt : parseLocalTime(draft.startLocal);
  const endAt = original && draft.endLocal === formatDateTimeLocal(original.endAt)
    ? original.endAt : parseLocalTime(draft.endLocal);
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) return { error: '时间无效，请重新选择' };
  if (endAt <= startAt) return { error: '结束时间应晚于开始时间' };
  return { startAt, endAt };
}
