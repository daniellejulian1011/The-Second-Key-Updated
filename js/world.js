export const TAU = Math.PI * 2;
export const ROOM_NAMES = {y:'YARD & DRIVEWAY',l:'LIVING ROOM',f:'FRONT FOYER',d:'DINING ROOM',k:'KITCHEN',g:'GARAGE',h:'UPSTAIRS LANDING',e:'EVELYN’S BEDROOM',p:'PARENTS’ BEDROOM',a:'BATHROOM',b:'BASEMENT — LAUNDRY',s:'BASEMENT — STORAGE'};
function grid(w,h) { return Array.from({length:h},()=>Array(w).fill('#')); }
function fill(map,x1,z1,x2,z2,t) { for(let z=z1;z<=z2;z++) for(let x=x1;x<=x2;x++) map[z][x]=t; }
const ground=grid(26,23);
fill(ground,1,1,24,21,'y'); fill(ground,2,3,20,18,'#'); fill(ground,16,11,24,19,'#');
fill(ground,3,11,10,17,'l'); fill(ground,12,11,15,17,'f'); fill(ground,3,4,10,9,'d'); fill(ground,12,4,19,9,'k'); fill(ground,3,10,19,10,'f'); fill(ground,17,12,23,18,'g');
ground[14][11]='l'; ground[7][11]='d'; ground[15][16]='g'; ground[18][13]='f'; ground[3][16]='k'; ground[19][21]='g';
const upstairs=grid(21,16);
fill(upstairs,13,2,16,12,'h'); fill(upstairs,4,7,11,12,'e'); fill(upstairs,4,2,11,5,'p'); fill(upstairs,4,14,10,14,'a'); fill(upstairs,11,13,16,14,'h');
upstairs[9][12]='e'; upstairs[4][12]='p'; upstairs[13][11]='a';
const basement=grid(21,15);
fill(basement,3,3,14,11,'b'); fill(basement,16,3,18,11,'s'); basement[10][15]='b'; basement[5][15]='s';
export const FLOORS=[{id:0,name:'PRICE HOUSE',map:ground},{id:1,name:'UPSTAIRS',map:upstairs},{id:2,name:'BASEMENT',map:basement}];
export const DOORS=[
 {id:'front',floor:0,x:13.5,z:18.5,axis:'x',room:'f',label:'FRONT DOOR',outside:true},
 {id:'back',floor:0,x:16.5,z:3.5,axis:'x',room:'k',label:'KITCHEN BACK DOOR',outside:true},
 {id:'garage',floor:0,x:16.5,z:15.5,axis:'z',room:'g',label:'GARAGE DOOR',outside:false},
 {id:'shutter',floor:0,x:21.5,z:19.5,axis:'x',room:'g',label:'GARAGE SHUTTER',outside:true}
];
export const LINKS=[
 {id:'upstairs',a:{floor:0,x:14.5,z:11.5},b:{floor:1,x:14.5,z:11.5},labelA:'GO UPSTAIRS',labelB:'GO DOWNSTAIRS',duration:3.2},
 {id:'basement',a:{floor:0,x:18.5,z:9.5},b:{floor:2,x:15.5,z:10.5},labelA:'DESCEND TO THE BASEMENT',labelB:'GO BACK TO THE KITCHEN',duration:3.8},
 {id:'cellar',a:{floor:2,x:4.5,z:3.5},b:{floor:0,x:7.5,z:2.5},labelA:'OPEN THE STORM CELLAR',labelB:'ENTER THE STORM CELLAR',duration:3.5,locked:'cellarOpen'}
];
export const HIDES=[
 {id:'couch',floor:0,x:4.5,z:16.5,room:'l',name:'BEHIND THE SOFA'},
 {id:'coat',floor:0,x:15.5,z:16.7,room:'f',name:'IN THE COAT CLOSET'},
 {id:'wardrobe',floor:1,x:5.5,z:9.5,room:'e',name:'IN YOUR WARDROBE'},
 {id:'parentsCloset',floor:1,x:5.5,z:3.5,room:'p',name:'IN THE BEDROOM CLOSET'},
 {id:'laundry',floor:2,x:12.5,z:10.5,room:'b',name:'BEHIND THE LAUNDRY SCREEN'}
];
// Every furnished object is shared by rendering and collision. Positions are in metres.
export const FURNITURE=[
 {floor:0,x:4.5,z:14,w:1.05,d:3.0,h:.85,type:'sofa',mat:'floral'},
 {floor:0,x:6.8,z:14,w:1.3,d:2.1,h:.48,type:'table',mat:'wood'},
 {floor:0,x:9.95,z:14,w:.8,d:1.8,h:1.1,type:'television',mat:'darkWood'},
 {floor:0,x:3.7,z:11.75,w:.8,d:1.4,h:2.05,type:'bookcase',mat:'wood'},
 {floor:0,x:4.7,z:12,w:.7,d:.7,h:.6,type:'lamp',mat:'wood'},
 {floor:0,x:9.6,z:17,w:1.35,d:.7,h:.75,type:'telephone',mat:'wood'},
 {floor:0,x:14.9,z:14.8,w:.55,d:1.3,h:.8,type:'console',mat:'wood'},
 {floor:0,x:14.95,z:16.9,w:.55,d:1.35,h:2.3,type:'closet',mat:'darkWood',hide:true},
 {floor:0,x:7,z:7,w:3,d:1.4,h:.82,type:'dining',mat:'wood'},
 {floor:0,x:3.7,z:7.5,w:.8,d:2.2,h:1.4,type:'sideboard',mat:'wood'},
 {floor:0,x:13,z:5.3,w:1.2,d:1.2,h:1,type:'sink',mat:'tile'},
 {floor:0,x:13,z:7,w:1.2,d:1.7,h:1,type:'counter',mat:'wood'},
 {floor:0,x:17.6,z:4.7,w:1.5,d:.8,h:1,type:'counter',mat:'wood'},
 {floor:0,x:19,z:5.6,w:1,d:1.3,h:2.05,type:'fridge',mat:'enamel'},
 {floor:0,x:15.6,z:7.6,w:1.7,d:1.25,h:.8,type:'dining',mat:'wood'},
 {floor:0,x:23,z:13.3,w:.75,d:2.0,h:1,type:'toolbench',mat:'wood'},
 {floor:0,x:19.8,z:15.5,w:1.65,d:3.3,h:1.25,type:'car',mat:'car'},
 {floor:1,x:8.1,z:11,w:2.5,d:2.6,h:.75,type:'bed',mat:'floral'},
 {floor:1,x:10.6,z:7.65,w:1.2,d:.7,h:.85,type:'desk',mat:'wood'},
 {floor:1,x:4.6,z:9.6,w:.7,d:1.5,h:2.2,type:'closet',mat:'darkWood',hide:true},
 {floor:1,x:10.5,z:11.5,w:.7,d:.7,h:.6,type:'lamp',mat:'wood'},
 {floor:1,x:7.8,z:2.9,w:2.4,d:1.6,h:.75,type:'bed',mat:'floral'},
 {floor:1,x:10.5,z:4.8,w:1.2,d:.65,h:.9,type:'telephone',mat:'wood'},
 {floor:1,x:4.55,z:3.55,w:.7,d:1.2,h:2.2,type:'closet',mat:'darkWood',hide:true},
 {floor:1,x:6,z:14.55,w:1.5,d:.4,h:.8,type:'sink',mat:'enamel'},
 {floor:2,x:9,z:3.8,w:1.5,d:1,h:1.05,type:'washer',mat:'enamel'},
 {floor:2,x:11,z:3.8,w:1.5,d:1,h:1.05,type:'washer',mat:'enamel'},
 {floor:2,x:17.8,z:6,w:.8,d:4,h:2.1,type:'shelves',mat:'wood'},
 {floor:2,x:7,z:7,w:.28,d:.28,h:2.8,type:'post',mat:'wood'},
 {floor:2,x:12.8,z:11.5,w:2.1,d:.12,h:1.8,type:'screen',mat:'linen',hide:true}
];
export const ITEMS=[
 {id:'phone',floor:0,x:9.3,z:16.2,y:1,label:'ANSWER THE TELEPHONE',type:'phone'},
 {id:'tv',floor:0,x:9.2,z:13.2,y:1.2,label:'INSPECT THE TELEVISION',type:'tv'},
 {id:'message',floor:0,x:14.2,z:14.5,y:1.2,label:'PLAY GLORIA’S MESSAGE',type:'tape'},
 {id:'sleepPhoto',floor:0,x:13.8,z:6.8,y:1.2,label:'SEARCH THE KITCHEN DRAWER',type:'evidence',evidence:'sleepPhoto'},
 {id:'mud',floor:0,x:16.4,z:4.65,y:.1,label:'EXAMINE THE MUDDY MARK',type:'evidence',evidence:'mud'},
 {id:'camera',floor:1,x:10.35,z:8.8,y:1.1,label:'PICK UP YOUR CAMERA',type:'camera'},
 {id:'diary',floor:1,x:8.1,z:9.5,y:1.1,label:'READ YOUR DIARY',type:'diary'},
 {id:'invoice',floor:1,x:10.4,z:4.05,y:1.2,label:'READ THE REPAIR INVOICE',type:'evidence',evidence:'invoice'},
 {id:'upPhone',floor:1,x:9.6,z:4.8,y:1.2,label:'USE THE BEDROOM TELEPHONE',type:'phone'},
 {id:'bathWindow',floor:1,x:9.7,z:14.5,y:1.5,label:'CHECK THE FROSTED WINDOW',type:'window'},
 {id:'copyKey',floor:0,x:22.1,z:13.4,y:1.1,label:'SEARCH THE TOOLBOX',type:'evidence',evidence:'copyKey'},
 {id:'car',floor:0,x:18.7,z:16.8,y:1,label:'TRY THE FAMILY CAR',type:'car'},
 {id:'battery',floor:0,x:22.2,z:14.3,y:1,label:'TAKE SPARE BATTERIES',type:'battery'},
 {id:'breaker',floor:2,x:14.1,z:6,y:1.6,label:'RESTORE THE POWER',type:'breaker'},
 {id:'tape',floor:2,x:17.1,z:4,y:1,label:'PLAY THE OBSERVATION TAPE',type:'evidence',evidence:'tape'},
 {id:'record',floor:2,x:16.3,z:5.1,y:1,label:'RECORD YOUR EVIDENCE',type:'record'},
 {id:'cellarKey',floor:2,x:5.4,z:4.5,y:1,label:'TAKE THE STORM-CELLAR KEY',type:'key'},
 {id:'mailbox',floor:0,x:8.5,z:20.6,y:1.3,label:'LEAVE THE RECORDED TAPE',type:'mailbox'},
 {id:'neighbor',floor:0,x:2.1,z:20.3,y:1,label:'REACH THE NEIGHBOR’S PORCH',type:'escape'},
 {id:'gate',floor:0,x:22.5,z:2.1,y:1,label:'ESCAPE THROUGH THE BACK GATE',type:'escape'},
 {id:'distraction',floor:0,x:5.5,z:8.8,y:.8,label:'SET A RADIO DISTRACTION',type:'distraction'},
 {id:'window',floor:0,x:3.3,z:13.1,y:1.6,label:'LOOK THROUGH THE WINDOW',type:'window'},
 {id:'kitchenLight',floor:0,x:17.3,z:6,y:1.5,label:'TOGGLE THE KITCHEN LIGHT',type:'light'}
];
export const EVIDENCE={
 mud:{title:'A mark by the back door',body:'Fresh mud on the inside of the kitchen mat. The door was closed. Someone has already crossed this threshold.'},
 sleepPhoto:{title:'The sleeping photograph',body:'You are asleep on the living-room sofa. On the back: “You looked so peaceful. I didn’t want to wake you.” The photograph was taken inside the house. Tonight was never the beginning.'},
 invoice:{title:'September 4 — service invoice',body:'Price residence. Electrical fault. Technician: Nathaniel Cross. Access to utility panel and house keys. In Gloria’s handwriting: “Spare key returned.” A key can be returned after it has been copied.'},
 copyKey:{title:'The second key',body:'A brass duplicate in a repair sleeve, marked PRICE. Fresh grooves match the family key. He used his trusted service visit to give himself a way in.'},
 tape:{title:'An observation cassette',body:'October 12. Kitchen light, 9:06. Parents away on Fridays. Bedroom, second floor. He recorded routines and the utility access he had left unsecured. He mistakes surveillance for intimacy.'},
 sighting:{title:'Nathaniel — photographic evidence',body:'Your camera places Nathaniel Cross at the Price residence tonight. Keep the film. Tell Deputy Ortiz exactly who is here and how he got access.'}
};
export function tile(floor,x,z){return FLOORS[floor]?.map[Math.floor(z)]?.[Math.floor(x)]||'#';}
export function roomAt(p){return tile(p.floor,p.x,p.z);}
export function doorAt(floor,x,z){return DOORS.find(d=>d.floor===floor&&Math.floor(d.x)===Math.floor(x)&&Math.floor(d.z)===Math.floor(z));}
export function distance(a,b){return a.floor!==b.floor?Infinity:Math.hypot(a.x-b.x,a.z-b.z);}
export function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
export function freeAt(floor,x,z,doors={},radius=.19,ignoreDoors=false){
 for(const [dx,dz] of [[-radius,-radius],[radius,-radius],[-radius,radius],[radius,radius]]){
  if(tile(floor,x+dx,z+dz)==='#')return false;
  const door=doorAt(floor,x+dx,z+dz);if(!ignoreDoors&&door&&!doors[door.id]?.open)return false;
 }
 for(const o of FURNITURE){if(o.floor===floor&&Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius)return false;}
 return true;
}
export function visible(a,b,doors={}){
 if(a.floor!==b.floor)return false;
 const len=Math.hypot(a.x-b.x,a.z-b.z),n=Math.max(1,Math.ceil(len/.075));
 for(let i=1;i<n;i++){const x=a.x+(b.x-a.x)*i/n,z=a.z+(b.z-a.z)*i/n;
  if(tile(a.floor,x,z)==='#')return false; const d=doorAt(a.floor,x,z);if(d&&!doors[d.id]?.open)return false;
 }return true;
}
function key(n){return `${n.floor},${Math.floor(n.x)},${Math.floor(n.z)}`;}
export function route(from,to,doors={},flags={},enemy=false){
 if(!FLOORS[from.floor]||!FLOORS[to.floor])return [];
 const start={floor:from.floor,x:Math.floor(from.x)+.5,z:Math.floor(from.z)+.5};
 const goal=key(to),startKey=key(start),queue=[start],seen=new Map([[startKey,null]]),nodes=new Map([[startKey,start]]);
 for(let head=0;head<queue.length;head++){
  const n=queue[head],nk=key(n);if(nk===goal){const out=[];let k=nk;while(k!==startKey){out.push(nodes.get(k));k=seen.get(k);}return out.reverse();}
  const next=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dz])=>({floor:n.floor,x:n.x+dx,z:n.z+dz}));
  for(const l of LINKS){if(l.locked&&!flags[l.locked])continue;for(const [a,b] of [[l.a,l.b],[l.b,l.a]])if(key(a)===nk)next.push({...b,link:l.id});}
  for(const t of next){const k=key(t);if(seen.has(k)||!freeAt(t.floor,t.x,t.z,doors,enemy?.14:.21,enemy))continue;seen.set(k,nk);nodes.set(k,t);queue.push(t);}
 }return [];
}
export const PATROL=[
 {floor:0,x:16.5,z:5.5},{floor:0,x:9.5,z:10.5},{floor:0,x:8.5,z:15.5},{floor:0,x:14.5,z:13.5},
 {floor:1,x:14.5,z:11.5},{floor:1,x:7.5,z:8.5},{floor:1,x:9.5,z:4.5},
 {floor:2,x:15.5,z:10.5},{floor:2,x:10.5,z:8.5},{floor:2,x:17.5,z:10.5}
];
