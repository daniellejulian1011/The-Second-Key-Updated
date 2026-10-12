import {FLOORS,FURNITURE,DOORS,LINKS,HIDES,ITEMS,tile,roomAt,TAU} from './world.js';
import {PHOTO_ROOMS,loadReferenceImages,roomPhotoFaces,nathanielSprite,installReferenceUI} from './reference-art.js';
export const PHOTO_FRAGMENT_SHADER=`precision mediump float;
varying vec2 vUV;uniform sampler2D uFront;uniform sampler2D uRight;uniform sampler2D uBack;uniform sampler2D uLeft;
uniform vec3 uTurn;uniform vec3 uOffset;uniform vec3 uBox;uniform float uPower;uniform float uFlash;uniform float uBurst;uniform float uFov;
void main(){
 vec2 xy=(vUV*2.0-1.0)*vec2(uTurn.z,1.0)*uFov;vec3 r=normalize(vec3(1.0,xy.y,xy.x));
 float cp=cos(uTurn.y),sp=sin(uTurn.y);r=vec3(r.x*cp-r.y*sp,r.x*sp+r.y*cp,r.z);
 float cy=cos(uTurn.x),sy=sin(uTurn.x);r=vec3(r.x*cy-r.z*sy,r.y,r.x*sy+r.z*cy);
 vec3 signs=sign(r);vec3 safeR=mix(vec3(1.0),signs,step(vec3(.00001),abs(r)))*max(abs(r),vec3(.00001));vec3 t=(signs*uBox-uOffset)/safeR;
 if(abs(r.x)<.00001)t.x=1000.0;if(abs(r.y)<.00001)t.y=1000.0;if(abs(r.z)<.00001)t.z=1000.0;
 float travel=min(t.x,min(t.y,t.z));vec3 hit=uOffset+r*travel;vec2 uv;vec3 color;
 if(t.y<=t.x&&t.y<=t.z){uv=vec2(.5+hit.z/(2.0*uBox.z),r.y>0.0?.13:.91);color=texture2D(uFront,clamp(uv,.005,.995)).rgb;}
 else if(t.x<=t.z){uv=vec2(.5+(r.x>0.0?hit.z:-hit.z)/(2.0*uBox.z),.5-hit.y/(2.0*uBox.y));if(r.x>0.0)color=texture2D(uFront,clamp(uv,.005,.995)).rgb;else color=texture2D(uBack,clamp(uv,.005,.995)).rgb;}
 else{uv=vec2(.5+(r.z>0.0?-hit.x:hit.x)/(2.0*uBox.x),.5-hit.y/(2.0*uBox.y));if(r.z>0.0)color=texture2D(uRight,clamp(uv,.005,.995)).rgb;else color=texture2D(uLeft,clamp(uv,.005,.995)).rgb;}
 float beam=exp(-dot(xy,xy)*5.3)*uFlash;float light=mix(.13,1.0,uPower)+beam*1.12+uBurst*1.5;
 color*=light;color=mix(color,vec3(.90,.91,.81),beam*.16);gl_FragColor=vec4(color,1.0);
}`;
export const VERTEX_SHADER=`
attribute vec3 aPos; attribute vec3 aNormal; attribute vec2 aUV;
uniform mat4 uVP; varying vec3 vPos; varying vec3 vNormal; varying vec2 vUV;
void main(){vPos=aPos;vNormal=aNormal;vUV=aUV;gl_Position=uVP*vec4(aPos,1.0);}`;
export const FRAGMENT_SHADER=`
precision mediump float;
varying vec3 vPos;varying vec3 vNormal;varying vec2 vUV;
uniform sampler2D uTex;uniform vec3 uEye;uniform vec3 uForward;uniform vec3 uLights[8];uniform float uPower;uniform float uFlash;uniform float uEmission;uniform float uOutdoor;uniform float uKitchen;
void main(){
 vec4 tex=texture2D(uTex,vUV);if(tex.a<0.12)discard;
 vec3 n=normalize(vNormal),lit=vec3(.16,.17,.20);float d=distance(vPos,uEye);
 for(int i=0;i<8;i++){vec3 delta=uLights[i]-vPos;float len=length(delta);float diff=.26+.74*max(0.0,dot(n,normalize(delta)));float energy=2.5/(1.0+len*len*.23);float on=uPower;if(i==2)on*=uKitchen;lit+=vec3(1.0,.67,.35)*energy*diff*on;}
 vec3 to=normalize(vPos-uEye);float cone=smoothstep(.84,.97,dot(to,uForward));float spot=cone*uFlash*3.9/(1.0+d*d*.11);lit+=vec3(.94,.93,.82)*spot*(.4+.6*max(0.0,dot(n,-to)));
 lit=mix(lit,vec3(.30,.37,.52),uOutdoor*.6);vec3 color=tex.rgb*(lit+vec3(uEmission));color=color/(color+vec3(.58));float fog=1.0-exp(-d*.027);color=mix(color,vec3(.016,.019,.026),fog);color=pow(max(color,vec3(0.0)),vec3(.94));gl_FragColor=vec4(color,tex.a);
}`;
const PANO_FRAGMENT=`precision mediump float;varying vec2 vUV;uniform sampler2D uTex;uniform float uYaw;uniform float uPitch;uniform float uAspect;
void main(){vec2 p=(vUV*2.0-1.0)*vec2(uAspect,1.0)*.65;vec3 r=normalize(vec3(1.0,p.y,p.x));float cp=cos(uPitch),sp=sin(uPitch);r=vec3(r.x*cp-r.y*sp,r.x*sp+r.y*cp,r.z);float cy=cos(uYaw),sy=sin(uYaw);r=vec3(r.x*cy-r.z*sy,r.y,r.x*sy+r.z*cy);vec2 uv=vec2(fract(atan(r.z,r.x)/6.2831853+.5),.5-asin(clamp(r.y,-1.0,1.0))/3.14159265);gl_FragColor=texture2D(uTex,uv);}`;
function program(gl,vs,fs){const shaders=[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].map((type,i)=>{const s=gl.createShader(type);gl.shaderSource(s,i?fs:vs);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;});const p=gl.createProgram();shaders.forEach(s=>gl.attachShader(p,s));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));shaders.forEach(s=>gl.deleteShader(s));return p;}
function perspective(fov,aspect,near=.045,far=55){const f=1/Math.tan(fov/2);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);}
function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function view(eye,yaw,pitch){const f=[Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch),Math.sin(yaw)*Math.cos(pitch)],r=[-Math.sin(yaw),0,Math.cos(yaw)],u=[-Math.cos(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.sin(yaw)*Math.sin(pitch)];const dot=v=>v.reduce((sum,n,i)=>sum+n*eye[i],0);return {f,m:new Float32Array([r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-dot(r),-dot(u),dot(f),1])};}
function makeCanvas(size=256){const c=document.createElement('canvas');c.width=c.height=size;return c;}
class Mesh {
 constructor(){this.data=new Map();}
 quad(mat,p,n,uv=[[0,1],[1,1],[1,0],[0,0]]){const a=this.data.get(mat)||[];for(const i of [0,1,2,0,2,3])a.push(...p[i],...n,...uv[i]);this.data.set(mat,a);}
 box(mat,x,y,z,w,h,d){const x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2;
  this.quad(mat,[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1]);this.quad(mat,[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],[0,0,-1]);this.quad(mat,[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],[-1,0,0]);this.quad(mat,[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],[1,0,0]);this.quad(mat,[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],[0,1,0]);}
 cylinder(mat,x,y,z,r,h,top=r,count=20){for(let i=0;i<count;i++){const a=i*TAU/count,b=(i+1)*TAU/count;this.quad(mat,[[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x+Math.cos(b)*top,y+h,z+Math.sin(b)*top],[x+Math.cos(a)*top,y+h,z+Math.sin(a)*top]],[Math.cos((a+b)/2),.15,Math.sin((a+b)/2)]);}}
}
function lamp(m,x,z,y=.65){m.cylinder('enamel',x,y,z,.12,.28,.06);m.cylinder('gold',x,y+.28,z,.025,.3);m.cylinder('linen',x,y+.47,z,.32,.42,.14);m.cylinder('light',x,y+.46,z,.04,.16);}
function furnish(m,o){const {x,z,w,h,d,type,mat}=o;
 if(['table','dining','console','telephone','desk','toolbench'].includes(type)){
  m.box(mat,x,h-.1,z,w,.1,d);for(const sx of [-1,1])for(const sz of [-1,1])m.box(mat,x+sx*(w/2-.08),0,z+sz*(d/2-.08),.09,h-.1,.09);
  if(type==='telephone'){m.box('enamel',x,.83,z,.38,.12,.3);m.box('black',x,.97,z,.5,.065,.10);for(let i=0;i<9;i++)m.box('black',x+(i%3-1)*.055,.96,z+Math.floor(i/3)*.044-.04,.03,.01,.03);}
  if(type==='dining'){for(const sx of [-1,1]){m.cylinder('enamel',x+sx*w*.29,h+.02,z,.23,.015);m.box('wood',x+sx*(w/2+.25),0,z,.47,.47,.47);m.box('wood',x+sx*(w/2+.45),.42,z,.06,.6,.48);}m.cylinder('enamel',x,h,z,.08,.3,.11);}
  if(type==='table'){m.box('paper',x+.15,h,z+.4,.31,.022,.42);m.cylinder('enamel',x-.24,h,z-.3,.07,.15);}
  if(type==='desk')m.box('black',x,h,z,.22,.16,.12);return;
 }
 if(type==='sofa'){m.box(mat,x,0,z,w,.45,d);m.box(mat,x-w/2+.12,.4,z,.24,.6,d);for(const sz of [-1,1])m.box(mat,x,.4,z+sz*(d/2-.15),w,.42,.28);m.box(mat,x+.12,.45,z,w-.28,.2,d-.6);for(const sz of [-1,1])m.box('rug',x-.1,.65,z+sz*.75,.26,.25,.48);return;}
 if(type==='bed'){m.box('wood',x,0,z,w,.35,d);m.box('floral',x,.35,z,w,.26,d);m.box('wood',x,.2,z-d/2,w,.9,.07);for(const sx of [-1,1])m.box('linen',x+sx*w*.23,.61,z-d*.32,w*.4,.13,.5);return;}
 if(type==='lamp'){m.box(mat,x,0,z,w,h,d);lamp(m,x,z,h);return;}
 if(type==='television'){m.box(mat,x,0,z,w,h,d);m.box('black',x-w*.2,h,z,.6,.55,d*.7);m.quad('tv',[[x-w*.52,h+.10,z+d*.29],[x-w*.52,h+.10,z-d*.29],[x-w*.52,h+.48,z-d*.29],[x-w*.52,h+.48,z+d*.29]],[-1,0,0]);m.box('black',x-.4,.4,z,.25,.08,.7);return;}
 if(type==='bookcase'||type==='shelves'){m.box(mat,x,0,z,w,h,d);for(let y=.3;y<h;y+=.4){m.box(mat,x-w/2-.01,y,z,.035,.06,d-.12);for(let i=0;i<8;i++)m.box(i%2?'rug':'linen',x-w/2-.035,y+.07,z-d/2+.15+i*d/10,.065,.27,.1);}return;}
 if(type==='washer'){m.box(mat,x,0,z,w,h,d);m.box('black',x,h*.76,z+d/2+.02,w*.8,.12,.035);for(let i=0;i<3;i++)m.cylinder('gold',x-.4+i*.36,h*.8,z+d/2+.03,.03,.045);m.box('linen',x,h,z,.6,.07,.4);return;}
 if(type==='car'){m.box(mat,x,0,z,w,.55,d);m.box(mat,x,.5,z-.2,w*.95,.36,d*.6);m.box('window',x,.85,z-.2,w*.83,.45,d*.39);for(const sx of [-1,1])for(const sz of [-1,1])m.box('black',x+sx*w*.5,.12,z+sz*d*.30,.14,.44,.48);return;}
 m.box(mat,x,0,z,w,h,d);
 if(type==='counter'||type==='sink'){m.box('tile',x,h,z,w+.03,.06,d+.03);m.box('wood',x+.45,h+.2,z,.3,.75,.3);if(type==='sink'){m.box('black',x,h+.07,z,.7,.015,.5);m.cylinder('gold',x,h,z-.3,.02,.3);}}
 if(type==='closet'||type==='sideboard'||type==='fridge'){m.box(type==='fridge'?'enamel':'door',x+w*.51,.1,z,.025,h*.9,d*.94);m.box('gold',x+w*.54,h*.48,z+.22,.035,.04,.14);}
}
function scene(floor){const m=new Mesh(),map=FLOORS[floor].map;
 for(let z=0;z<map.length;z++)for(let x=0;x<map[z].length;x++){const r=map[z][x];if(r==='#')continue;const fm=r==='y'?'grass':floor===2?'concrete':r==='k'||r==='a'?'tile':'wood';m.quad(fm,[[x,0,z+1],[x+1,0,z+1],[x+1,0,z],[x,0,z]],[0,1,0]);if(r!=='y')m.quad(floor===2?'darkWood':'ceiling',[[x,2.8,z],[x+1,2.8,z],[x+1,2.8,z+1],[x,2.8,z+1]],[0,-1,0]);
  const wall=r==='y'?'enamel':floor===2?'brick':'wall';for(const [dx,dz,n] of [[1,0,[-1,0,0]],[-1,0,[1,0,0]],[0,1,[0,0,-1]],[0,-1,[0,0,1]]])if(tile(floor,x+dx,z+dz)==='#'){
   const x0=dx===1?x+1:x,x1=dx?x0:x+1,z0=dz===1?z+1:z,z1=dz?z0:z+1;
   m.quad(wall,[[x0,0,z0],[x1,0,z1],[x1,2.8,z1],[x0,2.8,z0]],n);
   if(r!=='y'&&floor!==2)m.box('wood',(x0+x1)/2,2.68,(z0+z1)/2,dx?.05:1,.1,dz?.05:1);
  }
 }
 for(const o of FURNITURE.filter(o=>o.floor===floor))furnish(m,o);
 const rugPos=floor===0?[[6.8,14.3,5.2,5.5],[13.5,14.2,2.1,5.5],[7,7,5.5,4]]:floor===1?[[14.5,7.5,2,9],[8,10,5.5,4.5]]:[];
 for(const [x,z,w,d] of rugPos)m.quad('rug',[[x-w/2,.012,z+d/2],[x+w/2,.012,z+d/2],[x+w/2,.012,z-d/2],[x-w/2,.012,z-d/2]],[0,1,0]);
 if(floor===0){
  // The title-screen house continues as a physical, two-storey exterior in play.
  m.box('enamel',11.5,2.8,10.5,18,2.6,15);
  m.quad('darkWood',[[2,5.4,18.4],[21,5.4,18.4],[21,7.0,10.5],[2,7.0,10.5]],[0,.97,.2]);
  m.quad('darkWood',[[21,5.4,2.6],[2,5.4,2.6],[2,7,10.5],[21,7,10.5]],[0,.97,-.2]);
  m.box('brick',18.5,5.4,7.5,.7,2.5,.65);
  m.quad('window',[[7.3,3.6,18.015],[9.0,3.6,18.015],[9.0,5.0,18.015],[7.3,5.0,18.015]],[0,0,1]);
  m.quad('window',[[13.0,3.6,18.015],[14.7,3.6,18.015],[14.7,5.0,18.015],[13.0,5.0,18.015]],[0,0,1]);
  lamp(m,14.7,14.8,.85);for(let i=0;i<11;i++)m.box('wood',14.6,i*.16,11.3-i*.23,1.25,.16,.24);
  // Rain-dark windows, curtains and framed landscapes are actual world surfaces.
  for(const [x,z,w,axis] of [[3.015,13.7,2,'z'],[6.2,17.99,2,'x'],[13.0,4.015,1.6,'x'],[16.5,3.8,1.0,'x']])windowPlane(m,x,z,w,axis);
  picture(m,3.02,7.5,'z');picture(m,11.03,12,'z');
 }else if(floor===1){windowPlane(m,8.5,12.98,2,'x');windowPlane(m,16.98,5.2,1.7,'z');picture(m,12.98,7.1,'z');}
 else{for(const x of [5,10,15])m.cylinder('black',x,2.55,7,.065,.12);m.box('enamel',14.5,1.1,6,.10,.85,.75);m.box('black',14.41,1.35,6,.035,.35,.45);m.box('door',4.5,0,3.1,1.2,2.5,.12);}
 // Tabletop evidence is placed on furniture surfaces instead of floating in space.
 if(floor===0){m.box('paper',13,1.065,6.8,.24,.008,.3);m.box('gold',23,1.02,13.4,.16,.018,.06);}
 if(floor===1)m.box('paper',10.5,.915,4.8,.25,.008,.34);
 if(floor===2){m.box('black',17.32,.7,4,.22,.08,.15);m.box('gold',5.4,.06,4.5,.14,.02,.06);}
 return m;
}
function windowPlane(m,x,z,w,axis){const y=.88,h=1.5;const p=axis==='x'?[[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y+h,z],[x-w/2,y+h,z]]:[[x,y,z-w/2],[x,y,z+w/2],[x,y+h,z+w/2],[x,y+h,z-w/2]];m.quad('window',p,axis==='x'?[0,0,-1]:[1,0,0]);m.box('wood',x,y-.04,z,axis==='x'?w+.08:.1,.05,axis==='x'?.1:w+.08);for(const side of [-1,1])m.box('linen',x+(axis==='x'?side*w*.45:0),y-.02,z+(axis==='z'?side*w*.45:0),axis==='x'?.2:.06,h+.13,axis==='z'?.2:.06);}
function picture(m,x,z,axis){const p=axis==='x'?[[x-.45,1.2,z],[x+.45,1.2,z],[x+.45,1.9,z],[x-.45,1.9,z]]:[[x,1.2,z-.4],[x,1.2,z+.4],[x,1.9,z+.4],[x,1.9,z-.4]];m.quad('picture',p,axis==='x'?[0,0,1]:[1,0,0]);}
export class Renderer {
 constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});this.texSources={};this.ready=false;this.error=null;this.quality=1;this.bob=0;
  if(!this.gl)throw Error('This game needs WebGL. Enable hardware acceleration or try Chrome, Edge, Firefox or Safari.');
  const gl=this.gl;this.p=program(gl,VERTEX_SHADER,FRAGMENT_SHADER);gl.useProgram(this.p);this.a=Object.fromEntries(['aPos','aNormal','aUV'].map(k=>[k,gl.getAttribLocation(this.p,k)]));this.u=Object.fromEntries(['uVP','uTex','uEye','uForward','uLights[0]','uPower','uFlash','uEmission','uOutdoor','uKitchen'].map(k=>[k,gl.getUniformLocation(this.p,k)]));this.tex={};const black=makeCanvas(2);black.getContext('2d').fillRect(0,0,2,2);this.tex.black=this.uploadTexture(black,false);this.photoCache=new Map();this.photoRoom=null;this.photoAnchor=null;this.photoYaw=0;this.photoProgram=program(gl,'attribute vec2 aPos;varying vec2 vUV;void main(){vUV=aPos*.5+.5;gl_Position=vec4(aPos,0.0,1.0);}',PHOTO_FRAGMENT_SHADER);this.photoU=Object.fromEntries(['uFront','uRight','uBack','uLeft','uTurn','uOffset','uBox','uPower','uFlash','uBurst','uFov'].map(k=>[k,gl.getUniformLocation(this.photoProgram,k)]));this.photoA=gl.getAttribLocation(this.photoProgram,'aPos');this.photoQuad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.photoQuad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);
  this.meshes=FLOORS.map(f=>this.uploadMesh(scene(f.id)));this.dynamic=gl.createBuffer();this.locations=[];
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.CULL_FACE);this.loading=this.loadAssets();
 }
 async loadAssets(){try{this.referenceImages=await loadReferenceImages();const front=nathanielSprite(this.referenceImages.nathaniel),walk=nathanielSprite(this.referenceImages.nathaniel,true);this.enemyArt={front,walk};this.tex.enemyFront=this.uploadTexture(front,false);this.tex.enemyWalk=this.uploadTexture(walk,false);installReferenceUI(this.referenceImages);this.ready=true;}catch(err){this.error=err.message;this.ready=true;}}
 setRoomAnchor(player,force=false){const key=roomAt(player);if(force||this.photoRoom!==key){this.photoRoom=key;this.photoAnchor={x:player.x,z:player.z};this.photoYaw=player.yaw;}}
 photoBackground(game,eye,yaw,pitch,fov=Math.PI*.33){
  if(!this.referenceImages)return;this.setRoomAnchor(game.player);const gl=this.gl,key=roomAt(game.player),inside=key==='k'&&game.flags.intruded,cacheKey=key+(inside?'-inside':'');
  let faces=this.photoCache.get(cacheKey);if(!faces){faces=roomPhotoFaces(this.referenceImages,key,inside).map(c=>this.uploadTexture(c,false));this.photoCache.set(cacheKey,faces);while(this.photoCache.size>3){const oldest=this.photoCache.keys().next().value;if(oldest===cacheKey)break;this.photoCache.get(oldest).forEach(t=>gl.deleteTexture(t));this.photoCache.delete(oldest);}}
  gl.useProgram(this.photoProgram);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.bindBuffer(gl.ARRAY_BUFFER,this.photoQuad);gl.enableVertexAttribArray(this.photoA);gl.vertexAttribPointer(this.photoA,2,gl.FLOAT,false,8,0);
  ['uFront','uRight','uBack','uLeft'].forEach((name,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,faces[i]);gl.uniform1i(this.photoU[name],i);});
  const ax=eye[0]-this.photoAnchor.x,az=eye[2]-this.photoAnchor.z,cy=Math.cos(this.photoYaw),sy=Math.sin(this.photoYaw),clamp=n=>Math.max(-4.8,Math.min(4.8,n*.7));
  gl.uniform3fv(this.photoU.uOffset,[clamp(ax*cy+az*sy),eye[1]-1.58,clamp(-ax*sy+az*cy)]);gl.uniform3fv(this.photoU.uTurn,[yaw-this.photoYaw,pitch,this.canvas.width/this.canvas.height]);gl.uniform3fv(this.photoU.uBox,[6,3.4223394,6.084159]);gl.uniform1f(this.photoU.uFov,Math.tan(fov/2));gl.uniform1f(this.photoU.uPower,key==='y'||(game.flags.power&&(key!=='k'||game.flags.kitchenLight))?1:.03);gl.uniform1f(this.photoU.uFlash,game.player.flashlight?1:0);gl.uniform1f(this.photoU.uBurst,game.flash>0?game.flash:0);gl.drawArrays(gl.TRIANGLES,0,6);
  gl.activeTexture(gl.TEXTURE0);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);gl.useProgram(this.p);
 }
 uploadTexture(src,repeat=false){const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);return t;}
 uploadMesh(m){const gl=this.gl;return [...m.data].map(([mat,data])=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {mat,b,count:data.length/8};});}
 resize(){const max=this.quality===.65?1:1.5,dpr=Math.min(window.devicePixelRatio||1,max)*this.quality;const w=Math.round(this.canvas.clientWidth*dpr),h=Math.round(this.canvas.clientHeight*dpr);if(w>0&&h>0&&(this.canvas.width!==w||this.canvas.height!==h)){this.canvas.width=w;this.canvas.height=h;}}
 bind(b){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,b);for(const [name,size,offset] of [['aPos',3,0],['aNormal',3,12],['aUV',2,24]]){gl.enableVertexAttribArray(this.a[name]);gl.vertexAttribPointer(this.a[name],size,gl.FLOAT,false,32,offset);}}
 render(game,now=0,cameraOverride=null){const gl=this.gl,c=this.canvas,p=game.player,eye=cameraOverride?.eye||[p.x,p.hidden ? .92 : p.crouch?1.08:1.58+Math.sin(this.bob*8)*Math.min(.026,this.bobAmplitude||0),p.z];const yaw=cameraOverride?.yaw??p.yaw,pitch=cameraOverride?.pitch??p.pitch,v=view(eye,yaw,pitch),aspect=c.width/c.height;gl.viewport(0,0,c.width,c.height);gl.clearColor(.022,.027,.036,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.activeTexture(gl.TEXTURE0);gl.useProgram(this.p);gl.uniformMatrix4fv(this.u.uVP,false,multiply(perspective(cameraOverride?.fov||Math.PI*.33,aspect),v.m));gl.uniform3fv(this.u.uEye,eye);gl.uniform3fv(this.u.uForward,v.f);gl.uniform1i(this.u.uTex,0);
  const lightList=p.floor===0?[[4.7,1.3,12],[14.7,1.7,14.8],[15.8,2.35,7],[7,2.35,7],[19.8,2.25,15.5],[8,2.4,14],[5,2.4,11],[13.5,2.5,16]]:p.floor===1?[[10.5,1.4,11.5],[8,2.4,3],[14.5,2.4,8],[6,2.4,14],[8,1.6,10],[9,2.4,8],[15,2.3,3],[15,2.4,11]]:[[9,2.55,7],[15,2.3,10],[5,2.4,5],[17,2.4,5],[10,2.4,4],[9,2.5,9],[12,2.4,10],[16,2.4,8]];
  gl.uniform3fv(this.u['uLights[0]'],lightList.flat());gl.uniform1f(this.u.uPower,game.flags.power?1:.08);gl.uniform1f(this.u.uKitchen,game.flags.kitchenLight?1:0);gl.uniform1f(this.u.uFlash,p.flashlight?1:game.flash>0?2.4:0);gl.uniform1f(this.u.uOutdoor,roomAt(p)==='y'?1:0);gl.uniform1f(this.u.uEmission,0);
  gl.colorMask(false,false,false,false);
  for(const group of this.meshes[p.floor]){this.bind(group.b);gl.bindTexture(gl.TEXTURE_2D,this.tex[group.mat]||this.tex.black);gl.uniform1f(this.u.uEmission,['tv','light','window'].includes(group.mat)?group.mat==='window'?.28:.75:0);gl.drawArrays(gl.TRIANGLES,0,group.count);}
  const dynamic=new Mesh();for(const door of DOORS.filter(d=>d.floor===p.floor)){const d=game.doors[door.id];if(!d.open)dynamic.box('door',door.x,0,door.z,door.axis==='x'?1:.11,2.6,door.axis==='x'?.11:1);if(d.barricaded)dynamic.box('wood',door.x,.6,door.z+.3,.7,.65,.3);}
  if(!game.flags.power)for(const h of HIDES.filter(h=>h.floor===p.floor))dynamic.box('black',h.x,0,h.z,.05,.07,.05);
  for(const [mat,data] of dynamic.data){gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamic);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);this.bind(this.dynamic);gl.bindTexture(gl.TEXTURE_2D,this.tex[mat]||this.tex.black);gl.uniform1f(this.u.uEmission,0);gl.drawArrays(gl.TRIANGLES,0,data.length/8);}
  gl.colorMask(true,true,true,true);this.photoBackground(game,eye,yaw,pitch,cameraOverride?.fov||Math.PI*.33);
  if(game.enemy.floor===p.floor)this.drawEnemy(game,eye,now);
 }
 drawEnemy(game,eye,now){const e=game.enemy,gl=this.gl,a=Math.atan2(eye[2]-e.z,eye[0]-e.x),r=[-Math.sin(a),Math.cos(a)],w=Math.cos(a-e.yaw)>.45?.73:.435,h=1.87,bob=e.mode==='chase'||e.mode==='patrol'?Math.sin(now*6)*.024:0;
  const mesh=new Mesh(),positions=[[e.x-r[0]*w/2,bob,e.z-r[1]*w/2],[e.x+r[0]*w/2,bob,e.z+r[1]*w/2],[e.x+r[0]*w/2,h+bob,e.z+r[1]*w/2],[e.x-r[0]*w/2,h+bob,e.z-r[1]*w/2]];
  mesh.quad('enemy',positions,[Math.cos(a),0,Math.sin(a)]);const data=mesh.data.get('enemy');gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamic);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);this.bind(this.dynamic);const facing=Math.cos(a-e.yaw)>.45;const texture=facing?this.tex.enemyFront:this.tex.enemyWalk;if(!texture)return;gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1f(this.u.uEmission,.12);gl.drawArrays(gl.TRIANGLES,0,6);
 }
 async panorama(game){
  const gl=this.gl,c=this.canvas,oldW=c.width,oldH=c.height;const n=384;c.width=c.height=n;const p=game.player,eye=[p.x,1.58,p.z];const cameras=[{yaw:0,pitch:0},{yaw:Math.PI,pitch:0},{yaw:Math.PI/2,pitch:0},{yaw:-Math.PI/2,pitch:0},{yaw:0,pitch:Math.PI/2},{yaw:0,pitch:-Math.PI/2}],faces=[];
  try{for(const cam of cameras){this.render(game,game.elapsed,{...cam,eye,fov:Math.PI/2});const buf=new Uint8Array(n*n*4);gl.readPixels(0,0,n,n,gl.RGBA,gl.UNSIGNED_BYTE,buf);faces.push(buf);}const out=makeCanvas();out.width=2048;out.height=1024;const ctx=out.getContext('2d'),im=ctx.createImageData(out.width,out.height);
   for(let y=0;y<out.height;y++){const phi=(.5-(y+.5)/out.height)*Math.PI,cp=Math.cos(phi),dy=Math.sin(phi);for(let x=0;x<out.width;x++){const th=((x+.5)/out.width-.5)*TAU,dx=cp*Math.cos(th),dz=cp*Math.sin(th),ax=Math.abs(dx),ay=Math.abs(dy),az=Math.abs(dz);let f,u,v;if(ax>=ay&&ax>=az){f=dx>=0?0:1;u=dx>=0?dz/ax:-dz/ax;v=dy/ax;}else if(az>=ax&&az>=ay){f=dz>=0?2:3;u=dz>=0?-dx/az:dx/az;v=dy/az;}else{f=dy>=0?4:5;u=dz/ay;v=dy>=0?-dx/ay:dx/ay;}const sx=Math.max(0,Math.min(n-1,Math.floor((u+1)*.5*n))),sy=Math.max(0,Math.min(n-1,Math.floor((v+1)*.5*n))),si=(sy*n+sx)*4,di=(y*out.width+x)*4;im.data[di]=faces[f][si];im.data[di+1]=faces[f][si+1];im.data[di+2]=faces[f][si+2];im.data[di+3]=255;}}
   ctx.putImageData(im,0,0);return {dataURL:out.toDataURL('image/jpeg',.82),width:out.width,height:out.height};
  }finally{c.width=oldW;c.height=oldH;this.render(game,game.elapsed);}
 }
}
export class PanoramaViewer {
 constructor(canvas){this.canvas=canvas;this.yaw=0;this.pitch=0;this.gl=canvas.getContext('webgl',{alpha:false,antialias:true});if(!this.gl)return;const gl=this.gl;this.p=program(gl,'attribute vec2 aPos;varying vec2 vUV;void main(){vUV=aPos*.5+.5;gl_Position=vec4(aPos,0.0,1.0);}',PANO_FRAGMENT);this.buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);this.tex=null;this.u=Object.fromEntries(['uTex','uYaw','uPitch','uAspect'].map(k=>[k,gl.getUniformLocation(this.p,k)]));this.a=gl.getAttribLocation(this.p,'aPos');}
 set(src){const img=new Image();img.onload=()=>{this.image=img;const gl=this.gl;if(!gl)return;if(this.tex)gl.deleteTexture(this.tex);this.tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);this.draw();};img.src=src;}
 draw(){const gl=this.gl;if(!gl||!this.tex)return;const c=this.canvas;c.width=Math.max(320,Math.round(c.clientWidth));c.height=Math.max(180,Math.round(c.clientHeight));gl.viewport(0,0,c.width,c.height);gl.useProgram(this.p);gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);gl.enableVertexAttribArray(this.a);gl.vertexAttribPointer(this.a,2,gl.FLOAT,false,8,0);gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.uniform1i(this.u.uTex,0);gl.uniform1f(this.u.uYaw,this.yaw);gl.uniform1f(this.u.uPitch,this.pitch);gl.uniform1f(this.u.uAspect,c.width/c.height);gl.drawArrays(gl.TRIANGLES,0,6);}
 look(dx,dy){this.yaw+=dx;this.pitch=Math.max(-1.5,Math.min(1.5,this.pitch+dy));this.draw();}
 dispose(){if(this.gl){if(this.tex)this.gl.deleteTexture(this.tex);this.gl.deleteBuffer(this.buf);this.gl.deleteProgram(this.p);}}
}
