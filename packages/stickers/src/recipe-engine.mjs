/** Shared OpenWA-authored Canvas recipes. This factory has no imported closure:
 * browser drivers can evaluate it directly; standalone supplies its own facilities.
 */
export async function createRecipeEngine(config = {}) {
const environment = config.environment || {
 createSurface(w,h){if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);const c=document.createElement('canvas');c.width=w;c.height=h;return c;},
 async encodeSurface(c,type,quality,maxBytes){let blob;for(const factor of maxBytes?[1,.75,.5,.3,.15]:[1]){blob=c.convertToBlob?await c.convertToBlob({type,quality:quality*factor}):await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Image encoding failed')),type,quality*factor));if(blob.type!==type)throw Error(type+' encoding unavailable');if(!maxBytes||blob.size<=maxBytes)return blob;}throw Error('Encoded frame exceeds its byte budget');},
 createImageBitmap: globalThis.createImageBitmap,
 ImageDecoder: globalThis.ImageDecoder,
 ImageData: globalThis.ImageData,
 supportsColor: color=>typeof CSS!=='undefined'&&CSS.supports('color',color),
 disposeSurface(c){c.width=0;c.height=0;},
};
const ImageData=environment.ImageData;
const createImageBitmap=environment.createImageBitmap;
const CSS={supports:(_type,color)=>environment.supportsColor(color)};
let kernel;
if(config.kernelBytes){
 const bytes=new Uint8Array(config.kernelBytes), e=(await WebAssembly.instantiate(bytes)).instance.exports;
 kernel={run(name,input,w,h,p){const len=w*h*4;if(w<1||h<1||w>512||h>512||input.length!==len)throw Error('Invalid bounded kernel input');const outLen=name==='bayer'?len*4:len;let src=0,dst=0,scratch=0;try{src=e.allocate(len);dst=e.allocate(outLen);scratch=e.allocate(len);if(!src||!dst||!scratch)throw Error('Kernel capacity exceeded');new Uint8Array(e.memory.buffer,src,len).set(input);if(name==='invert'||name==='grayscale')e[name](src,dst,len);else if(name==='stereo')e.stereo(src,dst,w,h,p.offset);else if(name==='dilate'||name==='erode')e.morphology(src,dst,scratch,w,h,p.iterations,name==='dilate');else if(name==='bayer')e.bayer(src,dst,w,h);else throw Error('Unknown kernel');return {data:new Uint8ClampedArray(e.memory.buffer,dst,outLen).slice(),width:name==='bayer'?w*2:w,height:name==='bayer'?h*2:h};}finally{if(src)e.release(src,len);if(dst)e.release(dst,outLen);if(scratch)e.release(scratch,len);}}};
}
/** OpenWA-authored recipe definitions, version 1. */
const definitions = [
 ['grayscale','⚫','Convert RGB to luminance with the shared Rust kernel.',false,{},'kernel'],
 ['stereo','👓','Separate red and blue channels with the shared Rust kernel.',false,{offset:10},'kernel'],
 ['dilate','➕','Dilate RGBA channels with the shared Rust kernel.',false,{iterations:1},'kernel'],
 ['erode','➖','Erode RGBA channels with the shared Rust kernel.',false,{iterations:1},'kernel'],
 ['bayer','▦','Expand the pixels into a Bayer colour mosaic.',false,{},'kernel'],

 ['comic','💬','Posterise colours and draw dark Sobel outlines.',false,{levels:5},'edges'],
 ['earth','🌍','Wrap the input onto a shaded sphere and rotate it.',true,{turns:1},'warp'],
 ['edge','✏️','Draw white Sobel luminance edges on black.',false,{strength:2},'edges'],
 ['emboss','🗿','Apply a directional relief kernel with a grey bias.',false,{strength:1.5},'pixels'],
 ['fisheye','🐟','Magnify the centre using a radial barrel lens.',false,{strength:0.65},'warp'],
 ['flash','⚡','Pulse a white flash over the image.',true,{strength:0.9},'canvas'],
 ['freeze','🧊','Keep the first decoded frame of an animation.',false,{},'timing'],
 ['gold','🥇','Map luminance to a dark-brown → gold → cream gradient.',false,{},'pixels'],
 ['half','◐','Invert the right half while keeping the left half unchanged.',false,{},'pixels'],
 ['invert','🙃','Invert RGB channels while preserving transparency.',false,{},'pixels'],
 ['jail','🔒','Overlay steel prison bars and a small lock.',false,{bars:5},'canvas'],
 ['kaleidoscope','🔮','Reflect the source across six angular sectors.',false,{sectors:6},'warp'],
 ['leak','🌅','Screen-blend a warm radial light leak.',false,{strength:0.75},'canvas'],
 ['lego','🧱','Average a brick grid, then draw raised circular studs.',false,{cell:32},'tiles'],
 ['liquid','💧','Animate horizontal and vertical sine-wave refraction.',true,{strength:18},'warp'],
 ['low','📉','Reduce to 64px, compress as low-quality JPEG, then enlarge.',false,{size:64,quality:0.08},'canvas'],
 ['magik','🪄','Remove low-energy seams in both axes, then stretch back.',false,{workingSize:192,retain:0.72},'seam'],
 ['mirror','🪞','Flip the image horizontally.',false,{},'canvas'],
 ['mosaic','🟪','Replace each 24px cell with its average RGBA colour.',false,{cell:24},'tiles'],
 ['motion','💨','Blend shifted copies into a directional motion blur.',false,{distance:28,samples:9},'canvas'],
 ['newspaper','📰','Place a halftone greyscale image in a newspaper layout.',false,{headline:'STICKER DAILY'},'canvas'],
 ['opaque','⬜','Composite transparency onto the chosen solid background.',false,{color:'#ffffff'},'canvas'],
 ['pixelate','👾','Downsample to a 32px grid and enlarge with nearest neighbours.',false,{size:32},'canvas'],
 ['polaroid','📸','Fit the input inside a white instant-photo frame.',false,{caption:'OpenWA'},'canvas'],
 ['rainbow','🌈','Animate a rainbow gradient using a colour blend.',true,{strength:0.65},'canvas'],
 ['random','🎲','Select one reproducible effect from a safe pool using a seed.',false,{seed:42},'seed'],
 ['recede','🔭','Animate the image shrinking into the distance.',true,{minimum:0.18},'canvas'],
 ['resize','📐','Resize to fit inside 300 × 300px on the 512px output.',false,{width:300,height:300},'canvas'],
 ['scramble','🧩','Shuffle a 4 × 4 tile grid with a reproducible seed.',false,{grid:4,seed:42},'tiles'],
 ['screen','📺','Add CRT scanlines, a cyan cast and dark rounded corners.',false,{},'canvas'],
 ['shake','🫨','Shake the whole image with irregular looping offsets.',true,{distance:18},'canvas'],
 ['sketch','🖊️','Draw dark pencil-like edges on off-white paper.',false,{strength:2.4},'edges'],
 ['slow','🐌','Multiply decoded animation frame durations by three.',false,{factor:3},'timing'],
 ['smooth','🫧','Apply a soft 3px browser blur.',false,{radius:3},'canvas'],
 ['snap','🫰','Dissolve the image into drifting, fading square particles.',true,{cell:24,seed:42},'tiles'],
 ['solar','☀️','Solarise channels above a brightness threshold.',false,{threshold:128},'pixels'],
 ['sort','📊','Sort visible horizontal runs by luminance, keeping alpha gaps.',false,{},'sort'],
 ['sparkle','✨','Pulse small four-point sparkles over the input.',true,{count:18,seed:42},'canvas'],
 ['spiral','🌀','Twist angles by radius to form a spiral warp.',false,{strength:3.8},'warp'],
 ['spread','🎇','Animate grid tiles scattering radially from the centre.',true,{cell:48,strength:0.9},'tiles'],
 ['square','🔲','Crop a centred 384px square and upscale it to 512px.',false,{size:384},'canvas'],
 ['squish','🥞','Animate bottom-anchored vertical compression.',true,{minimum:0.35},'canvas'],
 ['stack','🗂️','Compose three offset, slightly rotated copies.',false,{copies:3},'canvas'],
 ['stamp','📮','Create a two-tone ink image with a perforated stamp border.',false,{color:'#a73242'},'canvas'],
 ['stars','⭐','Clip the image to a five-point star.',false,{},'canvas'],
 ['stripes','🦓','Cut transparent diagonal stripes through the image.',false,{width:32},'canvas'],
 ['swirl','🌪️','Twist the centre while leaving the outside nearly unchanged.',false,{strength:3},'warp'],
 ['tint','🎨','Blend a chosen colour tint over the input.',false,{color:'#e056ae',strength:0.45},'canvas'],
 ['trace','📎','Overlay sharp dark contours on a pale greyscale image.',false,{strength:2},'edges'],
 ['triangle','🔺','Average each half-cell into coloured triangular facets.',false,{cell:40},'tiles'],
 ['trip','🍄','Animate sine refraction with cycling RGB channel phases.',true,{strength:12},'warp'],
 ['uncanny','😶','Make an eerie high-contrast greyscale portrait with a vignette.',false,{},'pixels'],
 ['unfreeze','🔥','Animate a still with a subtle pan and zoom; lost motion is not recovered.',true,{zoom:0.12},'canvas'],
 ['unsharpen','🔍','Use an unsharp mask to sharpen detail (chosen meaning of this ambiguous name).',false,{amount:1.4,radius:2},'pixels'],
 ['vaporwave','🌆','Combine cyan/magenta duotone, scanlines and a neon frame.',false,{},'canvas'],
 ['vibrate','📳','Alternate small horizontal offsets rapidly.',true,{distance:6},'canvas'],
 ['woke','👁️','Add glowing laser beams at two configurable eye anchors.',false,{eyes:[[0.38,0.40],[0.62,0.40]],color:'#ff2449'},'canvas']
];
const recipes = Object.fromEntries(definitions.map(([name,emoji,description,animated,defaults,referenceGroup])=>[name,{name,emoji,description,animated,defaults,referenceGroup}]));
const TAU=Math.PI*2;
const clamp=(v,a=0,b=255)=>Math.max(a,Math.min(b,v));
const owned = new Set();
const cancellations = new Set();
const surface=(w=512,h=512)=>{const c=environment.createSurface(w,h);owned.add(c);return c;};
const ctx=c=>c.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});
const copy=c=>{const d=surface(c.width,c.height);ctx(d).drawImage(c,0,0);return d;};
const data=c=>ctx(c).getImageData(0,0,c.width,c.height);
const put=(d,w,h)=>{const c=surface(w,h);ctx(c).putImageData(new ImageData(d,w,h),0,0);return c;};
const luma=(d,i)=>(d[i]*0.2126+d[i+1]*0.7152+d[i+2]*0.0722);
const seeded=seed=>{let s=(Number(seed)||1)>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
const encode=(c,type='image/webp',quality=.82,maxBytes)=>environment.encodeSurface(c,type,quality,maxBytes);
function pixel(c,fn){const im=data(c),d=im.data;for(let i=0;i<d.length;i+=4){const value=fn(d[i],d[i+1],d[i+2],d[i+3],i/4%c.width,Math.floor(i/4/c.width));d[i]=value[0];d[i+1]=value[1];d[i+2]=value[2];if(value.length>3)d[i+3]=value[3];}ctx(c).putImageData(im,0,0);return c;}
function fit(source,w=512,h=512,crop=false){const c=surface(),g=ctx(c),s=(crop?Math.max:Math.min)(w/source.width,h/source.height);const dw=source.width*s,dh=source.height*s;g.drawImage(source,(512-dw)/2,(512-dh)/2,dw,dh);return c;}
function transform(c,sx=1,sy=1,x=256,y=256,angle=0){const o=surface(),g=ctx(o);g.translate(x,y);g.rotate(angle);g.scale(sx,sy);g.drawImage(c,-256,-256);return o;}
function filtered(c,filter){if(environment.filterSurface){const result=environment.filterSurface(c,filter);owned.add(result);return result;}const o=surface(),g=ctx(o);g.filter=filter;g.drawImage(c,0,0);return o;}
function edges(c,mode,p){const im=data(c),d=im.data,w=c.width,h=c.height,out=new Uint8ClampedArray(d.length);const value=(x,y)=>luma(d,(clamp(y,0,h-1)*w+clamp(x,0,w-1))*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const gx=-value(x-1,y-1)+value(x+1,y-1)-2*value(x-1,y)+2*value(x+1,y)-value(x-1,y+1)+value(x+1,y+1);const gy=-value(x-1,y-1)-2*value(x,y-1)-value(x+1,y-1)+value(x-1,y+1)+2*value(x,y+1)+value(x+1,y+1);const e=clamp(Math.hypot(gx,gy)*(p.strength||1)/4);for(let k=0;k<3;k++){if(mode==='edge')out[i+k]=e;else if(mode==='sketch')out[i+k]=255-e;else if(mode==='trace')out[i+k]=(240*.8+luma(d,i)*.2)*(1-e/255);else out[i+k]=Math.round(d[i+k]/255*(p.levels-1))*255/(p.levels-1)*(1-e/255);}out[i+3]=d[i+3];}return put(out,w,h);}
function warp(c,fn){const {data:d,width:w,height:h}=data(c),o=new Uint8ClampedArray(d.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const q=fn(x,y);if(!q)continue;const [sx,sy,light=1]=q;if(sx<0||sy<0||sx>w-1||sy>h-1)continue;const x0=Math.floor(sx),y0=Math.floor(sy),dx=sx-x0,dy=sy-y0,j=(y*w+x)*4;let a=0,r=0,g=0,b=0;for(let by=0;by<2;by++)for(let bx=0;bx<2;bx++){const weight=(bx?dx:1-dx)*(by?dy:1-dy),i=(Math.min(h-1,y0+by)*w+Math.min(w-1,x0+bx))*4,alpha=d[i+3]*weight;a+=alpha;r+=d[i]*alpha;g+=d[i+1]*alpha;b+=d[i+2]*alpha;}if(a){o[j]=r/a*light;o[j+1]=g/a*light;o[j+2]=b/a*light;o[j+3]=a;}}return put(o,w,h);}
function tile(c,size,triangle=false,lego=false){const d=data(c).data,o=surface(),g=ctx(o);for(let y=0;y<512;y+=size)for(let x=0;x<512;x+=size){for(let part=0;part<(triangle?2:1);part++){let r=0,b=0,gg=0,a=0,n=0;const w=Math.min(size,512-x),h=Math.min(size,512-y);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){if(triangle&&(xx/w+yy/h<1)!==(part===0))continue;const i=((y+yy)*512+x+xx)*4;const aa=d[i+3]/255;r+=d[i]*aa;gg+=d[i+1]*aa;b+=d[i+2]*aa;a+=aa;n++;}if(!n||!a)continue;const color=`rgba(${r/a},${gg/a},${b/a},${a/n})`;g.fillStyle=color;if(triangle){g.beginPath();if(!part){g.moveTo(x,y);g.lineTo(x+w,y);g.lineTo(x,y+h);}else{g.moveTo(x+w,y);g.lineTo(x+w,y+h);g.lineTo(x,y+h);}g.closePath();g.fill();}else{g.fillRect(x,y,w,h);if(lego){g.strokeStyle='rgba(0,0,0,.25)';g.strokeRect(x+.5,y+.5,w-1,h-1);g.beginPath();g.ellipse(x+w/2,y+h/2,w*.29,h*.29,0,0,TAU);g.fillStyle='rgba(255,255,255,.2)';g.fill();g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=2;g.stroke();}}}}return o;}
function removeSeams(d,w,h,target){while(w>target){const cost=new Float32Array(w*h),back=new Int8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const left=(y*w+Math.max(0,x-1))*4,right=(y*w+Math.min(w-1,x+1))*4,up=(Math.max(0,y-1)*w+x)*4,down=(Math.min(h-1,y+1)*w+x)*4;let energy=Math.abs(luma(d,left)-luma(d,right))+Math.abs(luma(d,up)-luma(d,down))+Math.abs(d[left+3]-d[right+3])+Math.abs(d[up+3]-d[down+3]);if(y){let best=cost[(y-1)*w+x],step=0;for(const dx of [-1,1])if(x+dx>=0&&x+dx<w&&cost[(y-1)*w+x+dx]<best){best=cost[(y-1)*w+x+dx];step=dx;}energy+=best;back[y*w+x]=step;}cost[y*w+x]=energy;}let x=0;for(let xx=1;xx<w;xx++)if(cost[(h-1)*w+xx]<cost[(h-1)*w+x])x=xx;const seam=new Int32Array(h);for(let y=h-1;y>=0;y--){seam[y]=x;x+=back[y*w+x];}const next=new Uint8ClampedArray((w-1)*h*4);for(let y=0;y<h;y++){const s=seam[y];next.set(d.subarray(y*w*4,(y*w+s)*4),y*(w-1)*4);next.set(d.subarray((y*w+s+1)*4,(y+1)*w*4),(y*(w-1)+s)*4);}d=next;w--;}return {d,w,h};}
function transpose({d,w,h}){const o=new Uint8ClampedArray(d.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++)o.set(d.subarray((y*w+x)*4,(y*w+x)*4+4),(x*h+y)*4);return {d:o,w:h,h:w};}
function seamCarve(c,p){const n=clamp(Math.round(p.workingSize),48,256),small=surface(n,n);ctx(small).drawImage(c,0,0,n,n);let image={d:data(small).data,w:n,h:n},keep=clamp(p.retain,.4,1);image=removeSeams(image.d,image.w,image.h,Math.round(n*keep));image=transpose(image);image=removeSeams(image.d,image.w,image.h,Math.round(n*keep));image=transpose(image);const o=surface();ctx(o).drawImage(put(image.d,image.w,image.h),0,0,512,512);return o;}
function starPath(g,x,y,r,points=5,inner=.45,rotation=-Math.PI/2){g.beginPath();for(let i=0;i<points*2;i++){const a=rotation+i*Math.PI/points,rr=i%2?r*inner:r;if(i)g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);else g.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}g.closePath();}
function ink(c,color){const colors=/^#([\da-f]{6})$/i.exec(color),rgb=colors?[0,2,4].map(i=>parseInt(colors[1].slice(i,i+2),16)):[167,50,66];return pixel(c,(r,g,b,a)=>{const t=1-(r*.2126+g*.7152+b*.0722)/255;return [255+(rgb[0]-255)*t,255+(rgb[1]-255)*t,255+(rgb[2]-255)*t,a];});}
async function effect(c,name,p,t,info){const a=t*TAU,o=surface(),g=ctx(o);
 switch(name){
 case 'comic':case 'edge':case 'sketch':case 'trace':return edges(c,name,p);
 case 'invert':case 'grayscale':case 'stereo':case 'dilate':case 'erode':case 'bayer':{const im=data(c),out=kernel.run(name,im.data,c.width,c.height,p),result=put(out.data,out.width,out.height);return out.width===512&&out.height===512?result:fit(result,512,512);}
 case 'half':return pixel(c,(r,g,b,a,x)=>x>=256?[255-r,255-g,255-b,a]:[r,g,b,a]);
 case 'solar':return pixel(c,(r,g,b,a)=>[r>p.threshold?255-r:r,g>p.threshold?255-g:g,b>p.threshold?255-b:b,a]);
 case 'gold':return pixel(c,(r,g,b,a)=>{const v=(r*.2126+g*.7152+b*.0722)/255;return [clamp(45+v*240),clamp(20+v*210),clamp(v<.65?v*48:31+(v-.65)*530),a];});
 case 'emboss':{const d=data(c).data,out=new Uint8ClampedArray(d.length);for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4,u=(Math.max(0,y-1)*512+Math.max(0,x-1))*4,v=(Math.min(511,y+1)*512+Math.min(511,x+1))*4;const e=128+(luma(d,v)-luma(d,u))*p.strength;out.set([e,e,e,d[i+3]],i);}return put(out,512,512);}
 case 'uncanny':return pixel(c,(r,g,b,alpha,x,y)=>{const v=clamp(((r*.2126+g*.7152+b*.0722)-128)*2+115)*clamp(1-Math.hypot(x-256,y-256)/360*.75,0,1);return[v*.9,v*.96,v,alpha];});
 case 'unsharpen':{const sharp=data(c).data,blur=data(filtered(c,`blur(${p.radius}px)`)).data;for(let i=0;i<sharp.length;i+=4)for(let k=0;k<3;k++)sharp[i+k]+=p.amount*(sharp[i+k]-blur[i+k]);return put(sharp,512,512);}
 case 'sort':{const d=data(c).data;for(let y=0;y<512;y++){let x=0;while(x<512){while(x<512&&d[(y*512+x)*4+3]<16)x++;let end=x;while(end<512&&d[(y*512+end)*4+3]>=16)end++;const values=[];for(let xx=x;xx<end;xx++){const i=(y*512+xx)*4;values.push([d[i],d[i+1],d[i+2],d[i+3]]);}values.sort((a,b)=>(a[0]*.2126+a[1]*.7152+a[2]*.0722)-(b[0]*.2126+b[1]*.7152+b[2]*.0722));values.forEach((v,i)=>d.set(v,(y*512+x+i)*4));x=Math.max(end,x+1);}}return put(d,512,512);}
 case 'magik':return seamCarve(c,p);
 case 'fisheye':case 'kaleidoscope':case 'swirl':case 'spiral':return warp(c,(x,y)=>{let dx=x-256,dy=y-256,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),rr=r;if(name==='fisheye'&&r<256)rr=256*Math.pow(r/256,1+p.strength);if(name==='kaleidoscope'){const sector=TAU/p.sectors;angle=((angle%sector)+sector)%sector;if(angle>sector/2)angle=sector-angle;}if(name==='swirl')angle+=p.strength*Math.max(0,1-r/256)**2;if(name==='spiral')angle+=p.strength*r/256;return [256+Math.cos(angle)*rr,256+Math.sin(angle)*rr];});
 case 'earth':return warp(c,(x,y)=>{const nx=(x-256)/230,ny=(y-256)/230,r2=nx*nx+ny*ny;if(r2>1)return null;const z=Math.sqrt(1-r2),lon=Math.atan2(nx,z)+a*p.turns,lat=Math.asin(ny);return [(((lon/TAU+.5)%1+1)%1)*511,(lat/Math.PI+.5)*511,.28+.72*Math.max(0,nx*-.3-ny*.3+z*.9)];});
 case 'liquid':return warp(c,(x,y)=>[x+p.strength*Math.sin(y/35+a),y+p.strength*.65*Math.sin(x/50-a)]);
 case 'trip':{const w=warp(c,(x,y)=>[x+p.strength*Math.sin(y/25+a),y+p.strength*Math.cos(x/31-a)]);return pixel(w,(r,g,b,alpha,x,y)=>[r*.6+(Math.sin(x/31+a)+1)*70,g*.6+(Math.sin(y/23-a)+1)*70,b*.6+(Math.sin((x+y)/45+a+2)+1)*70,alpha]);}
 case 'mosaic':case 'lego':case 'triangle':return tile(c,p.cell,name==='triangle',name==='lego');
 case 'mirror':return transform(c,-1,1);
 case 'resize':return fit(c,p.width,p.height);
 case 'square':{const size=clamp(p.size,32,512);g.drawImage(c,(512-size)/2,(512-size)/2,size,size,0,0,512,512);return o;}
 case 'freeze':case 'slow':return c;
 case 'random':return effect(c,info.selected,recipes[info.selected].defaults,t,info);
 case 'smooth':return filtered(c,`blur(${p.radius}px)`);
 case 'pixelate':case 'low':{const n=clamp(Math.round(p.size),2,512),s=surface(n,n),sg=ctx(s);if(name==='low'){sg.fillStyle='#ffffff';sg.fillRect(0,0,n,n);}sg.drawImage(c,0,0,n,n);let image=s;if(name==='low'){image=await createImageBitmap(await encode(s,'image/jpeg',clamp(p.quality,.01,1)));}g.imageSmoothingEnabled=name==='low';g.drawImage(image,0,0,512,512);if(image!==s)image.close();return o;}
 case 'opaque':g.fillStyle=p.color;g.fillRect(0,0,512,512);g.drawImage(c,0,0);return o;
 case 'motion':g.globalCompositeOperation='lighter';g.globalAlpha=1/p.samples;for(let i=0;i<p.samples;i++)g.drawImage(c,(i/(p.samples-1)-.5)*p.distance,0);return o;
 case 'shake':return transform(c,1,1,256+p.distance*Math.sin(a*3),256+p.distance*.7*Math.sin(a*5));
 case 'vibrate':return transform(c,1,1,256+(Math.round(t*20)%2?1:-1)*p.distance,256);
 case 'recede':{const z=p.minimum+(1-p.minimum)*(1+Math.cos(a))/2;return transform(c,z,z);}
 case 'squish':{const z=p.minimum+(1-p.minimum)*(1+Math.cos(a))/2;return transform(c,1,z,256,512-256*z);}
 case 'unfreeze':{const z=1+p.zoom*(1-Math.cos(a))/2;return transform(c,z,z,256+8*Math.sin(a),256+5*Math.cos(a));}
 case 'scramble':{const count=p.grid*p.grid,order=Array.from({length:count},(_,i)=>i),rand=seeded(p.seed),cell=512/p.grid;for(let i=count-1;i>0;i--){const j=Math.floor(rand()*(i+1));[order[i],order[j]]=[order[j],order[i]];}order.forEach((from,to)=>g.drawImage(c,from%p.grid*cell,Math.floor(from/p.grid)*cell,cell,cell,to%p.grid*cell,Math.floor(to/p.grid)*cell,cell,cell));return o;}
 case 'spread':case 'snap':{const cell=p.cell,rand=seeded(p.seed||42),phase=(1-Math.cos(a))/2;for(let y=0;y<512;y+=cell)for(let x=0;x<512;x+=cell){const noise=rand(),vx=name==='spread'?(x+cell/2-256)*p.strength:35+noise*140,vy=name==='spread'?(y+cell/2-256)*p.strength:-noise*100;g.globalAlpha=name==='snap'?1-phase:1;g.drawImage(c,x,y,Math.min(cell,512-x),Math.min(cell,512-y),x+vx*phase,y+vy*phase,Math.min(cell,512-x),Math.min(cell,512-y));}return o;}
 case 'stack':for(let i=p.copies-1;i>=0;i--){g.save();g.translate(256+(i-1)*28,256+(i-1)*24);g.rotate((i-1)*.12);g.drawImage(c,-205,-205,410,410);g.restore();}return o;
 case 'stars':starPath(g,256,256,253);g.clip();g.drawImage(c,0,0);return o;
 case 'stripes':g.drawImage(c,0,0);g.globalCompositeOperation='destination-out';g.lineWidth=p.width*.4;g.strokeStyle='#000';for(let x=-512;x<1024;x+=p.width){g.beginPath();g.moveTo(x,0);g.lineTo(x+512,512);g.stroke();}return o;
 case 'tint':case 'flash':case 'rainbow':case 'leak':g.drawImage(c,0,0);g.globalCompositeOperation='source-atop';if(name==='tint'){g.globalAlpha=p.strength;g.fillStyle=p.color;}if(name==='flash'){g.globalAlpha=p.strength*Math.max(0,Math.cos(a*2))**8;g.fillStyle='#fff';}if(name==='rainbow'){g.globalCompositeOperation='color';g.globalAlpha=p.strength;const grad=g.createLinearGradient(0,0,512,512);for(let i=0;i<=6;i++)grad.addColorStop(i/6,`hsl(${i*60+t*360},100%,55%)`);g.fillStyle=grad;}if(name==='leak'){const grad=g.createRadialGradient(40,80,0,40,80,560);grad.addColorStop(0,`rgba(255,100,20,${p.strength})`);grad.addColorStop(.5,'rgba(255,40,100,.3)');grad.addColorStop(1,'rgba(255,140,20,0)');g.globalCompositeOperation='screen';g.fillStyle=grad;}g.fillRect(0,0,512,512);return o;
 case 'sparkle':{g.drawImage(c,0,0);const rand=seeded(p.seed);for(let i=0;i<p.count;i++){const x=rand()*480+16,y=rand()*480+16,phase=rand()*TAU,r=3+Math.max(0,Math.sin(a+phase))*16;starPath(g,x,y,r,4,.17,0);g.fillStyle='#fff6b1';g.shadowColor='#ffffff';g.shadowBlur=12;g.fill();}return o;}
 case 'jail':g.drawImage(c,0,0);for(let i=0;i<p.bars;i++){const x=35+i*(442/(p.bars-1)),grad=g.createLinearGradient(x,0,x+15,0);grad.addColorStop(0,'#242d36');grad.addColorStop(.45,'#b0bac5');grad.addColorStop(1,'#303945');g.fillStyle=grad;g.fillRect(x,0,15,512);}g.fillStyle='#606b76';g.fillRect(0,70,512,15);g.fillRect(0,423,512,15);g.strokeStyle='#e0c480';g.lineWidth=8;g.beginPath();g.arc(259,275,18,Math.PI,0);g.stroke();g.fillStyle='#d4aa47';g.fillRect(234,274,50,45);return o;
 case 'polaroid':g.save();g.translate(256,256);g.rotate(-.045);g.fillStyle='#fffdf4';g.fillRect(-224,-240,448,480);g.drawImage(c,-202,-217,404,382);g.fillStyle='#3a3840';g.font='23px "OpenWA Sans"';g.textAlign='center';g.fillText(String(p.caption).slice(0,28),0,207);g.restore();return o;
 case 'newspaper':{g.fillStyle='#ece8d8';g.fillRect(0,0,512,512);g.fillStyle='#25252a';g.textAlign='center';g.font='36px "OpenWA Serif"';g.fillText(String(p.headline).slice(0,22),256,53);g.font='12px "OpenWA Mono"';g.fillText('BROWSER EDITION  •  DAILY PICTURE',256,78);const mono=filtered(c,'grayscale(1) contrast(1.3)');g.drawImage(mono,24,100,464,292);g.fillStyle='#333';g.font='23px "OpenWA Serif"';g.fillText('A picture worth a thousand words',256,424);for(let col=0;col<3;col++)for(let y=447;y<490;y+=7)g.fillRect(24+col*158,y,142-(y%3)*7,2);g.globalAlpha=.15;for(let y=102;y<392;y+=5)for(let x=26;x<488;x+=5){g.beginPath();g.arc(x,y,.6,0,TAU);g.fill();}return o;}
 case 'stamp':{g.fillStyle='#f3eee0';g.fillRect(10,10,492,492);g.drawImage(ink(copy(c),p.color),42,42,428,390);g.strokeStyle=p.color;g.lineWidth=3;g.strokeRect(29,29,454,454);g.fillStyle=p.color;g.font='26px "OpenWA Mono"';g.fillText('OPENWA • 1st',52,468);g.globalCompositeOperation='destination-out';for(let x=18;x<512;x+=24){for(const y of [10,502]){g.beginPath();g.arc(x,y,7,0,TAU);g.fill();}for(const xx of [10,502]){g.beginPath();g.arc(xx,x,7,0,TAU);g.fill();}}return o;}
 case 'screen':case 'vaporwave':{const image=name==='vaporwave'?pixel(c,(r,gg,b,alpha)=>{const v=(r*.2126+gg*.7152+b*.0722)/255;return[50+v*180,20+v*180,170+v*80,alpha];}):filtered(c,'contrast(1.12) saturate(.75)');g.drawImage(image,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(0,10,20,.25)';for(let y=0;y<512;y+=4)g.fillRect(0,y,512,2);const grad=g.createRadialGradient(256,256,145,256,256,340);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,.75)');g.fillStyle=grad;g.fillRect(0,0,512,512);if(name==='vaporwave'){g.globalCompositeOperation='source-over';g.strokeStyle='#20f2ff';g.lineWidth=8;g.strokeRect(7,7,498,498);}return o;}
 case 'woke':g.drawImage(c,0,0);g.strokeStyle=p.color;g.shadowColor=p.color;g.shadowBlur=24;for(const [nx,ny] of p.eyes){const x=nx*512,y=ny*512;g.lineWidth=12;g.beginPath();g.moveTo(x,y);g.lineTo(x<256?0:512,y+85);g.stroke();g.fillStyle=p.color;g.beginPath();g.ellipse(x,y,20,11,0,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.ellipse(x,y,11,5,0,0,TAU);g.fill();}return o;
 default:throw Error('Unknown effect: '+name);
 }
}
// Minimal full-frame animated WebP mux, independently built around RIFF/ANMF.
const text=new TextEncoder();
const join=parts=>{const d=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of parts){d.set(p,offset);offset+=p.length;}return d;};
const u24=(d,p,n)=>{d[p]=n&255;d[p+1]=n>>>8&255;d[p+2]=n>>>16&255;};
const chunk=(id,d)=>{const o=new Uint8Array(8+d.length+(d.length&1));o.set(text.encode(id));new DataView(o.buffer).setUint32(4,d.length,true);o.set(d,8);return o;};
function pixelChunks(raw){const view=new DataView(raw.buffer,raw.byteOffset,raw.byteLength),parts=[];let alpha=false;for(let p=12;p+8<=raw.length;){const n=view.getUint32(p+4,true),end=p+8+n+(n&1),id=String.fromCharCode(...raw.slice(p,p+4));if(end>raw.length)throw Error('Invalid encoded WebP chunk');if(['ALPH','VP8 ','VP8L'].includes(id)){parts.push(raw.slice(p,end));alpha ||= id==='ALPH'||(id==='VP8L'&&!!(raw[p+12]&16));}p=end;}if(!parts.length)throw Error('Missing WebP pixels');return {parts,alpha};}
function mux(frames,alpha){const ext=new Uint8Array(10);ext[0]=2|(alpha?16:0);u24(ext,4,511);u24(ext,7,511);const body=join([chunk('VP8X',ext),chunk('ANIM',new Uint8Array(6)),...frames]),o=new Uint8Array(body.length+12);o.set(text.encode('RIFF'));new DataView(o.buffer).setUint32(4,o.length-8,true);o.set(text.encode('WEBP'),8);o.set(body,12);return new Blob([o],{type:'image/webp'});}
function resolveStack(stack){if(!Array.isArray(stack))throw Error('Effects must be an array');if(stack.length>8)throw Error('At most eight effects are supported per job');return stack.map(item=>{const name=typeof item==='string'?item:item.name;if(!recipes[name])throw Error('Unknown effect: '+name);const supplied=typeof item==='object'?(item.options||{}):{};for(const key of Object.keys(supplied))if(!(key in recipes[name].defaults))throw Error(name+': unknown option '+key);const p={...recipes[name].defaults,...supplied},info={};
const bounds={iterations:[0,8],offset:[0,256],levels:[2,32],sectors:[2,32],cell:[4,128],grid:[2,16],count:[1,64],copies:[1,8],bars:[2,20],samples:[2,32],size:[2,512],width:[16,512],height:[16,512],workingSize:[48,256],retain:[.4,1],radius:[0,32],distance:[0,128],threshold:[0,255],minimum:[.05,1],factor:[.1,10],quality:[.01,1],amount:[0,8],zoom:[0,1],turns:[.1,8]};
for(const [key,value] of Object.entries(p))if(typeof recipes[name].defaults[key]==='number'){
 if(typeof value!=='number'||!Number.isFinite(value))throw Error(name+': '+key+' must be a finite number');
 const range=bounds[key]||(key==='strength'&&['flash','leak','rainbow','tint'].includes(name)?[0,1]:key==='seed'?[0,4294967295]:[-32,32]);
 if(value<range[0]||value>range[1])throw Error(name+': '+key+' must be between '+range[0]+' and '+range[1]);
 if(['iterations','offset','levels','sectors','cell','grid','count','copies','bars','samples','size','workingSize'].includes(key)&&!Number.isInteger(value))throw Error(name+': '+key+' must be an integer');
}
if(p.eyes&&(!Array.isArray(p.eyes)||p.eyes.length!==2||p.eyes.some(eye=>!Array.isArray(eye)||eye.length!==2||eye.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>1))))throw Error('woke: supply two [x,y] anchors between 0 and 1');
if(p.color&&(typeof p.color!=='string'||!CSS.supports('color',p.color)))throw Error(name+': invalid colour');
if(name==='random'){const pool=['comic','gold','invert','kaleidoscope','lego','mosaic','solar','swirl','tint','triangle'];info.selected=pool[Math.floor(seeded(p.seed)()*pool.length)];}return {name,p,info};});}

function clearSurfaces(){for(const c of owned){try{environment.disposeSurface(c);}catch{}}owned.clear();}
async function render(input,job={}) {
 const steps=resolveStack(job.effects||[]);if(steps.some(s=>['invert','grayscale','stereo','dilate','erode','bayer','random'].includes(s.name))&&!kernel)throw Error('Rust kernels were not provisioned');
 const quality=job.quality??.82,freeze=steps.some(s=>s.name==='freeze');
 if(job.background&&!CSS.supports('color',job.background))throw Error('Invalid background colour');
 let decoder,bitmap,sourceFrames=1;
 try {
  if(environment.ImageDecoder&&['image/gif','image/webp','image/avif','image/png'].includes(input.type)&&await environment.ImageDecoder.isTypeSupported(input.type)){
   decoder=new environment.ImageDecoder({data:new Uint8Array(await input.arrayBuffer()),type:input.type,preferAnimation:true});await decoder.tracks.ready;await decoder.completed;sourceFrames=decoder.tracks.selectedTrack.frameCount;
  }else bitmap=await createImageBitmap(input);
  if(!sourceFrames||sourceFrames>120)throw Error('Input must contain 1–120 frames');
  const lastFreeze=steps.findLastIndex(s=>s.name==='freeze');
  const animated=steps.some((s,index)=>index>lastFreeze&&recipes[s.name].animated);
  const timeline=[];let sourceDuration=0;
  if(sourceFrames>1){
   for(let frameIndex=0;frameIndex<sourceFrames;frameIndex++){
    const image=(await decoder.decode({frameIndex,completeFramesOnly:true})).image;
    try { const delay=Math.max(10,Math.round((image.duration||80000)/1000));timeline.push({frameIndex,begin:sourceDuration,end:sourceDuration+delay});sourceDuration+=delay; }
    finally { image.close(); }
   }
  }else{const count=animated?20:1;sourceDuration=animated?1600:80;for(let i=0;i<count;i++)timeline.push({frameIndex:0,begin:i*sourceDuration/count,end:(i+1)*sourceDuration/count});}
  const begin=job.trim?Math.max(0,job.trim[0]):0,end=job.trim?Math.min(sourceDuration,job.trim[1]):sourceDuration;
  if(end<=begin)throw Error('The selected trim contains no frames');
  let selected=timeline.filter(f=>f.end>begin&&f.begin<end).map(f=>({...f,begin:Math.max(begin,f.begin),end:Math.min(end,f.end)}));
  if(job.fps&&selected.length>1){const sampled=[];for(let t=begin;t<end;t+=1000/job.fps){const frame=timeline.find(f=>t>=f.begin&&t<f.end);sampled.push({...frame,begin:t,end:Math.min(end,t+1000/job.fps)});}selected=sampled;}
  if(freeze){const first=selected[0],count=animated?(job.fps?Math.ceil(1.6*job.fps):20):1,duration=animated?1600:80;selected=Array.from({length:count},(_,i)=>({frameIndex:first.frameIndex,begin:i*duration/count,end:(i+1)*duration/count}));}
  if(selected.length>120)throw Error('The selected animation exceeds 120 frames');
  const count=selected.length,encoded=[],delays=[];let hasAlpha=false,firstStatic,totalBytes=0,totalDuration=0;
  for(let i=0;i<count;i++){
   if(job.signal?.aborted||config.isCancelled?.()||cancellations.has(job.__renderId)){const error=Error('Render cancelled');error.code='CANCELLED';throw error;}
   let frame=bitmap,ownedFrame;
   if(decoder){ownedFrame=(await decoder.decode({frameIndex:selected[i].frameIndex,completeFramesOnly:true})).image;frame=ownedFrame;}
   let delay=selected[i].end-selected[i].begin;
   for(const s of steps)if(s.name==='slow')delay*=s.p.factor;
   delay=Math.max(1,Math.round(delay));if(delay>16777215){ownedFrame?.close();throw Error('Invalid frame duration');}
   totalDuration+=delay;
   if(totalDuration>10000&&count>1){ownedFrame?.close();throw Error('Animation exceeds 10 seconds');}
   const width=frame.displayWidth||frame.width,height=frame.displayHeight||frame.height;
   if(!width||!height||width*height>16000000){ownedFrame?.close();throw Error('Source exceeds the pixel budget');}
   let c=surface(),g=ctx(c);const scale=(job.fit==='cover'?Math.max:Math.min)(512/width,512/height);
   if(job.background){g.fillStyle=job.background;g.fillRect(0,0,512,512);}
   if(job.circle){g.save();g.beginPath();g.arc(256,256,256,0,TAU);g.clip();}
   g.drawImage(frame,(512-width*scale)/2,(512-height*scale)/2,width*scale,height*scale);
   if(job.circle)g.restore();ownedFrame?.close();
   for(let j=0;j<steps.length;j++){const s=steps[j];c=await effect(c,s.name,s.p,count===1||j<=lastFreeze?0:freeze?i/count:(selected[i].begin-begin)/(end-begin),s.info);}
   const frameBudget=count>1?Math.floor((512000-4096-44)/count)-24:100000-4096;
   const blob=await encode(c,'image/webp',quality,frameBudget);if(!firstStatic)firstStatic=blob;
   if(count>1){const {parts,alpha}=pixelChunks(new Uint8Array(await blob.arrayBuffer()));hasAlpha ||= alpha;const h=new Uint8Array(16);u24(h,6,511);u24(h,9,511);u24(h,12,delay);h[15]=2;const encodedFrame=chunk('ANMF',join([h,...parts]));encoded.push(encodedFrame);totalBytes+=encodedFrame.length;if(totalBytes+44>512000)throw Error('Animated sticker exceeds the byte budget');}
   else if(blob.size>100000)throw Error('Static sticker exceeds the byte budget');
   delays.push(delay);clearSurfaces();job.onProgress?.({frame:i+1,frames:count});
  }
  if(!firstStatic)throw Error('The selected trim contains no frames');
  let blob;
  if(encoded.length>1){blob=mux(encoded,hasAlpha);if(job.loopCount){const bytes=new Uint8Array(await blob.arrayBuffer());bytes[42]=job.loopCount&255;bytes[43]=job.loopCount>>>8;blob=new Blob([bytes],{type:'image/webp'});}}
  else blob=firstStatic;
  return {bytes:new Uint8Array(await blob.arrayBuffer()),width:512,height:512,frames:encoded.length>1?encoded.length:1,durationMs:encoded.length>1?delays.reduce((a,b)=>a+b,0):0,steps:steps.map(s=>({name:s.name,options:s.p,...s.info}))};
 }finally{clearSurfaces();decoder?.close();bitmap?.close();}
}
let tail=Promise.resolve(),pending=0,closed=false;
const engine={version:'1',get busy(){return pending>0;},cancel(id){cancellations.add(id);},render(input,job){
 if(closed)return Promise.reject(Error('Renderer disposed'));
 if(pending>=4)return Promise.reject(Error('Browser recipe queue is full'));
 pending++;const result=tail.then(()=>{if(closed)throw Error('Renderer disposed');if(cancellations.has(job.__renderId)){const error=Error('Render cancelled');error.code='CANCELLED';throw error;}return render(input,job);});
 tail=result.catch(()=>{}).finally(()=>{pending--;cancellations.delete(job.__renderId);});return result;
},dispose(){closed=true;clearSurfaces();cancellations.clear();kernel=undefined;}};
if(config.install){globalThis.__OPENWA_STICKER_RENDERER_V1__=engine;return {version:'1',installed:true};}
return engine;
}
