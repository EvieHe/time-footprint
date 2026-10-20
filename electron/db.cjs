const path=require('node:path'); const {app}=require('electron');const SQLite=require('better-sqlite3');const domain=require('./domain.cjs');
let db;
function init(){db=new SQLite(path.join(app.getPath('userData'),'time-footprint.sqlite'));db.pragma('journal_mode = WAL');db.exec(`CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,type TEXT NOT NULL,title TEXT NOT NULL,noteBefore TEXT NOT NULL DEFAULT '',noteAfter TEXT NOT NULL DEFAULT '',startAt INTEGER NOT NULL,endAt INTEGER,status TEXT NOT NULL,source TEXT NOT NULL,pauses TEXT NOT NULL DEFAULT '[]',createdAt INTEGER NOT NULL,updatedAt INTEGER NOT NULL);CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(startAt);`)}
function hydrate(x){return x?{...x,pauses:JSON.parse(x.pauses)}:null}
function get(id){return hydrate(db.prepare('SELECT * FROM sessions WHERE id=?').get(id))}
function list(){return db.prepare('SELECT * FROM sessions ORDER BY startAt DESC').all().map(hydrate)}
function active(){return db.prepare("SELECT * FROM sessions WHERE status!='completed' ORDER BY startAt DESC LIMIT 1").get()}
function save(s){const now=Date.now();db.prepare(`INSERT INTO sessions(id,type,title,noteBefore,noteAfter,startAt,endAt,status,source,pauses,createdAt,updatedAt) VALUES(@id,@type,@title,@noteBefore,@noteAfter,@startAt,@endAt,@status,@source,@pauses,@createdAt,@updatedAt) ON CONFLICT(id) DO UPDATE SET type=excluded.type,title=excluded.title,noteBefore=excluded.noteBefore,noteAfter=excluded.noteAfter,startAt=excluded.startAt,endAt=excluded.endAt,status=excluded.status,source=excluded.source,pauses=excluded.pauses,updatedAt=excluded.updatedAt`).run({...s,pauses:JSON.stringify(s.pauses||[]),createdAt:now,updatedAt:now});return get(s.id)}
function start(args){if(active())throw Error('已有进行中活动，请先结束');return save(domain.makeSession(args))}
function act(id,action){const s=get(id);if(!s)throw Error('Record not found');return save(domain.transition(s,action))}
function edit(id,patch){
  const s=get(id);if(!s)throw Error('Record not found');
  if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('Invalid update');
  const allowed=['title','type','noteBefore','noteAfter','startAt','endAt'];
  if(Object.keys(patch).some(k=>!allowed.includes(k)))throw Error('Unsupported update field');
  for(const k of ['title','noteBefore','noteAfter'])if(Object.hasOwn(patch,k)&&typeof patch[k]!=='string')throw Error('Invalid text field');
  if(Object.hasOwn(patch,'type'))domain.assertType(patch.type);
  if(Object.hasOwn(patch,'startAt'))domain.assertTime(patch.startAt);
  if(Object.hasOwn(patch,'endAt'))domain.assertTime(patch.endAt);
  const changedTime=['startAt','endAt'].some(k=>Object.hasOwn(patch,k)&&patch[k]!==s[k]);
  if(changedTime&&s.status!=='completed')throw Error('Finish the activity before editing its time');
  Object.assign(s,patch);
  if(s.endAt!==null){domain.validateManual(s);s.status='completed';if(changedTime){s.pauses=[]}};
  return save(s)
}
function createManual(args){domain.validateManual(args);return save({...domain.makeSession({...args,now:args.startAt,source:'manual'}),endAt:args.endAt,status:'completed',noteAfter:args.noteAfter||''})}
function remove(id){return db.prepare('DELETE FROM sessions WHERE id=?').run(id).changes>0}
module.exports={init,list,start,act,edit,createManual,remove,get};
