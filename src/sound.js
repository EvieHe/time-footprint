// Original, procedurally generated nature-like sound beds. No third-party media assets.
export const soundscapes = [
  {id:'rain', name:'细雨', subtitle:'Rainfall'},
  {id:'ocean', name:'海浪', subtitle:'Ocean'},
  {id:'wind', name:'山风', subtitle:'Wind'}
];
export class AmbientAudio {
  constructor(){this.ctx=null;this.channels=new Map()}
  async init(){if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)()} if(this.ctx.state==='suspended')await this.ctx.resume()}
  async volume(id,value){
    if(!Number.isFinite(value)||value<0||value>1)throw new RangeError('Volume must be between 0 and 1');
    if(!this.ctx&&value===0)return;
    await this.init();let channel=this.channels.get(id);
    if(!channel&&value>0){channel=this.create(id);this.channels.set(id,channel)}
    if(channel){channel.gain.gain.setTargetAtTime(value*.34,this.ctx.currentTime,.35)}
  }
  create(id){const ctx=this.ctx;const duration=12;const len=ctx.sampleRate*duration;const buffer=ctx.createBuffer(1,len,ctx.sampleRate);const data=buffer.getChannelData(0);let last=0;
    for(let i=0;i<len;i++){const white=Math.random()*2-1;last=(last+.025*white)/1.025;const t=i/ctx.sampleRate;
      if(id==='rain')data[i]=white*.32+last*.65;
      else if(id==='ocean')data[i]=last*(.35+.65*Math.pow(Math.sin(t*.24*Math.PI),2))*3.2;
      else data[i]=last*(.45+.3*Math.sin(t*.18))*2.0;
    }
    const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
    const filter=ctx.createBiquadFilter();filter.type=id==='rain'?'lowpass':'lowpass';filter.frequency.value=id==='rain'?3200:id==='ocean'?500:950;
    const gain=ctx.createGain();gain.gain.value=0;source.connect(filter).connect(gain).connect(ctx.destination);source.start();return {source,filter,gain};
  }
  async fadeOut(){if(!this.ctx)return;for(const c of this.channels.values())c.gain.gain.setTargetAtTime(0,this.ctx.currentTime,.3)}
  async dispose(){for(const c of this.channels.values()){c.source.stop();c.source.disconnect()}this.channels.clear();if(this.ctx){await this.ctx.close();this.ctx=null}}
}
