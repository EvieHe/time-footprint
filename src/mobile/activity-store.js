import { assertType, newSession, moveSession, updateSession, validateManual } from './activity-model.js';

const SCHEMA = `CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL,
 noteBefore TEXT NOT NULL DEFAULT '', noteAfter TEXT NOT NULL DEFAULT '',
 startAt INTEGER NOT NULL, endAt INTEGER, status TEXT NOT NULL, source TEXT NOT NULL,
 pauses TEXT NOT NULL DEFAULT '[]', createdAt INTEGER NOT NULL,
 updatedAt INTEGER NOT NULL, targetMinutes INTEGER NOT NULL DEFAULT 0
); CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(startAt);`;
const COLS = ['id', 'type', 'title', 'noteBefore', 'noteAfter', 'startAt', 'endAt', 'status', 'source', 'pauses', 'createdAt', 'updatedAt', 'targetMinutes'];
const INSERT = `INSERT INTO sessions(${COLS.join(',')}) VALUES(${COLS.map(() => '?').join(',')})
 ON CONFLICT(id) DO UPDATE SET ${COLS.filter(k => !['id', 'createdAt'].includes(k)).map(k => `${k}=excluded.${k}`).join(',')}`;
const hydration = row => row ? ({ ...row, pauses: JSON.parse(row.pauses || '[]') }) : null;

/** DB contract: execute(sql), run(sql, values), query(sql, values) -> {values:[...]}. */
export function createActivityStore(db, { clock = Date.now, uuid = () => crypto.randomUUID() } = {}) {
  let queue = Promise.resolve();
  const serial = fn => { const result = queue.then(fn); queue = result.catch(() => {}); return result; };
  const query = async (sql, params = []) => (await db.query(sql, params)).values || [];
  const get = async id => hydration((await query('SELECT * FROM sessions WHERE id = ?', [id]))[0]);
  const list = async () => (await query('SELECT * FROM sessions ORDER BY startAt DESC')).map(hydration);
  const getActive = async () => hydration((await query("SELECT * FROM sessions WHERE status != 'completed' ORDER BY startAt DESC LIMIT 1"))[0]);
  const save = async session => {
    const now = clock();
    await db.run(INSERT, COLS.map(key => key === 'pauses' ? JSON.stringify(session.pauses) :
      key === 'createdAt' ? (session.createdAt || now) :
      key === 'updatedAt' ? now :
      key === 'targetMinutes' ? (session.targetMinutes || 0) : session[key]));
    return get(session.id);
  };
  return {
    async init() {
      await db.execute(SCHEMA);
      const columns = await query('PRAGMA table_info(sessions)');
      if (!columns.some(c => c.name === 'targetMinutes')) await db.execute('ALTER TABLE sessions ADD COLUMN targetMinutes INTEGER NOT NULL DEFAULT 0');
    },
    list,
    start: args => serial(async () => {
      if (await getActive()) throw new Error('请先结束当前活动');
      return save(newSession(args, clock(), uuid()));
    }),
    act: (id, action) => serial(async () => {
      const item = await get(id);
      if (!item) throw new Error('未找到活动记录');
      return save(moveSession(item, action, clock()));
    }),
    edit: (id, patch) => serial(async () => {
      const item = await get(id);
      if (!item) throw new Error('未找到活动记录');
      return save(updateSession(item, patch));
    }),
    createManual: args => serial(async () => {
      validateManual(args);
      const item = newSession({ ...args, source: 'manual' }, args.startAt, uuid());
      item.endAt = args.endAt; item.status = 'completed';
      item.noteAfter = String(args.noteAfter || '');
      return save(item);
    }),
    remove: id => serial(async () => {
      const item = await get(id);
      if (!item) return false;
      await db.run('DELETE FROM sessions WHERE id = ?', [id]);
      return true;
    }),
  };
}
