import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {makeSession,transition,activeMillis,splitByLocalDay,validateManual}=require('../electron/domain.cjs');
test('start → stop captures actual timestamps',()=>{let s=makeSession({type:'focus',now:1000000});s=transition(s,'stop',1060000);assert.equal(s.status,'completed');assert.equal(activeMillis(s),60000)});
test('pause interval excluded from focus duration',()=>{let s=makeSession({type:'focus',now:1000000});s=transition(s,'pause',1060000);s=transition(s,'resume',1120000);s=transition(s,'stop',1180000);assert.equal(activeMillis(s),120000);assert.equal(s.pauses.length,1)});
test('cross-midnight session projects to two local dates',()=>{let a=new Date(2026,9,20,23,50).getTime();let b=new Date(2026,9,21,0,15).getTime();let s=makeSession({type:'meditation',now:a});s=transition(s,'stop',b);let segments=splitByLocalDay(s);assert.equal(segments.length,2);assert.equal(segments[0].segmentEnd,segments[1].segmentStart)});
test('running session can recover accurate duration from stored timestamp',()=>{let s=makeSession({type:'work',now:1000000});let restored=JSON.parse(JSON.stringify(s));assert.equal(activeMillis(restored,1120000),120000);assert.equal(restored.status,'running')});
test('manual record rejects reversed times',()=>{assert.throws(()=>validateManual({type:'focus',startAt:2000000,endAt:1000000}));assert.doesNotThrow(()=>validateManual({type:'focus',startAt:1000000,endAt:2000000}))});
test('paused time remains paused after a completed session is serialized',()=>{
 let s=makeSession({type:'focus',now:1000000});s=transition(s,'pause',1060000);s=transition(s,'stop',1120000);
 const after=JSON.parse(JSON.stringify({...s,noteAfter:'写完技术方案'}));
 assert.equal(after.pauses.length,1);assert.equal(activeMillis(after),60000);
});
test('invalid state transitions fail instead of silently corrupting activity',()=>{
 let s=makeSession({type:'focus',now:1000000});assert.throws(()=>transition(s,'resume',1001000));
 s=transition(s,'stop',1003000);assert.throws(()=>transition(s,'pause',1004000));
});
