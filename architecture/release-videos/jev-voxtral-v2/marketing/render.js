import {spawnSync} from 'node:child_process';
import {mkdirSync,renameSync} from 'node:fs';
const common=[`--browser-executable=${process.env.REMOTION_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}`];
function run(cmd,args){const r=spawnSync(cmd,args,{stdio:'inherit'});if(r.status)process.exit(r.status);}
mkdirSync('exports',{recursive:true});run('node',['sound.js']);
for(const film of ['voxtral','jev']){
run('node',['node_modules/@remotion/cli/remotion-cli.js','render','src/index.tsx',film,`exports/openwa-${film}-v2.mp4`,'--codec=h264','--crf=16','--concurrency=3',...common]);
run('node',['node_modules/@remotion/cli/remotion-cli.js','still','src/index.tsx',`${film}Poster`,`exports/openwa-${film}-v2-poster.png`,...common]);
run('node',['brand.js',film]);
run('ffmpeg',['-y','-v','error','-i',`exports/openwa-${film}-v2.mp4`,'-vf','fps=12,scale=960:540:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4','-loop','0',`exports/openwa-${film}-v2.gif`]);}
