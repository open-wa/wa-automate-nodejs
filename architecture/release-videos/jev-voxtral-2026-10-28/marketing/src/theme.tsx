import React from 'react';
import {AbsoluteFill} from 'remotion';
export const GREEN='#adffd6', WHITE='#f5f7f7', MUTED='#8b9692';
export const Background:React.FC<{t:number}> = ({t}) => <AbsoluteFill style={{background:'#030605',overflow:'hidden'}}>
  <div style={{position:'absolute',left:-150,top:120,width:1360,height:1050,background:'radial-gradient(ellipse at 52% 50%,#1e42342c 0%,#0c201a16 42%,transparent 72%)',transform:`rotate(${t*1.5}deg)`}}/>
  <div style={{position:'absolute',left:590,top:-360,width:1000,height:1350,opacity:0.34,background:'linear-gradient(108deg,transparent 40%,#90ffcb13 49%,#aaffd02b 50%,transparent 51%)',transform:`translateX(${Math.sin(t*0.33)*90}px) rotate(-14deg)`}}/>
  <svg width="1080" height="1350" style={{position:'absolute',opacity:0.32}}>
    <defs><radialGradient id="vignette"><stop offset="0" stopColor="#0a110e" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity="0.72"/></radialGradient></defs>
    <rect width="1080" height="1350" fill="url(#vignette)"/>
    {[0,1,2,3,4,5].map(i => <circle key={i} cx={117+i*179} cy={205+(i*239)%830} r={1.5} fill="#d3ffe8" opacity={0.3+Math.sin(t*0.8+i)*0.15}/>)}
  </svg>
</AbsoluteFill>;

export const Header = () => <div style={{position:'absolute',left:72,right:72,top:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
  <div style={{fontSize:44,fontWeight:650,letterSpacing:-2.7,color:WHITE}}>open-wa</div>
  <div style={{color:GREEN,fontSize:30,fontWeight:500,letterSpacing:-0.7,whiteSpace:'nowrap'}}>https://openwa.dev</div>
</div>;

