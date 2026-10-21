import test from 'node:test';
import assert from 'node:assert/strict';
import { newSession, moveSession, updateSession, activityDuration, validateManual } from '../src/mobile/activity-model.js';
import { createActivityStore } from '../src/mobile/activity-store.js';
import { DatabaseSync } from 'node:sqlite';

let t = 1_000_000, count=0;
const clock=()=>t;
const raw = new DatabaseSync(':memory:');
const sqlite = {
  async execute(sql){ raw.exec(sql) },
  async run(sql,values=[]){ raw.prepare(sql).run(...values) },
  async query(sql,values=[]){ return {values:raw.prepare(sql).all(...values)} },
};
const store = createActivityStore(sqlite,{clock,uuid:()=>`session-${++count}`});
await store.init();

test('new sessions have a default title and valid target',()=>{
  const s=newSession({type:'meditation',targetMinutes:10},t,'x');
  assert.equal(s.title,'冥想'); assert.equal(s.targetMinutes,10);
  assert.throws(()=>newSession({type:'unknown'},t,'x'));
});
test('SQLite activity lifecycle, pause accounting, and persistence',async()=>{
  const a=await store.start({type:'focus',title:'设计',targetMinutes:25});
  assert.equal((await store.list()).length,1);
  await assert.rejects(store.start({type:'work'}),/结束当前活动/);
  t+=60_000; await store.act(a.id,'pause');
  t+=90_000; await store.act(a.id,'resume');
  t+=60_000; await store.act(a.id,'stop');
  const r=(await store.list())[0];
  assert.equal(r.status,'completed');assert.equal(r.pauses.length,1);
  assert.equal(activityDuration(r,t),120_000);
  const updated=await store.edit(a.id,{noteAfter:'完成布局'});
  assert.equal(updated.noteAfter,'完成布局');assert.equal(updated.pauses.length,1);
  assert.equal(activityDuration(updated,t),120_000);
});
test('manual entries, validation and delete',async()=>{
  await assert.rejects(store.createManual({type:'reading',startAt:12,endAt:11}));
  const m=await store.createManual({type:'reading',title:'读书',startAt:200,endAt:500,noteAfter:'完成'});
  assert.equal(m.status,'completed');assert.equal(m.source,'manual');
  assert.equal((await store.list()).length,2);
  await assert.rejects(store.edit(m.id,{status:'running'}));
  assert.equal(await store.remove(m.id),true);
  assert.equal((await store.list()).length,1);
});
test('reopening store retains records and active calculation uses wall clock',async()=>{
  const reopened=createActivityStore(sqlite,{clock,uuid:()=>`reopen-${++count}`});
  await reopened.init();
  assert.equal((await reopened.list())[0].noteAfter,'完成布局');
  const b=await reopened.start({type:'work'}); t+=300_000;
  assert.equal(activityDuration((await reopened.list())[0],t),300_000);
  await reopened.act(b.id,'stop');
});
test('preserves pause history when editing notes; resets if completed time changed',()=>{
  let s=newSession({type:'focus'},100,'x');s=moveSession(s,'pause',150);s=moveSession(s,'stop',190);
  assert.equal(updateSession(s,{noteAfter:'notes'}).pauses.length,1);
  assert.equal(updateSession(s,{endAt:200}).pauses.length,0);
});
