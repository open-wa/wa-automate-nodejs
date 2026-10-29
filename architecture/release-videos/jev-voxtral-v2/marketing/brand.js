import {spawnSync} from 'node:child_process';
import {renameSync} from 'node:fs';
function run(cmd,args){const r=spawnSync(cmd,args,{stdio:'inherit'});if(r.status)process.exit(r.status);}
// Flatten the already-rendered brand rails, avoiding stale cached Chrome layers.
for(const film of process.argv.slice(2)){
 const top=`public/${film}-rail-top.png`,bottom=`public/${film}-rail-bottom.png`;
 for(const [path,crop] of [[top,'1920:130:0:0'],[bottom,'1920:70:0:1010']])run('ffmpeg',['-y','-v','error','-i',`exports/openwa-${film}-v2-poster.png`,'-vf',`crop=${crop}`,'-frames:v','1',path]);
 const stem=`exports/openwa-${film}-v2`;
 run('ffmpeg',['-y','-v','error','-i',`${stem}.mp4`,'-i',top,'-i',bottom,'-filter_complex','[0:v]trim=start=0.4,setpts=PTS-STARTPTS,tpad=start_duration=0.4:start_mode=clone[c];[c][1:v]overlay=0:0[h];[h][2:v]overlay=0:1010','-c:v','libx264','-crf','16','-preset','fast','-threads','2','-c:a','copy',`${stem}-branded.mp4`]);renameSync(`${stem}-branded.mp4`,`${stem}.mp4`);
}
