import test from 'node:test';
import assert from 'node:assert/strict';
import {AmbientAudio,soundscapes} from '../src/sound.js';

class FakeAudioContext {
  constructor(){this.state='running';this.sampleRate=1000;this.currentTime=0;this.closed=false;}
  createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)}}
  createBufferSource(){return {connect(){return this},start(){this.started=true},stop(){this.stopped=true},disconnect(){}}}
  createBiquadFilter(){return {frequency:{value:0},connect(){return this}}}
  createGain(){return {gain:{value:0,setTargetAtTime(v){this.value=v}},connect(){return this}}}
  get destination(){return {}}
  async close(){this.closed=true;this.state='closed'}
}
globalThis.window={AudioContext:FakeAudioContext};

test('ambient sounds use original synthesized channels',()=>{
  assert.deepEqual(soundscapes.map(x=>x.id),['rain','ocean','wind']);
});
test('audio starts only upon user volume interaction and fades',async()=>{
  const audio=new AmbientAudio();
  await audio.volume('rain',.5);
  assert.ok(audio.channels.has('rain'));
  assert.equal(audio.channels.get('rain').gain.gain.value,.17);
  await audio.volume('ocean',.6);
  assert.equal(audio.channels.size,2);
  await audio.fadeOut();
  assert.equal(audio.channels.get('rain').gain.gain.value,0);
  await audio.dispose();
  assert.equal(audio.channels.size,0);
  assert.equal(audio.ctx,null);
});
test('invalid volume is rejected and silent default does not create context',async()=>{
  const audio=new AmbientAudio();
  await audio.volume('rain',0);
  assert.equal(audio.ctx,null);
  await assert.rejects(audio.volume('rain',2),RangeError);
  await assert.rejects(audio.volume('wind',NaN),RangeError);
});
