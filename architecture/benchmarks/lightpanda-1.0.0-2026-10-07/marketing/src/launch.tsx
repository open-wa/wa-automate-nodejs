import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Audio} from '@remotion/media';
import {metrics} from './metrics';

loadFont({family:'Inter', url:staticFile('Inter.ttf'), weight:'100 900'});

const GREEN = '#adffd6';
const WHITE = '#f5f7f7';
const MUTED = '#8b9692';
const CTA_COMMAND = 'npx @open-wa/wa-automate --lightpanda';
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamped = {extrapolateLeft:'clamp', extrapolateRight:'clamp'} as const;
const progress = (time:number, start:number, end:number) => interpolate(time,[start,end],[0,1],{...clamped,easing:ease});
const alpha = (time:number, start:number, end:number) => Math.min(progress(time,start,start+0.65), 1-progress(time,end-0.5,end));
const formatMemory = (value:number) => value.toFixed(1);

const Reveal:React.FC<{t:number;start:number;children:React.ReactNode;style?:React.CSSProperties}> = ({t,start,children,style}) => {
  const p = progress(t,start,start+0.9);
  return <div style={{opacity:p,transform:`translateY(${(1-p)*48}px)`,...style}}>{children}</div>;
};

const Background:React.FC<{t:number}> = ({t}) => <AbsoluteFill style={{background:'#030605',overflow:'hidden'}}>
  <div style={{position:'absolute',left:-150,top:120,width:1360,height:1050,background:'radial-gradient(ellipse at 52% 50%,#1e42342c 0%,#0c201a16 42%,transparent 72%)',transform:`rotate(${t*1.5}deg)`}}/>
  <div style={{position:'absolute',left:590,top:-360,width:1000,height:1350,opacity:0.34,background:'linear-gradient(108deg,transparent 40%,#90ffcb13 49%,#aaffd02b 50%,transparent 51%)',transform:`translateX(${Math.sin(t*0.33)*90}px) rotate(-14deg)`}}/>
  <svg width="1080" height="1350" style={{position:'absolute',opacity:0.32}}>
    <defs><radialGradient id="vignette"><stop offset="0" stopColor="#0a110e" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity="0.72"/></radialGradient></defs>
    <rect width="1080" height="1350" fill="url(#vignette)"/>
    {[0,1,2,3,4,5].map(i => <circle key={i} cx={117+i*179} cy={205+(i*239)%830} r={1.5} fill="#d3ffe8" opacity={0.3+Math.sin(t*0.8+i)*0.15}/>)}
  </svg>
</AbsoluteFill>;

const Header = () => <div style={{position:'absolute',left:72,right:72,top:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
  <div style={{fontSize:44,fontWeight:650,letterSpacing:-2.7,color:WHITE}}>open-wa</div>
  <div style={{color:GREEN,fontSize:30,fontWeight:500,letterSpacing:-0.7,whiteSpace:'nowrap'}}>https://openwa.dev</div>
</div>;

const Footer = () => <div style={{position:'absolute',left:72,right:72,bottom:47,borderTop:'1px solid #233029',paddingTop:22,color:'#8d9b94',fontSize:21,lineHeight:1.65,letterSpacing:-0.3}}>
  <div>Controlled DOM benchmark · M1 Pro · Median of 5 runs</div>
  <div style={{display:'flex',justifyContent:'space-between'}}><span>Lightpanda 1.0 / Chrome 154</span><span style={{color:'#58675f'}}>07 OCT 2026</span></div>
</div>;

const Engine:React.FC<{t:number;size?:number;flat?:boolean}> = ({t,size=414,flat=false}) => {
  const angle = flat ? -8 : -10+Math.sin(t*0.45)*3;
  const shine = 25+(Math.sin(t*0.72)+1)*27;
  return <div style={{width:size,height:size,position:'relative',transform:`perspective(1300px) rotateX(${flat?16:30}deg) rotateZ(${angle}deg)`,transformStyle:'preserve-3d'}}>
    <div style={{position:'absolute',inset:-85,background:'radial-gradient(ellipse,#88ffc31b 0%,transparent 64%)'}}/>
    <div style={{position:'absolute',inset:0,borderRadius:52,transform:'translateY(18px)',background:'linear-gradient(135deg,#4e6258,#121c17 40%,#486352 73%,#16251d)',boxShadow:'0 48px 70px #000b'}}/>
    <div style={{position:'absolute',inset:0,borderRadius:50,padding:3,background:`linear-gradient(${shine+80}deg,#495a51,#c2d3c7 27%,#37483c 44%,#819787 75%,#223b2b)`}}>
      <div style={{position:'absolute',inset:3,borderRadius:47,background:`linear-gradient(${shine+110}deg,#314038,#101713 35%,#202e24 63%,#111b15)`,border:'1px solid #6c857259'}}>
        <div style={{position:'absolute',inset:17,border:'1px solid #a9c4b228',borderRadius:32}}/>
        <div style={{position:'absolute',inset:25,border:'1px solid #738d7b26',borderRadius:27}}/>
        {[0,1,2,3].map(side=><div key={side} style={{position:'absolute',left:side===3?-8:side===1?'auto':42,right:side===1?-8:undefined,top:side===0?-8:side===2?'auto':42,bottom:side===2?-8:undefined,width:side%2?8:size-84,height:side%2?size-84:8,display:'flex',flexDirection:side%2?'column':'row',justifyContent:'space-between'}}>{Array.from({length:12},(_,i)=><div key={i} style={{height:side%2?4:8,width:side%2?8:4,background:'linear-gradient(90deg,#607065,#adc5b4,#48584d)',borderRadius:1}}/>)}</div>)}
        <div style={{position:'absolute',left:0,right:0,top:size*0.18,textAlign:'center',color:'#bfdac9',fontSize:size*0.045,letterSpacing:4,fontWeight:500}}>LIGHTPANDA</div>
        <div style={{position:'absolute',left:0,right:0,top:size*0.29,textAlign:'center',fontSize:size*0.29,fontWeight:600,letterSpacing:-size*0.025,lineHeight:1.1,color:'#dbffe8',textShadow:'0 0 25px #adffd61a'}}>1.0</div>
        <div style={{position:'absolute',left:0,right:0,bottom:size*0.18,textAlign:'center',fontSize:size*0.035,letterSpacing:2,color:'#93a99a'}}>A LIGHTER BROWSER ENGINE</div>
        <div style={{position:'absolute',inset:3,borderRadius:44,background:`linear-gradient(${shine+82}deg,transparent 33%,#ecfff014 45%,transparent 57%)`}}/>
      </div>
    </div>
  </div>;
};

const Intro:React.FC<{t:number}> = ({t}) => <AbsoluteFill style={{opacity:alpha(t,0.15,4.2),padding:'184px 72px 0'}}>
  <Reveal t={t} start={0.2} style={{color:GREEN,fontSize:23,letterSpacing:3,fontWeight:550,marginBottom:27}}>OPENWA + LIGHTPANDA</Reveal>
  <Reveal t={t} start={0.35} style={{fontSize:104,fontWeight:580,letterSpacing:-6,lineHeight:1.02,color:WHITE}}>Powerful.<br/>By being lighter.</Reveal>
  <Reveal t={t} start={0.8} style={{fontSize:33,color:'#bdcbc3',lineHeight:1.4,marginTop:28,letterSpacing:-0.8}}>OpenWA turns WhatsApp into an API for your apps.</Reveal>
  <div style={{position:'absolute',left:336,top:625,opacity:progress(t,0.7,1.5),transform:`translateY(${(1-progress(t,0.7,2))*120}px) scale(${0.88+progress(t,0.7,2)*0.12})`}}><Engine t={t}/></div>
  <div style={{position:'absolute',left:72,top:1090,right:72,textAlign:'center',fontSize:24,color:'#9cac9f',opacity:progress(t,1.65,2.3),letterSpacing:0.2}}>Upcoming experimental Lightpanda support.</div>
</AbsoluteFill>;

const Memory:React.FC<{t:number}> = ({t}) => {
  const count = metrics.memoryReduction*progress(t,4.1,5.75);
  const bar = progress(t,4.9,6.7);
  const chromeWidth = 934;
  const pandaWidth = chromeWidth*metrics.lightpandaMemory/metrics.chromeMemory;
  return <AbsoluteFill style={{opacity:alpha(t,3.85,9.2),padding:'189px 72px 0'}}>
    <Reveal t={t} start={4.02} style={{fontSize:23,color:GREEN,letterSpacing:3,fontWeight:550}}>LESS TO CARRY.</Reveal>
    <Reveal t={t} start={4.1} style={{marginTop:44,display:'flex',alignItems:'baseline',color:WHITE,fontVariantNumeric:'tabular-nums',lineHeight:1,whiteSpace:'nowrap'}}>
      <span style={{fontSize:224,fontWeight:600,letterSpacing:-14}}>{count.toFixed(1)}</span><span style={{fontSize:130,letterSpacing:-8,fontWeight:500,marginLeft:10,color:GREEN}}>%</span>
    </Reveal>
    <Reveal t={t} start={4.3} style={{fontSize:55,fontWeight:500,color:WHITE,letterSpacing:-2.2,lineHeight:1.13,marginTop:23}}>lower peak browser RSS.</Reveal>
    <Reveal t={t} start={4.65} style={{fontSize:29,color:MUTED,letterSpacing:-0.5,marginTop:22}}>Same 1,000-record workload. Far less memory.</Reveal>
    <div style={{position:'absolute',left:72,right:72,top:771,opacity:progress(t,4.8,5.5)}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:28,color:'#b2bcb6',marginBottom:18}}><span>Chrome</span><span style={{fontVariantNumeric:'tabular-nums'}}>{formatMemory(metrics.chromeMemory)} <span style={{fontSize:23,color:MUTED}}>MiB</span></span></div>
      <div style={{height:78,width:chromeWidth,borderRadius:17,border:'1px solid #49514b',background:'linear-gradient(110deg,#3f4942,#79857b 72%,#525f56)',boxShadow:'inset 0 1px 0 #dce8dc20',transform:`scaleX(${0.8+bar*0.2})`,transformOrigin:'left'}}/>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:28,color:GREEN,marginTop:51,marginBottom:18}}><span>Lightpanda</span><span style={{fontVariantNumeric:'tabular-nums'}}>{formatMemory(metrics.lightpandaMemory)} <span style={{fontSize:23,color:'#84bd9a'}}>MiB</span></span></div>
      <div style={{position:'relative',height:78,width:chromeWidth,borderRadius:17,background:'#111e17',border:'1px solid #2e4836'}}>
        <div style={{height:76,width:interpolate(bar,[0,1],[chromeWidth,pandaWidth]),borderRadius:15,background:'linear-gradient(105deg,#5dab79,#b8ffd6)',boxShadow:'0 0 36px #8dffc320,inset 0 1px 0 #f1fff780'}}/>
      </div>
      <div style={{fontSize:23,color:'#78887e',marginTop:27}}>Peak RSS summed across each browser’s processes.</div>
    </div>
  </AbsoluteFill>;
};

const Timing:React.FC<{t:number}> = ({t}) => {
  const number = 1+(Math.round(metrics.launchMultiplier)-1)*progress(t,9.2,10.75);
  const race = progress(t,10.1,11.6);
  const lineWidth = 932;
  return <AbsoluteFill style={{opacity:alpha(t,8.85,14.3),padding:'189px 72px 0'}}>
    <Reveal t={t} start={9.03} style={{fontSize:23,color:GREEN,letterSpacing:3,fontWeight:550}}>MORE HEAD START.</Reveal>
    <Reveal t={t} start={9.12} style={{marginTop:35,lineHeight:1,color:WHITE,display:'flex',alignItems:'baseline',fontVariantNumeric:'tabular-nums'}}>
      <span style={{fontSize:251,fontWeight:600,letterSpacing:-17}}>{Math.round(number)}</span><span style={{fontSize:160,fontWeight:350,color:GREEN,letterSpacing:-9,marginLeft:15}}>×</span>
    </Reveal>
    <Reveal t={t} start={9.3} style={{fontSize:55,fontWeight:500,color:WHITE,letterSpacing:-2.4,lineHeight:1.12,marginTop:19}}>faster launch<br/>to first result.</Reveal>
    <Reveal t={t} start={9.7} style={{fontSize:28,color:MUTED,letterSpacing:-0.6,marginTop:22}}>The first checked DOM extraction, from launch.</Reveal>
    <div style={{position:'absolute',left:72,right:72,top:810,opacity:progress(t,9.8,10.4)}}>
      <div style={{fontSize:26,color:'#b7c1ba',display:'flex',justifyContent:'space-between',marginBottom:17}}><span>Chrome</span><span style={{fontVariantNumeric:'tabular-nums'}}>{Math.round(metrics.chromeLaunch).toLocaleString('en-US')} ms</span></div>
      <div style={{height:17,borderRadius:20,background:'#18201b',position:'relative'}}><div style={{width:lineWidth*race,height:17,borderRadius:20,background:'linear-gradient(90deg,#39443c,#819285)'}}/></div>
      <div style={{fontSize:26,color:GREEN,display:'flex',justifyContent:'space-between',marginTop:38,marginBottom:17}}><span>Lightpanda</span><span style={{fontVariantNumeric:'tabular-nums'}}>{Math.round(metrics.lightpandaLaunch)} ms</span></div>
      <div style={{height:17,borderRadius:20,background:'#18291e',position:'relative'}}><div style={{width:lineWidth/metrics.launchMultiplier*race,height:17,borderRadius:20,background:GREEN,boxShadow:'0 0 20px #acffd655'}}/></div>
      <div style={{display:'flex',alignItems:'baseline',gap:21,borderTop:'1px solid #29392e',paddingTop:26,marginTop:47}}><span style={{fontSize:55,fontWeight:550,color:GREEN,letterSpacing:-2}}>{metrics.warmMultiplier.toFixed(1)}×</span><div style={{fontSize:26,color:'#b8c7bc',lineHeight:1.4}}>faster over 20 repeat loads<br/><span style={{fontSize:22,color:'#798b7d'}}>787 ms → 183 ms for the complete warm workload.</span></div></div>
    </div>
  </AbsoluteFill>;
};

const Tile:React.FC<{value:string;label:React.ReactNode;sub:string;green?:boolean}> = ({value,label,sub,green}) => <div style={{border:'1px solid #334439',borderRadius:30,padding:'32px 32px 28px',background:green?'linear-gradient(130deg,#18342595,#07110cb0)':'linear-gradient(130deg,#1b241ed0,#0b100de0)',height:251,boxSizing:'border-box'}}>
  <div style={{fontSize:81,fontWeight:560,letterSpacing:-5,color:green?GREEN:WHITE,lineHeight:1.06}}>{value}</div>
  <div style={{fontSize:27,letterSpacing:-0.6,color:'#dbe4dd',lineHeight:1.24,marginTop:15}}>{label}</div>
  <div style={{fontSize:20,letterSpacing:-0.25,color:'#8b9d90',marginTop:13}}>{sub}</div>
</div>;

const Finale:React.FC<{t:number;poster?:boolean}> = ({t,poster=false}) => {
  const start = poster ? -10 : 14.0;
  return <AbsoluteFill style={{opacity:poster?1:alpha(t,13.95,20),padding:'181px 72px 0'}}>
    <Reveal t={t} start={start} style={{color:GREEN,fontSize:23,letterSpacing:3,fontWeight:550,marginBottom:24}}>OPENWA + LIGHTPANDA</Reveal>
    <Reveal t={t} start={start+0.1} style={{fontSize:91,fontWeight:570,color:WHITE,lineHeight:1.03,letterSpacing:-5.7}}>Small footprint.<br/>Big head start.</Reveal>
    <div style={{position:'absolute',left:411,top:451,opacity:progress(t,start+0.3,start+1),transform:`translateY(${(1-progress(t,start+0.3,start+1.4))*35}px)`}}><Engine t={t} size={268} flat/></div>
    <Reveal t={t} start={start+0.55} style={{position:'absolute',left:72,right:72,top:794,display:'grid',gridTemplateColumns:'1fr 1fr',gap:22}}>
      <Tile value={`${metrics.memoryReduction.toFixed(1)}%`} label={<>lower peak<br/>browser RSS</>} sub="985.1 MiB → 43.7 MiB" green/>
      <Tile value={`${Math.round(metrics.launchMultiplier)}×`} label={<>faster launch<br/>to first result</>} sub="1,252 ms → 125 ms"/>
    </Reveal>
    <Reveal t={t} start={start+1.05} style={{position:'absolute',left:72,right:72,top:1090,fontSize:23,lineHeight:1.6,color:'#9aad9e',letterSpacing:-0.3}}>
      <div>1,000 records · Browser-process RSS</div>
      <div>Authenticated WhatsApp performance not measured.</div>
    </Reveal>
  </AbsoluteFill>;
};

const Onboarding:React.FC<{t:number;poster?:boolean}> = ({t,poster=false}) => {
  const start = poster ? -10 : 19.65;
  return <AbsoluteFill style={{opacity:poster?1:progress(t,start,start+0.65),padding:'179px 72px 0'}}>
    <Reveal t={t} start={start} style={{color:GREEN,fontSize:23,letterSpacing:2.3,fontWeight:550}}>COMING IN THE NEXT MINOR RELEASE</Reveal>
    <Reveal t={t} start={start+0.08} style={{fontSize:146,fontWeight:650,letterSpacing:-9,color:WHITE,lineHeight:1.1,marginTop:25}}>open-wa</Reveal>
    <Reveal t={t} start={start+0.18} style={{fontSize:43,color:GREEN,letterSpacing:-1.2,marginTop:16}}>https://openwa.dev</Reveal>
    <Reveal t={t} start={start+0.3} style={{fontSize:37,color:'#dbe4dd',lineHeight:1.4,letterSpacing:-0.8,marginTop:33}}>Turn WhatsApp into an API<br/>for your apps, bots and integrations.</Reveal>
    <Reveal t={t} start={start+0.5} style={{marginTop:41,border:'1px solid #42664f',borderRadius:25,padding:'28px 30px 32px',background:'linear-gradient(120deg,#183425b0,#08110df0)',boxShadow:'0 20px 60px #0005'}}>
      <div style={{fontSize:21,letterSpacing:1.7,color:'#aac4b3',marginBottom:23}}>AFTER RELEASE · NODE.JS 22.21.1+</div>
      <div style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',fontSize:34,fontWeight:500,letterSpacing:-1,whiteSpace:'nowrap',color:WHITE}}>{CTA_COMMAND}</div>
    </Reveal>
    <Reveal t={t} start={start+0.7} style={{marginTop:33,display:'flex',flexDirection:'column',gap:19}}>
      {[
        'Run the command in your terminal.',
        'Scan the QR in WhatsApp → Linked devices.',
        'Open /dashboard at the printed local URL.',
      ].map((step,index) => <div key={step} style={{display:'flex',alignItems:'center',gap:17,color:'#c3d1c7',fontSize:26,letterSpacing:-0.45}}>
        <span style={{width:35,height:35,borderRadius:35,border:'1px solid #42664f',color:GREEN,fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{index+1}</span>{step}
      </div>)}
    </Reveal>
    <Reveal t={t} start={start+0.9} style={{marginTop:31,fontSize:23,lineHeight:1.5,color:'#9aad9e',letterSpacing:-0.3}}>
      <div>Experimental: reload recovery is still in progress.</div>
      <div>Authenticated WhatsApp performance not measured.</div>
    </Reveal>
  </AbsoluteFill>;
};

export const LaunchFilm = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame/fps;
  return <AbsoluteFill style={{fontFamily:'Inter, sans-serif',fontFeatureSettings:'"ss01"',WebkitFontSmoothing:'antialiased'}}>
    <Audio src={staticFile('launch-sound.wav')}/>
    <Background t={t}/>
    <Intro t={t}/><Memory t={t}/><Timing t={t}/><Finale t={t}/><Onboarding t={t}/>
    <Header/><Footer/>
  </AbsoluteFill>;
};

export const Poster = () => <AbsoluteFill style={{fontFamily:'Inter, sans-serif',fontFeatureSettings:'"ss01"',WebkitFontSmoothing:'antialiased'}}>
  <Background t={25}/><Onboarding t={25} poster/><Header/><Footer/>
</AbsoluteFill>;
