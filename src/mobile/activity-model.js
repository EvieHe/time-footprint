// Shared semantics with the desktop activity repository. All timestamps are epoch milliseconds.
export const ACTIVITY_TYPES = ['focus', 'meditation', 'reading', 'work', 'custom'];
const TITLES = { focus: '专注', meditation: '冥想', reading: '阅读', work: '工作', custom: '其他' };
export function assertType(type) { if (!ACTIVITY_TYPES.includes(type)) throw new Error('Invalid activity type'); }
export function assertTimestamp(value) { if (!Number.isFinite(value) || value < 0) throw new Error('Invalid timestamp'); }
export function validateManual(item) {
  assertType(item.type); assertTimestamp(item.startAt); assertTimestamp(item.endAt);
  if (item.endAt <= item.startAt) throw new Error('结束时间必须晚于开始时间');
}
export function newSession(args, now, id) {
  if (!args || typeof args !== 'object') throw new Error('Missing activity');
  assertType(args.type); assertTimestamp(now);
  const targetMinutes = Number(args.targetMinutes ?? 0);
  if (!Number.isInteger(targetMinutes) || targetMinutes < 0 || targetMinutes > 720) throw new Error('Invalid duration');
  return {
    id, type: args.type, title: String(args.title || '').trim() || TITLES[args.type],
    noteBefore: String(args.noteBefore || ''), noteAfter: '', targetMinutes,
    startAt: now, endAt: null, status: 'running', source: args.source || 'timer', pauses: [],
  };
}
export function moveSession(session, action, now) {
  assertTimestamp(now);
  if (now < session.startAt) throw new Error('Invalid action time');
  const next = { ...session, pauses: session.pauses.map(p => ({ ...p })) };
  if (action === 'pause' && next.status === 'running') {
    next.pauses.push({ startAt: now, endAt: null }); next.status = 'paused';
  } else if (action === 'resume' && next.status === 'paused') {
    next.pauses.at(-1).endAt = now; next.status = 'running';
  } else if (action === 'stop' && next.status !== 'completed') {
    if (next.status === 'paused') next.pauses.at(-1).endAt = now;
    next.endAt = now; next.status = 'completed';
  } else throw new Error('Invalid activity transition');
  return next;
}
export function activityDuration(session, now) {
  const end = session.endAt ?? now;
  return Math.max(0, end - session.startAt - session.pauses.reduce((sum, p) =>
    sum + Math.max(0, Math.min(end, p.endAt ?? end) - p.startAt), 0));
}
export function updateSession(session, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Invalid update');
  const allowed = ['type', 'title', 'noteBefore', 'noteAfter', 'startAt', 'endAt', 'targetMinutes'];
  if (Object.keys(patch).some(key => !allowed.includes(key))) throw new Error('Unsupported update field');
  if (Object.hasOwn(patch, 'type')) assertType(patch.type);
  for (const key of ['title', 'noteBefore', 'noteAfter']) {
    if (Object.hasOwn(patch, key) && typeof patch[key] !== 'string') throw new Error('Invalid text field');
  }
  if (Object.hasOwn(patch, 'targetMinutes') && (!Number.isInteger(patch.targetMinutes) || patch.targetMinutes < 0 || patch.targetMinutes > 720)) throw new Error('Invalid duration');
  const timeEdited = ['startAt', 'endAt'].some(key => Object.hasOwn(patch, key) && patch[key] !== session[key]);
  if (timeEdited && session.status !== 'completed') throw new Error('先结束活动，再调整时间');
  const next = { ...session, ...patch, pauses: session.pauses.map(p => ({ ...p })) };
  if (next.endAt !== null) {
    validateManual(next); next.status = 'completed';
    if (timeEdited) next.pauses = [];
  }
  return next;
}
