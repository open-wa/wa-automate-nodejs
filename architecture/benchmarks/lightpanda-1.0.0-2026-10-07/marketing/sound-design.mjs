import {writeFileSync} from 'node:fs';

// Original procedural sound design: a quiet harmonic bed, airy transition
// swells, and a restrained resolved chime. No sampled music or third-party audio.
const sampleRate=48000, duration=32, frames=sampleRate*duration;
const samples=new Float32Array(frames*2);
let seed=87211, leftLow=0, rightLow=0;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296*2-1;};
const smooth=(x)=>Math.max(0,Math.min(1,x))**2*(3-2*Math.max(0,Math.min(1,x)));
for(let i=0;i<frames;i++) {
  const t=i/sampleRate;
  const fade=smooth(t/1.7)*(1-smooth((t-29.7)/2.3));
  const pad=(Math.sin(2*Math.PI*55*t)*0.018+Math.sin(2*Math.PI*110*t)*0.011+Math.sin(2*Math.PI*164.8138*t)*0.008+Math.sin(2*Math.PI*220*t)*0.006)*fade;
  let swell=0;
  for(const start of [0.3,3.7,8.7,13.65,19.4]) {const d=t-start; if(d>0&&d<1.55)swell+=Math.sin(Math.PI*d/1.55)**2*0.075;}
  let bell=0;
  for(const [start,freq] of [[1.1,440],[4.12,554.365],[9.17,659.255],[14.35,880],[14.58,1108.73],[20.4,659.255],[20.63,880]]) {
    const d=t-start;
    if(d>=0&&d<3.9)bell+=(Math.sin(2*Math.PI*freq*d)*0.042+Math.sin(2*Math.PI*freq*2.003*d)*0.005)*smooth(d/0.017)*Math.exp(-d*1.9);
  }
  const nl=random(), nr=random();
  leftLow+=0.025*(nl-leftLow); rightLow+=0.025*(nr-rightLow);
  samples[i*2]=pad+bell+leftLow*swell+Math.sin(2*Math.PI*329.628*t)*0.002*fade;
  samples[i*2+1]=pad+bell+rightLow*swell+Math.sin(2*Math.PI*330.33*t)*0.002*fade;
}
const header=Buffer.alloc(44);
header.write('RIFF',0);header.writeUInt32LE(36+frames*4,4);header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);header.writeUInt32LE(sampleRate,24);header.writeUInt32LE(sampleRate*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(frames*4,40);
const pcm=Buffer.alloc(frames*4);
for(let i=0;i<samples.length;i++)pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]*3))*32767),i*2);
writeFileSync(new URL('./public/launch-sound.wav',import.meta.url),Buffer.concat([header,pcm]));
