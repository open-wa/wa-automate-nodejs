import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const cwd=fileURLToPath(new URL('./',import.meta.url));
const films=process.argv[2]==='all'||!process.argv[2]?['voxtral','jev']:[process.argv[2]];
const status=process.argv.includes('--released')?'released':'preview';
const postersOnly=process.argv.includes('--posters');
const chrome=process.env.REMOTION_CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const cli='node_modules/@remotion/cli/remotion-cli.js';
const story=JSON.parse(readFileSync(new URL('./src/chapters.json',import.meta.url),'utf8'));
mkdirSync(new URL('./exports/',import.meta.url),{recursive:true});
function run(command,args){const r=spawnSync(command,args,{cwd,stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw new Error(`${command} failed (${r.status}).`);}
for(const film of films){
  if(!story[film])throw new Error('Choose voxtral, jev or all.');
  const title=film==='voxtral'?'Voxtral':'Jev',name=`openwa-${film}-${status==='preview'?'preview':'launch'}`;
  const props=JSON.stringify({film,releaseStatus:status});
  const common=[`--props=${props}`,`--browser-executable=${chrome}`];
  if(!postersOnly){run('node',['sound-design.js',film]);run('node',[cli,'render','src/index.tsx',`${title}Video`,`exports/${name}.mp4`,'--codec=h264','--crf=16','--pixel-format=yuv420p','--concurrency=3',...common]);}
  run('node',[cli,'still','src/index.tsx',`${title}Poster`,`exports/${name}-poster.png`,...common]);
  if(!postersOnly)run('ffmpeg',['-y','-v','error','-i',`exports/${name}.mp4`,'-vf','fps=15,scale=648:810:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=160:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle','-loop','0',`exports/${name}.gif`]);
  writeFileSync(new URL(`./exports/${name}-render.json`,import.meta.url),JSON.stringify({film,status,width:1080,height:1350,fps:30,durationSeconds:story[film].reduce((s,c)=>s+c.duration,0),sound:'Original procedural pad, swells and chimes; no sampled music or narration.',renderedAt:new Date().toISOString()},null,2));
}
