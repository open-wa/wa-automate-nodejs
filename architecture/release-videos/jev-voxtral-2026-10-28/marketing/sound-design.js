import {readFileSync, writeFileSync} from 'node:fs';
const story=JSON.parse(readFileSync(new URL('./src/chapters.json',import.meta.url),'utf8'));
const requested=process.argv[2]??'all';
for(const film of requested==='all'?['voxtral','jev']:[requested]){
  if(!story[film])throw new Error('Choose voxtral, jev or all.');
  let duration=0;const boundaries=[];
  for(const chapter of story[film]){boundaries.push(duration);duration+=chapter.duration;}
  const rate=48000,frames=rate*duration,pcm=Buffer.alloc(frames*4);
  let seed=film==='voxtral'?87211:57319,left=0,right=0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;};
  const smooth=x=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v);};
  for(let i=0;i<frames;i++){
    const t=i/rate,fade=smooth(t/1.7)*(1-smooth((t-duration+2.3)/2.3));
    const pad=(Math.sin(2*Math.PI*55*t)*.018+Math.sin(2*Math.PI*110*t)*.011+Math.sin(2*Math.PI*164.8138*t)*.008+Math.sin(2*Math.PI*220*t)*.006)*fade;
    let swell=0,bell=0;
    for(let j=0;j<boundaries.length;j++){
      const d=t-boundaries[j];
      if(d>0&&d<1.3)swell+=Math.sin(Math.PI*d/1.3)**2*.06;
      const b=d-.45,freq=[440,554.365,659.255,880][j%4];
      if(b>=0&&b<3)bell+=(Math.sin(2*Math.PI*freq*b)*.037+Math.sin(2*Math.PI*freq*2.003*b)*.005)*smooth(b/.017)*Math.exp(-b*1.9);
    }
    left+=.025*(random()-left);right+=.025*(random()-right);
    const values=[pad+bell+left*swell+Math.sin(2*Math.PI*329.628*t)*.002*fade,pad+bell+right*swell+Math.sin(2*Math.PI*330.33*t)*.002*fade];
    for(let channel=0;channel<2;channel++)pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,values[channel]*3))*32767),i*4+channel*2);
  }
  const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
  writeFileSync(new URL(`./public/${film}-sound.wav`,import.meta.url),Buffer.concat([header,pcm]));
  console.log(`${film}: ${duration}s original procedural soundtrack.`);
}
