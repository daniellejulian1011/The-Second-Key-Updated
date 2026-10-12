// Original uploaded files remain unchanged. Crops below are runtime texture/GUI views.
export const REFERENCE_FILES={menu:'assets/reference-menu.png',living:'assets/reference-living.png',kitchen:'assets/reference-kitchen.png',upstairs:'assets/reference-upstairs.png',basement:'assets/reference-basement.png',jumpscare:'assets/reference-jumpscare.jpg',caught:'assets/reference-caught.jpg',nathaniel:'assets/reference-nathaniel.png',evelyn:'assets/reference-evelyn.png'};
export function assetURL(path){return window.SECOND_KEY_ASSETS?.[path]||path;}
export function loadReferenceImages(){return Promise.all(Object.entries(REFERENCE_FILES).map(([key,src])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve([key,im]);im.onerror=()=>reject(Error(`Could not load ${src}`));im.src=assetURL(src);}))).then(entries=>Object.fromEntries(entries));}
function artCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
export const PHOTO_ROOMS={
 l:{source:'living',yaw:-.48,anchor:[7.6,16.2],crop:[0,0,1536,864]},
 f:{source:'living',yaw:Math.PI/2,anchor:[13.5,14.5],crop:[620,30,640,560]},
 d:{source:'living',yaw:0,anchor:[6.5,8.5],crop:[0,0,1110,864]},
 k:{source:'kitchen',yaw:-Math.PI/2,anchor:[16.5,7.5],crop:[0,0,1536,864]},
 g:{source:'basement',yaw:0,anchor:[20.5,17.5],crop:[640,80,896,520]},
 y:{source:'menu',yaw:-Math.PI/2,anchor:[13.5,20.5],crop:[650,35,886,745]},
 h:{source:'upstairs',yaw:Math.PI/2,anchor:[14.5,11.5],crop:[0,0,1536,864]},
 e:{source:'upstairs',yaw:Math.PI/2,anchor:[8.5,8.5],crop:[755,20,770,585]},
 p:{source:'upstairs',yaw:0,anchor:[8.5,4.5],crop:[755,20,770,585]},
 a:{source:'upstairs',yaw:0,anchor:[8.5,14.5],crop:[15,35,635,560]},
 b:{source:'basement',yaw:Math.PI,anchor:[12.5,9.5],crop:[0,0,1536,864]},
 s:{source:'basement',yaw:Math.PI,anchor:[17.5,10.5],crop:[860,20,676,590]}
};
export function cleanScenePlate(image,source,inside=false){
 const c=artCanvas(1536,864),ctx=c.getContext('2d');ctx.drawImage(image,0,0,1536,864);
 if(source!=='menu'){
  // Exclude text that is already baked into the screenshot: live HTML supplies it.
  ctx.drawImage(image,35,100,550,76,20,12,570,77);
  ctx.drawImage(image,1300,112,226,84,1290,12,246,88);
  // The narrow scenery strip between the old HUD panels contains an unobstructed floor.
  ctx.drawImage(image,920,536,125,312,0,610,1536,254);
 }
 if(source==='kitchen'&&inside){
  // Once he enters, the earlier figure at the glass is not a second, static Nathaniel.
  // Replace only glass panes with rain-glass sampled from this same photograph.
  for(const [x,y,w,h] of [[956,151,59,172],[1026,151,44,172],[955,341,59,88],[1026,341,44,88]])ctx.drawImage(image,142,140,68,182,x,y,w,h);
 }
 return c;
}
export function roomPhotoFaces(images,key,inside=false){
 const info=PHOTO_ROOMS[key]||PHOTO_ROOMS.l,plate=cleanScenePlate(images[info.source],info.source,inside),[sx,sy,sw,sh]=info.crop;
 const crop=(x,y,w,h)=>{const c=artCanvas(2048,1024);c.getContext('2d').drawImage(plate,x,y,w,h,0,0,2048,1024);return c;};
 return [crop(sx,sy,sw,sh),crop(sx+sw*.67,sy,sw*.33,Math.min(sh,610-sy)),crop(sx+sw*.22,sy,sw*.55,Math.min(sh,610-sy)),crop(sx,sy,sw*.33,Math.min(sh,610-sy))];
}
// Silhouette masks are only crop boundaries. Every visible character pixel is from the sheet.
export function nathanielSprite(sheet,side=false){
 const c=artCanvas(512,1024),ctx=c.getContext('2d');const sx=side?525:181,sy=63,sw=side?224:376,sh=962;
 const front=[[.51,.006],[.64,.015],[.74,.047],[.80,.10],[.73,.14],[.72,.157],[.88,.20],[.96,.31],[.94,.46],[.94,.52],[.93,.59],[.82,.63],[.77,.83],[.85,.92],[.93,.96],[.87,.985],[.63,.99],[.58,.96],[.57,.89],[.54,.73],[.49,.64],[.43,.78],[.42,.92],[.32,.98],[.13,.994],[.01,.978],[.034,.944],[.19,.906],[.25,.78],[.28,.66],[.32,.50],[.22,.44],[.19,.35],[.22,.28],[.28,.20],[.42,.15],[.44,.124],[.43,.09],[.42,.063],[.45,.024]];
 const profile=[[.41,.02],[.55,.00],[.76,.04],[.98,.11],[.98,.145],[.83,.18],[.79,.20],[.96,.36],[.92,.43],[.84,.49],[.74,.52],[.86,.65],[.85,.87],[.92,.93],[.98,.957],[.91,.984],[.60,.988],[.54,.96],[.57,.88],[.55,.72],[.49,.58],[.41,.73],[.43,.88],[.47,.948],[.69,.973],[.65,.99],[.19,.99],[.15,.962],[.17,.91],[.17,.79],[.10,.63],[.11,.53],[.15,.47],[.10,.35],[.13,.23],[.25,.17],[.30,.14],[.30,.09],[.23,.07],[.29,.035]];
 ctx.save();ctx.beginPath();(side?profile:front).forEach(([x,y],i)=>i?ctx.lineTo(x*512,y*1024):ctx.moveTo(x*512,y*1024));ctx.closePath();ctx.clip();ctx.drawImage(sheet,sx,sy,sw,sh,0,0,512,1024);ctx.restore();
 // Flood only the paper connected to the outside of the crop, preserving enclosed skin/shirt highlights.
 const im=ctx.getImageData(0,0,512,1024),pixels=im.data,visited=new Uint8Array(512*1024),queue=new Int32Array(512*1024);let head=0,tail=0;
 const paper=i=>{const k=i*4,r=pixels[k],g=pixels[k+1],b=pixels[k+2];return pixels[k+3]===0||(r>=150&&g>=142&&b>=129&&r+g+b>=480&&r-g<25&&g-b<31);};
 const add=i=>{if(i>=0&&i<visited.length&&!visited[i]&&paper(i)){visited[i]=1;queue[tail++]=i;}};
 for(let x=0;x<512;x++){add(x);add(1023*512+x);}for(let y=0;y<1024;y++){add(y*512);add(y*512+511);}
 while(head<tail){const i=queue[head++];pixels[i*4+3]=0;if(i%512)add(i-1);if(i%512<511)add(i+1);add(i-512);add(i+512);}
 // Keep the single connected person; this excludes nearby type and the other figure on the sheet.
 visited.fill(0);let largest=[];
 for(let seed=0;seed<visited.length;seed++){if(visited[seed]||pixels[seed*4+3]<32)continue;head=0;tail=0;const component=[];queue[tail++]=seed;visited[seed]=1;
  while(head<tail){const i=queue[head++];component.push(i);for(const n of [i%512?i-1:-1,i%512<511?i+1:-1,i-512,i+512])if(n>=0&&n<visited.length&&!visited[n]&&pixels[n*4+3]>=32){visited[n]=1;queue[tail++]=n;}}
  if(component.length>largest.length)largest=component;
 }
 visited.fill(0);largest.forEach(i=>visited[i]=1);for(let i=0;i<visited.length;i++)if(!visited[i])pixels[i*4+3]=0;
 ctx.putImageData(im,0,0);return c;
}
export function makeReferenceUI(images){const src=images.living;
 const gui=(rect,clear)=>{const c=artCanvas(rect[2],rect[3]),ctx=c.getContext('2d');ctx.drawImage(src,...rect,0,0,c.width,c.height);if(clear)ctx.drawImage(src,350,716,450,6,...clear);return c.toDataURL('image/png');};
 return {dialogue:gui([30,623,878,106],[78,4,791,98]),choice:gui([1054,612,448,47],[36,7,375,32]),icons:{flash:gui([137,752,121,85]),keys:gui([269,752,107,85]),camera:gui([383,752,85,85]),tape:gui([475,752,84,85]),photos:gui([565,752,114,85])}};
}
export function installReferenceUI(images){const ui=makeReferenceUI(images);document.documentElement.style.setProperty('--ref-menu',`url("${assetURL(REFERENCE_FILES.menu)}")`);document.documentElement.style.setProperty('--ref-caught',`url("${assetURL(REFERENCE_FILES.caught)}")`);document.documentElement.style.setProperty('--ref-dialogue',`url("${ui.dialogue}")`);document.documentElement.style.setProperty('--ref-choice',`url("${ui.choice}")`);
 for(const [id,type] of [['slot-flash','flash'],['slot-keys','keys'],['slot-camera','camera'],['slot-tape','tape'],['slot-photos','photos']]){const el=document.getElementById(id);if(el)el.style.setProperty('--ref-icon',`url("${ui.icons[type]}")`);}
 for(const el of document.querySelectorAll('[data-asset]'))el.src=assetURL(el.dataset.asset);const favicon=document.getElementById('game-icon');if(favicon)favicon.href=assetURL(REFERENCE_FILES.menu);return ui;
}
