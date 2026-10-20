import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
const require=createRequire(import.meta.url);
const Module=require('node:module');
const {DatabaseSync}=require('node:sqlite');
const temp=mkdtempSync(path.join(tmpdir(),'time-footprint-sqlite-'));
// Exercise the actual persistence repository SQL against real SQLite via Node's
// built-in SQLite implementation when better-sqlite3 cannot be installed.
class SQLiteShim {
 constructor(file){this.db=new DatabaseSync(file)}
 pragma(s){this.db.exec('PRAGMA '+s)}
 exec(s){this.db.exec(s)}
 prepare(s){return this.db.prepare(s)}
}
const original=Module._load;
Module._load=function(name,parent,isMain){
 if(name==='electron')return {app:{getPath:()=>temp}};
 if(name==='better-sqlite3')return SQLiteShim;
 return original.apply(this,arguments);
};
const repository=require('../electron/db.cjs');
Module._load=original;
const domain=require('../electron/domain.cjs');
test('real SQLite: timer lifecycle persists, pause history survives notes edit and restart',()=>{
 try{
  repository.init();
  const started=repository.start({type:'focus',title:'项目方案',noteBefore:'梳理目标'});
  assert.equal(repository.list().length,1);
  assert.throws(()=>repository.start({type:'work'}),/进行中/);
  repository.act(started.id,'pause');
  repository.act(started.id,'resume');
  repository.act(started.id,'stop');
  const before=repository.get(started.id);
  assert.equal(before.pauses.length,1);
  const updated=repository.edit(started.id,{noteAfter:'完成方案'});
  assert.equal(updated.noteAfter,'完成方案');
  assert.deepEqual(updated.pauses,before.pauses);
  assert.equal(domain.activeMillis(updated),domain.activeMillis(before));
  // Simulate app process reopening the same persisted SQLite store.
  repository.init();
  const recovered=repository.get(started.id);
  assert.equal(recovered.noteAfter,'完成方案');
  assert.equal(recovered.status,'completed');
  assert.deepEqual(recovered.pauses,before.pauses);
  assert.equal(repository.remove(started.id),true);
  assert.equal(repository.list().length,0);
 } finally { /* the test runner cleans the temp directory after close */ }
});
test('real SQLite: manually backfilled activities are persisted and invalid ranges rejected',()=>{
 const earlier=Date.now()-600000;const later=Date.now()-300000;
 assert.throws(()=>repository.createManual({type:'reading',startAt:later,endAt:earlier}));
 const s=repository.createManual({type:'reading',title:'午后阅读',noteAfter:'读了几页',startAt:earlier,endAt:later});
 assert.equal(s.source,'manual');assert.equal(s.status,'completed');
 assert.equal(repository.get(s.id).noteAfter,'读了几页');
 assert.throws(()=>repository.edit(s.id,{status:'running'}),/Unsupported/);
 assert.equal(repository.remove(s.id),true);
});
process.on('exit',()=>{try{rmSync(temp,{recursive:true,force:true})}catch{}});
