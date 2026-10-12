import {TAU,DOORS,LINKS,HIDES,ITEMS,EVIDENCE,ROOM_NAMES,PATROL,tile,roomAt,doorAt,distance,angleDiff,freeAt,visible,route} from './world.js';
export const SAVE_VERSION=3;
export const MODES={
 easy:{name:'EASY',speed:1.02,vision:6.2,entryDelay:125,search:5,breath:36,police:100,film:24,battery:260},
 normal:{name:'NORMAL',speed:1.4,vision:8,entryDelay:85,search:4,breath:26,police:135,film:18,battery:210},
 nightmare:{name:'NIGHTMARE',speed:1.83,vision:10.5,entryDelay:48,search:3,breath:18,police:165,film:12,battery:155}
};
export const ENDINGS=[
 {id:'keys',number:'01',title:'NO MORE KEYS',kind:'SECRET · BEST ENDING',text:'The blue lights stay until sunrise. You give Ortiz the service invoice, the duplicate key, the photographs and the tape. Nathaniel’s account collapses under evidence he cannot explain away. The locks are replaced. His second key opens nothing.',hint:'Tell Ortiz Nathaniel’s name and address; collect four separate clues, including the key or repair invoice. Survive until the police reach you.'},
 {id:'blue',number:'02',title:'BLUE LIGHTS',kind:'SURVIVAL ENDING',text:'Deputy Ortiz finds you alive. Rain washes the footprints from the back path before anyone follows them. Nathaniel has gone. April sits beside you until morning. Every time the telephone rings, you wait for her to answer.',hint:'Call 911 with your full address and survive the response timer.'},
 {id:'porch',number:'03',title:'THE NEIGHBOR’S PORCH',kind:'ESCAPE ENDING',text:'You cross the road in your socks. A neighbor opens the door before you can knock twice. You hear the deadbolt behind you and, for the first time tonight, it sounds like safety. April’s warning reached the right person.',hint:'Ask April to alert the neighbors, then reach the front-left corner of the yard.'},
 {id:'gate',number:'04',title:'THE BACK GATE',kind:'ESCAPE ENDING',text:'The storm-cellar door lifts into rain. Beyond the garage, the gate is still loose on its hinges. You leave the house behind without looking at the upstairs window. Somewhere inside, a man keeps calling your name.',hint:'Find the cellar key, open the cellar route, and reach the back gate. Keep Nathaniel away from the route.'},
 {id:'message',number:'05',title:'ONE LAST MESSAGE',kind:'BITTERSWEET ENDING',text:'April finds the cassette in the mailbox. Your voice is steady until the final seconds. The recording reaches Ortiz with the other evidence. Tonight has taken you from the house, but it has not erased what Nathaniel did.',hint:'Record at least two discoveries, leave the cassette in the mailbox, then fail to escape.'},
 {id:'dinner',number:'06',title:'DINNER FOR TWO',kind:'DARK ENDING',text:'Two plates wait under the kitchen light. You never agreed to dinner. Nathaniel has spent months rehearsing this ordinary moment. The chair opposite his is pulled out. The house has become the shape of his story.',hint:'Choose to meet him for dinner at the back door. This is a dangerous choice.'},
 {id:'letin',number:'07',title:'YOU LET HIM IN',kind:'BAD ENDING',text:'He thanks you for opening the door. Then he stops asking. The soft voice was never a promise of safety; it was a way to get past the last boundary you controlled.',hint:'Open the back door for Nathaniel after the first call.'},
 {id:'ring',number:'08',title:'THE HOLLOW RING',kind:'FAILURE ENDING',text:'The telephone keeps ringing in the room you could not reach. The screen goes dark. Someone lets the answering machine take the call.',hint:'Nathaniel reaches you before help or an escape route is secured.'}
];
const clone=x=>JSON.parse(JSON.stringify(x));
export class Game {
 constructor(mode='normal',emit=()=>{}){this.emit=emit;this.reset(mode);}
 reset(mode='normal',arrival=false){
  this.mode=MODES[mode]?mode:'normal';this.cfg=MODES[this.mode];this.active=true;this.elapsed=0;this.clockBase=22*60+47;this.stage=1;
  this.player={floor:0,x:arrival?13.5:7.6,z:arrival?20.5:16.2,yaw:arrival?-Math.PI/2:-.48,pitch:0,stamina:100,breath:100,battery:100,film:this.cfg.film,equip:'flashlight',flashlight:false,crouch:false,hidden:null,holding:false};
  this.enemy={floor:0,x:16.5,z:2.5,yaw:Math.PI/2,mode:'outside',path:[],target:null,patrol:0,think:0,searchTime:0,doorTime:0,stun:0,transit:null,lastSeen:null,lastSeenAt:-1000,sawHide:false};
  this.doors=Object.fromEntries(DOORS.map(d=>[d.id,{open:d.id==='garage',locked:false,barricaded:false}]));
  this.flags={camera:false,phoneAnswered:false,april:false,police:false,policeNamed:false,address:false,power:true,restored:false,kitchenLight:true,cellarKey:false,cellarOpen:false,recorded:false,mailed:false,gloria:false,intruded:false,prologue:arrival};
  this.evidence=[];this.noises=[];this.log=[];this.trail=[];this.autoPath=[];this.queuedAction=null;this.transit=null;this.policeLeft=0;this.freeze=0;this.flash=0;this.fear=0;this.ending=null;this.pendingEnding=null;this.entryAt=0;this.checkpoint=null;this.lastSteps=0;this.lastTrail=0;this.lastCheckpointAt=0;this.lastToast=-10;this.lastSeenRoom=roomAt(this.player);this.used=new Set();
  this.caption('EVELYN','The house sounds different when no one else is home.');this.makeCheckpoint(true);this.emit('reset',{});
 }
 caption(speaker,text){this.log.push({speaker,text,time:this.time()});if(this.log.length>100)this.log.shift();this.emit('caption',{speaker,text});}
 sound(name,p=null,volume=1){this.emit('sound',{name,pos:p,volume});}
 toast(text){this.emit('toast',text);}
 time(){const minutes=this.clockBase+Math.floor(this.elapsed*.48);let h=Math.floor(minutes/60)%24;return `${h%12||12}:${String(minutes%60).padStart(2,'0')} ${h<12?'AM':'PM'}`;}
 room(){return ROOM_NAMES[roomAt(this.player)]||'PRICE HOUSE';}
 objective(){
  if(this.policeLeft>0)return `Ortiz is coming. Stay alive. ${Math.ceil(this.policeLeft)}s`;
  if(this.flags.intruded)return this.flags.cellarKey?'Open the cellar or reach a telephone.':'He is inside. Find evidence. Get help. Get out.';
  if(!this.flags.phoneAnswered)return 'The telephone is ringing.';
  if(!this.flags.camera)return 'Find your camera upstairs. Secure the doors.';
  return 'Find out how he knows the house.';
 }
 snapshot(){return clone({version:SAVE_VERSION,mode:this.mode,elapsed:this.elapsed,clockBase:this.clockBase,stage:this.stage,player:this.player,enemy:this.enemy,doors:this.doors,flags:this.flags,evidence:this.evidence,policeLeft:this.policeLeft,pendingEnding:this.pendingEnding,entryAt:this.entryAt,log:this.log,used:[...this.used]});}
 restore(s){
  if(!s||s.version!==SAVE_VERSION||!MODES[s.mode]||!s.player||!s.enemy||!s.flags||!s.doors||!Array.isArray(s.evidence))return false;
  for(const p of [s.player,s.enemy])if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||!Number.isInteger(p.floor)||p.floor<0||p.floor>2||tile(p.floor,p.x,p.z)==='#')return false;
  if(!Number.isFinite(s.elapsed)||s.elapsed<0||s.elapsed>86400)return false;
  if(!Number.isFinite(s.clockBase)||!Number.isFinite(s.policeLeft)||s.policeLeft<0||!Array.isArray(s.log)||!Array.isArray(s.used))return false;
  if(!s.log.every(e=>e&&typeof e.speaker==='string'&&typeof e.text==='string'&&typeof e.time==='string'))return false;
  if(!s.evidence.every(id=>EVIDENCE[id])||(s.pendingEnding!==null&&!ENDINGS.some(e=>e.id===s.pendingEnding)))return false;
  for(const field of ['yaw','pitch','stamina','breath','battery','film'])if(!Number.isFinite(s.player[field]))return false;
  for(const field of ['stamina','breath','battery'])if(s.player[field]<0||s.player[field]>100)return false;
  if(s.player.film<0||!Number.isFinite(s.enemy.yaw)||!['flashlight','camera','photo'].includes(s.player.equip))return false;
  if(DOORS.some(d=>!s.doors[d.id]||['open','locked','barricaded'].some(k=>typeof s.doors[d.id][k]!=='boolean')))return false;
  if(Object.values(s.flags).some(v=>typeof v!=='boolean'))return false;
  const copy=clone(s);this.reset(copy.mode);for(const key of ['elapsed','clockBase','stage','player','enemy','doors','flags','evidence','policeLeft','pendingEnding','entryAt','log'])if(copy[key]!==undefined)this[key]=copy[key];
  this.used=new Set(copy.used||[]);this.active=true;this.ending=null;this.autoPath=[];this.transit=null;this.noises=[];this.enemy.path=[];this.enemy.think=0;this.freeze=1.7;this.checkpoint=clone(copy);this.emit('restored',{});return true;
 }
 makeCheckpoint(force=false){if(!force&&(this.enemy.mode==='chase'||distance(this.player,this.enemy)<5||this.player.hidden))return false;this.checkpoint=this.snapshot();this.lastCheckpointAt=this.elapsed;this.emit('checkpoint',this.checkpoint);return true;}
 addEvidence(id){if(!EVIDENCE[id]||this.evidence.includes(id))return false;this.evidence.push(id);this.sound('paper');this.toast(`EVIDENCE FOUND · ${EVIDENCE[id].title}`);this.emit('evidence',{id,...EVIDENCE[id]});this.makeCheckpoint();return true;}
 noise(level=1,pos=this.player,ttl=6){this.noises.push({...pos,level,ttl});}
 look(dx,dy){if(!this.active)return;this.player.yaw=(this.player.yaw+dx)%TAU;this.player.pitch=Math.max(-1.05,Math.min(1.05,this.player.pitch+dy));}
 move(dx,dz,dt,sprint=false){
  if(this.player.hidden||this.transit||!this.active)return;
  const p=this.player,len=Math.hypot(dx,dz);if(len<.05)return;
  const running=sprint&&p.stamina>3&&!p.crouch,speed=p.crouch?.9:running?3.35:1.9;
  if(running)p.stamina=Math.max(0,p.stamina-dt*19);
  const vx=(Math.cos(p.yaw)*dz-Math.sin(p.yaw)*dx)/Math.max(1,len)*speed*dt;
  const vz=(Math.sin(p.yaw)*dz+Math.cos(p.yaw)*dx)/Math.max(1,len)*speed*dt;
  this.tryMove(p,vx,vz,.21);this.lastSteps+=dt*speed;
  if(this.lastSteps>.95){this.lastSteps=0;this.sound(p.crouch?'softStep':'step',p,running?.65:.32);if(!p.crouch)this.noise(running?2.5:.7,p,1.6);}
 }
 tryMove(p,dx,dz,radius=.18){
  // Substeps stop fast movement from tunnelling through walls or closed doors.
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.09));
  for(let i=0;i<n;i++){if(freeAt(p.floor,p.x+dx/n,p.z,this.doors,radius))p.x+=dx/n;if(freeAt(p.floor,p.x,p.z+dz/n,this.doors,radius))p.z+=dz/n;}
 }
 navigate(to){if(this.player.hidden)this.unhide();const p=route(this.player,to,this.doors,this.flags);if(!p.length&&distance(this.player,to)>1.1){this.toast('That route is blocked. Try another door.');return false;}this.autoPath=p;this.toast('WALKING · Move manually to stop');return true;}
 useLink(id){const l=LINKS.find(l=>l.id===id);if(!l)return false;const near=distance(this.player,l.a)<1.7?l.a:distance(this.player,l.b)<1.7?l.b:null;if(!near){this.navigate(l.a.floor===this.player.floor?l.a:l.b);return false;}
  if(l.locked&&!this.flags[l.locked]){if(!this.flags.cellarKey){this.caption('EVELYN','The storm cellar is locked. There should be a key down here.');return false;}this.flags.cellarOpen=true;this.noise(2);this.caption('EVELYN','Cold air. Rain. A way out.');}
  const other=near===l.a?l.b:l.a;this.transit={remaining:l.duration,total:l.duration,to:{...other},from:{...this.player}};this.autoPath=[];this.sound('stairs');return true;
 }
 hide(id){const h=HIDES.find(h=>h.id===id);if(!h||distance(this.player,h)>1.9||this.player.hidden)return false;
  const seen=distance(this.player,this.enemy)<this.cfg.vision&&visible(this.enemy,this.player,this.doors)&&this.enemy.mode==='chase';
  this.player.hidden=id;this.player.holding=false;this.player.flashlight=false;this.player.x=h.x;this.player.z=h.z;this.autoPath=[];this.enemy.sawHide=seen;this.noise(seen?1.2:.18,this.player,1.5);
  this.caption('EVELYN',seen?'He saw me come in. This won’t hold him.':'Stay still. Listen. Don’t breathe when he comes close.');this.sound('cloth');return true;
 }
 unhide(){if(!this.player.hidden)return;this.player.hidden=null;this.player.holding=false;this.sound('cloth');this.freeze=.45;}
 equip(id){if(id==='camera'&&!this.flags.camera){this.toast('Your camera is on the desk in your bedroom.');return false;}this.player.equip=id;this.sound('equip');if(id!=='flashlight')this.player.flashlight=false;this.emit('equip',id);return true;}
 toggleFlashlight(){if(this.player.equip!=='flashlight')this.equip('flashlight');this.player.flashlight=!this.player.flashlight&&this.player.battery>0;this.sound('switch');}
 shoot(){
  if(!this.flags.camera){this.toast('Find your camera upstairs first.');return false;}if(this.player.film<=0){this.toast('The film is empty.');return false;}if(!this.active||this.player.hidden)return false;
  this.player.equip='camera';this.player.flashlight=false;this.player.film--;this.flash=.4;this.sound('shutter');this.noise(3.8,this.player,8);
  if(distance(this.player,this.enemy)<12&&visible(this.player,this.enemy,this.doors)&&this.flags.intruded){this.addEvidence('sighting');if(distance(this.player,this.enemy)<7){this.enemy.stun=2;this.caption('EVELYN','The flash stopped him. Just for a second.');}}
  this.emit('photo',{time:this.time(),room:this.room(),position:clone(this.player),evidence:[...this.evidence]});return true;
 }
 openDoor(id){const d=this.doors[id];if(!d)return;if(d.barricaded){this.toast('The barricade must be removed first.');return;}if(d.locked){this.toast('Unlock the door first.');return;}
  if(d.open&&this.thresholdOccupied(id)){this.toast('Step clear of the doorway before closing it.');return;}
  d.open=!d.open;this.noise(1.1);this.sound('door');if(d.open&&id==='back'&&this.flags.phoneAnswered&&!this.flags.intruded)this.caption('NATHANIEL','Thank you, Evelyn. I knew you would understand.');
 }
 thresholdOccupied(id){const d=DOORS.find(d=>d.id===id);return d&&[this.player,this.enemy].some(p=>p.floor===d.floor&&Math.floor(p.x)===Math.floor(d.x)&&Math.floor(p.z)===Math.floor(d.z));}
 action(id){
  if(!this.active)return false;
  if(id.startsWith('hide:'))return this.hide(id.slice(5));if(id.startsWith('link:'))return this.useLink(id.slice(5));if(id.startsWith('walk:'))return this.navigate(ITEMS.find(i=>i.id===id.slice(5))||{floor:0,x:14.5,z:13.5});
  if(id.startsWith('door:')){const [,doorId,act]=id.split(':');const d=this.doors[doorId],entry=DOORS.find(x=>x.id===doorId);if(!d||distance(this.player,entry)>2.2)return false;
   if(act==='open')this.openDoor(doorId);if(act==='lock'){if(d.open){this.caption('EVELYN','Close it before turning the lock.');return false;}d.locked=!d.locked;this.sound('key');this.caption('EVELYN',d.locked?'Locked. But if he has a copy, I need more than that.':'The lock is open.');}
   if(act==='barricade'){if(this.thresholdOccupied(doorId)){this.toast('The doorway must be clear to place a barricade.');return false;}d.open=false;d.locked=true;d.barricaded=!d.barricaded;this.noise(2.2);this.caption('EVELYN',d.barricaded?'The chair catches under the handle. It will buy time.':'I’ve moved the barricade.');this.sound('drag');}return true;
  }
  switch(id){
   case 'phone':case 'upPhone':if(this.flags.prologue){this.flags.prologue=false;this.elapsed=0;this.clockBase=22*60+47;}this.sound('receiver');this.emit('dialogue',this.flags.phoneAnswered?'phoneHub':'firstCall');return true;
   case 'backTalk':this.emit('dialogue','backDoor');return true;
   case 'answer':this.flags.phoneAnswered=true;this.stage=Math.max(2,this.stage);this.caption('NATHANIEL','You left the kitchen light on. I thought you might be waiting for me. Don’t look out the front, sweetheart. I’m at the back.');this.noise(.6);this.makeCheckpoint();return true;
   case 'april':this.flags.april=true;this.caption('APRIL','Evelyn, listen to me. I’m calling the neighbors. Don’t open anything. Get your camera. I’m staying on this line as long as I can.');this.makeCheckpoint();return true;
   case 'police':this.emit('dialogue','police');return true;
   case 'policeDetail':case 'policeVague':this.flags.police=true;this.flags.address=id==='policeDetail';this.flags.policeNamed=id==='policeDetail'&&(this.evidence.includes('invoice')||this.flags.phoneAnswered);this.policeLeft=this.cfg.police+(id==='policeVague'?55:0);this.caption('ORTIZ',id==='policeDetail'?'2147 Sycamore Lane. Nathaniel Cross. Stay away from the doors, Evelyn. I’m on my way.':'I need your address, miss. I’ll send a unit to Sycamore Lane. Please stay on the line.');this.makeCheckpoint();return true;
   case 'correctAddress':this.flags.address=true;this.flags.policeNamed=true;this.policeLeft=Math.max(12,this.policeLeft-40);this.caption('ORTIZ','I have the full address and his name now. Help is coming.');return true;
   case 'message':this.flags.gloria=true;this.caption('GLORIA — ANSWERING MACHINE','Sweetheart, Nathaniel fixed that basement fault in September. He brought the spare key back. The service invoice is on our desk. We’ll be home tomorrow. Love you.');this.sound('tape');return true;
   case 'camera':this.flags.camera=true;this.used.add(id);this.equip('camera');this.caption('EVELYN','My camera. Spare film, too. If no one believes me, I can show them.');this.makeCheckpoint();return true;
   case 'diary':this.caption('EVELYN','August 15. The man at Redbird Video cut his hand on a display. I gave him a bandage. That was all. September 4. The same man came to fix the power.');return true;
   case 'tv':this.sound('static');this.noise(1.4);this.caption('EVELYN',this.flags.intruded?'For a second, the black glass shows a shape behind me. I need to turn around.':'The tape has stopped. There is only static.');this.emit('glitch',{});return true;
   case 'sleepPhoto':case 'mud':case 'invoice':case 'copyKey':case 'tape':if(this.addEvidence(id))this.caption(id==='tape'?'NATHANIEL — CASSETTE':'EVELYN',id==='tape'?'Friday. Her parents leave before nine. I kept the utility latch loose. I knew she would need me again.':EVIDENCE[id].body);else this.emit('evidence',{id,...EVIDENCE[id]});return true;
   case 'record':if(this.evidence.length<2){this.caption('EVELYN','I need two concrete discoveries before I record this.');return false;}this.flags.recorded=true;this.caption('EVELYN — RECORDING','My name is Evelyn Price. Nathaniel Cross is at my house. He copied our key. This tape belongs to the police if I can’t bring it to them myself.');this.sound('tape');this.noise(1.2);return true;
   case 'mailbox':if(!this.flags.recorded){this.caption('EVELYN','If I could leave April a recording here, she would know where to look.');return false;}this.flags.mailed=true;this.caption('EVELYN','April knows the mailbox. Whatever happens, he won’t get to erase this.');this.makeCheckpoint();return true;
   case 'battery':if(this.used.has(id)){this.toast('You already took the spare batteries.');return false;}this.used.add(id);this.player.battery=100;this.toast('FLASHLIGHT BATTERY RESTORED');this.sound('equip');return true;
   case 'cellarKey':this.flags.cellarKey=true;this.used.add(id);this.caption('EVELYN','The storm-cellar key. There’s still another way out.');this.sound('key');this.makeCheckpoint();return true;
   case 'breaker':this.flags.power=true;this.flags.restored=true;this.sound('breaker');this.noise(4.2,this.player,10);this.caption('EVELYN','The lights are back. He’ll have heard that.');this.makeCheckpoint();return true;
   case 'car':this.caption('EVELYN','Dad took the car keys. The station wagon won’t start. Don’t waste time.');this.sound('key');return true;
   case 'neighbor':if(!this.flags.april){this.caption('EVELYN','The porch is dark. April could have called the neighbors first. I need to get their attention.');this.noise(3,this.player,7);return false;}if(distance(this.player,this.enemy)<3){this.toast('He is too close. Draw him away from the porch.');return false;}this.finish('porch');return true;
   case 'gate':if(!this.flags.cellarOpen){this.caption('EVELYN','The back gate is fastened from the cellar side. The storm-cellar route would get me around it.');return false;}if(distance(this.player,this.enemy)<3){this.toast('He is too close to the gate.');return false;}this.finish('gate');return true;
   case 'window':case 'bathWindow':this.sound('thunder');this.caption('EVELYN',this.flags.intruded?'The yard is empty. He’s already inside.':'Rain. A light in the yard. Someone is standing where the dark is thickest.');this.emit('windowScare',{});return true;
   case 'kitchenLight':this.flags.kitchenLight=!this.flags.kitchenLight;this.sound('switch');this.caption('EVELYN',this.flags.kitchenLight?'The kitchen light is on.':'The kitchen light is off. He can see less now.');return true;
   case 'distraction':this.noise(6,ITEMS.find(x=>x.id===id),22);this.sound('radio',ITEMS.find(x=>x.id===id));this.enemy.sawHide=false;this.caption('EVELYN','Let him follow the radio. I’ll go the other way.');return true;
   case 'letin':case 'dinner':this.flags.phoneAnswered=true;this.pendingEnding=id;this.doors.back.locked=false;this.doors.back.barricaded=false;this.doors.back.open=true;this.elapsed=Math.max(this.elapsed,this.cfg.entryDelay);this.caption('NATHANIEL',id==='dinner'?'I set the table in my head so many times. Two places. Just us.':'There. That wasn’t so difficult.');this.noise(8,this.player,30);return true;
   case 'leaveHide':this.unhide();return true;
  }return false;
 }
 queueInteraction(id){
  if(id==='shoot'&&this.flags.camera){this.shoot();return true;}
  if(id==='listen'){this.caption('EVELYN',this.flags.intruded?'Listen for his footsteps. Decide which way to move.':'Rain. A key touching the kitchen lock.');return true;}
  if(id==='shoot')id='camera';
  if(id==='holdDoor')id='door:back:barricade';
  let target=null,action=id;
  if(id.startsWith('move:')){const destinations={living:{floor:0,x:7.6,z:16.2},kitchen:{floor:0,x:16.5,z:7.5},landing:{floor:1,x:14.5,z:11.5}};target=destinations[id.slice(5)];action='arrive';}
  else if(id.startsWith('hide:'))target=HIDES.find(h=>h.id===id.slice(5));
  else if(id.startsWith('door:'))target=DOORS.find(d=>d.id===id.split(':')[1]);
  else if(id.startsWith('link:')){const l=LINKS.find(l=>l.id===id.slice(5));if(l)target=l.a.floor===this.player.floor?l.a:l.b.floor===this.player.floor?l.b:l.a;}
  else if(['april','police'].includes(id))target=ITEMS.find(i=>i.id===(this.player.floor===1?'upPhone':'phone'));
  else target=ITEMS.find(i=>i.id===id);
  if(!target)return this.action(action);
  const range=id.startsWith('link:')?1.5:id.startsWith('hide:')?1.65:1.8;
  if(distance(this.player,target)<range&&(id.startsWith('door:')||id.startsWith('link:')||visible(this.player,target,this.doors))){this.queuedAction=null;return action==='arrive'?true:this.action(action);}
  let best=null,bestCost=Infinity;
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const p={floor:target.floor,x:Math.floor(target.x)+.5+dx,z:Math.floor(target.z)+.5+dz};if(distance(p,target)>range||!freeAt(p.floor,p.x,p.z,this.doors,.21))continue;const path=route(this.player,p,this.doors,this.flags);if(path.length&&path.length<bestCost){best={point:p,path};bestCost=path.length;}}
  if(!best){this.toast('Open the door on this route first.');return false;}
  this.autoPath=best.path;this.queuedAction={id:action,resume:id,target:{...target},range};this.toast('MOVING TO THE OBJECT · Manual movement cancels');return true;
 }
 finishQueuedInteraction(){const q=this.queuedAction;if(!q||this.transit||this.autoPath.length)return;if(distance(this.player,q.target)<q.range+.12){this.queuedAction=null;if(q.id!=='arrive')this.action(q.id);}else this.queueInteraction(q.resume||q.id);}
 referenceChoices(){const r=roomAt(this.player),camera=this.flags.camera?{id:'shoot',label:'USE THE CAMERA'}:{id:'camera',label:'GET YOUR CAMERA UPSTAIRS'};
  const scenes={
   l:[{id:'phone',label:'ANSWER THE PHONE'},{id:'door:front:lock',label:'LOCK THE FRONT DOOR'},{id:'window',label:'LOOK THROUGH THE WINDOW'},{id:'april',label:'CALL APRIL'}],
   k:[{id:'holdDoor',label:'HOLD THE DOOR SHUT'},{id:'police',label:'CALL 911'},{id:'kitchenLight',label:'TURN OFF THE KITCHEN LIGHT'},{id:'link:upstairs',label:'RUN UPSTAIRS'}],
   h:[{id:'hide:wardrobe',label:'HIDE IN THE BEDROOM'},{id:'hide:parentsCloset',label:'CHECK THE HALL CLOSET'},{id:'link:upstairs',label:'GO BACK DOWNSTAIRS'},camera],
   b:[{id:'breaker',label:'CHECK THE BREAKER PANEL'},{id:'listen',label:'LISTEN CAREFULLY'},{id:'link:cellar',label:'OPEN THE STORM CELLAR'},{id:'link:basement',label:'GO BACK UPSTAIRS'}],
   s:[{id:'tape',label:'PLAY THE CASSETTE'},{id:'record',label:'RECORD YOUR EVIDENCE'},{id:'link:basement',label:'GO BACK UPSTAIRS'},camera],
   e:[camera,{id:'diary',label:'READ YOUR DIARY'},{id:'hide:wardrobe',label:'HIDE IN THE WARDROBE'},{id:'move:landing',label:'GO TO THE LANDING'}],
   p:[{id:'invoice',label:'READ THE REPAIR INVOICE'},{id:'upPhone',label:'USE THE TELEPHONE'},{id:'hide:parentsCloset',label:'HIDE IN THE CLOSET'},{id:'move:landing',label:'GO TO THE LANDING'}],
   a:[{id:'bathWindow',label:'CHECK THE FROSTED WINDOW'},{id:'move:landing',label:'GO TO THE LANDING'},camera,{id:'listen',label:'LISTEN CAREFULLY'}],
   f:[{id:'door:front:open',label:this.doors.front.open?'CLOSE THE FRONT DOOR':'OPEN THE FRONT DOOR'},{id:'message',label:'PLAY GLORIA’S MESSAGE'},{id:'link:upstairs',label:'GO UPSTAIRS'},{id:'move:living',label:'GO TO THE LIVING ROOM'}],
   d:[{id:'distraction',label:'SET A RADIO DISTRACTION'},{id:'move:kitchen',label:'GO TO THE KITCHEN'},{id:'move:living',label:'GO TO THE LIVING ROOM'},camera],
   g:[{id:'copyKey',label:'SEARCH THE TOOLBOX'},{id:'battery',label:'TAKE SPARE BATTERIES'},{id:'car',label:'TRY THE FAMILY CAR'},{id:'move:kitchen',label:'GO BACK INSIDE'}],
   y:[{id:this.doors.front.open?'move:living':'door:front:open',label:this.doors.front.open?'GO INTO THE HOUSE':'OPEN THE FRONT DOOR'},{id:'mailbox',label:'CHECK THE MAILBOX'},{id:'neighbor',label:'REACH THE NEIGHBOR’S PORCH'},{id:'gate',label:'LOOK FOR THE BACK GATE'}]
  };return scenes[r]||scenes.l;
 }
 nearby(){const p=this.player;return ITEMS.filter(i=>distance(p,i)<2.05&&visible(p,i,this.doors)&&!(this.used.has(i.id)&&['camera','key','battery'].includes(i.type))).sort((a,b)=>distance(p,a)-distance(p,b));}
 focused(){const p=this.player;const objects=[...this.nearby(),...DOORS.filter(d=>distance(p,d)<2.2).map(d=>({...d,label:d.label,door:true})),...HIDES.filter(h=>distance(p,h)<1.9).map(h=>({...h,label:`HIDE ${h.name}`,hide:true})),...LINKS.flatMap(l=>[l.a,l.b].filter(n=>distance(p,n)<1.6).map(n=>({...n,id:l.id,label:n===l.a?l.labelA:l.labelB,link:true})))];
  return objects.filter(o=>Math.abs(angleDiff(Math.atan2(o.z-p.z,o.x-p.x),p.yaw))<.7).sort((a,b)=>distance(p,a)-distance(p,b))[0]||null;
 }
 choices(){
  if(this.player.hidden)return [{id:'leaveHide',label:'LEAVE HIDING SPOT'},{id:'breath',label:this.player.holding?'RELEASE YOUR BREATH':'HOLD YOUR BREATH'}];
  const focused=this.focused(),out=[];if(focused){if(focused.door){const d=this.doors[focused.id];out.push({id:`door:${focused.id}:open`,label:d.open?'CLOSE THE DOOR':'OPEN THE DOOR'},{id:`door:${focused.id}:lock`,label:d.locked?'UNLOCK THE DOOR':'LOCK THE DOOR'},{id:`door:${focused.id}:barricade`,label:d.barricaded?'REMOVE THE BARRICADE':'BARRICADE THE DOOR'});if(focused.id==='back'&&this.flags.phoneAnswered&&!this.flags.intruded)out.push({id:'backTalk',label:'SPEAK THROUGH THE BACK DOOR'});}else out.push({id:focused.hide?`hide:${focused.id}`:focused.link?`link:${focused.id}`:focused.id,label:focused.label});}
  if(!focused?.door)return this.referenceChoices();
  for(const o of this.nearby())if(!out.some(x=>x.id===o.id))out.push({id:o.id,label:o.label});
  for(const h of HIDES)if(distance(this.player,h)<1.8&&!out.some(x=>x.id===`hide:${h.id}`))out.push({id:`hide:${h.id}`,label:`HIDE ${h.name}`});
  if(this.flags.camera)out.push({id:'shoot',label:'TAKE A 360° PHOTOGRAPH'});
  if(out.length<3)out.push({id:'listen',label:'LISTEN CAREFULLY'});return out.slice(0,4);
 }
 interact(){const f=this.focused();if(!f){this.toast('Look toward a door, object, or hiding spot.');return false;}return this.action(f.door?`door:${f.id}:open`:f.hide?`hide:${f.id}`:f.link?`link:${f.id}`:f.id);}
 tick(dt,input={}){
  if(!this.active)return;dt=Math.max(0,Math.min(.05,dt));this.elapsed+=dt;this.flash=Math.max(0,this.flash-dt);this.freeze=Math.max(0,this.freeze-dt);
  const p=this.player,e=this.enemy;
  if(this.transit){this.transit.remaining-=dt;if(this.transit.remaining<=0){Object.assign(p,this.transit.to);p.yaw=-Math.PI/2;p.pitch=0;this.transit=null;this.freeze=1;this.caption('EVELYN',this.room());}}
  else if(this.freeze<=0){if(Math.abs(input.x||0)+Math.abs(input.z||0)>.05){this.autoPath=[];this.queuedAction=null;this.move(input.x||0,input.z||0,dt,input.sprint);}else this.walkAuto(dt);}
  this.finishQueuedInteraction();
  p.stamina=Math.min(100,p.stamina+dt*(input.sprint?1:13));
  if(p.flashlight){p.battery=Math.max(0,p.battery-dt*100/this.cfg.battery);if(p.battery===0){p.flashlight=false;this.toast('The flashlight battery is empty.');}}
  if(p.hidden){if(p.holding)p.breath=Math.max(0,p.breath-dt*100/this.cfg.breath);else p.breath=Math.min(100,p.breath+dt*12);if(p.breath===0&&p.holding){p.holding=false;this.noise(2,p,3);this.sound('gasp');this.caption('EVELYN','I can’t hold it any longer.');}}
  this.noises=this.noises.map(n=>({...n,ttl:n.ttl-dt})).filter(n=>n.ttl>0);
  const r=roomAt(p);if(r!==this.lastSeenRoom){this.lastSeenRoom=r;this.emit('room',this.room());}
  if(this.flags.prologue&&r==='l'){this.flags.prologue=false;this.elapsed=0;this.clockBase=22*60+47;this.caption('EVELYN','An hour later, the television goes quiet. Then the telephone rings.');this.makeCheckpoint(true);}
  if(this.elapsed-this.lastTrail>.4){this.lastTrail=this.elapsed;this.trail.push({t:this.elapsed,floor:p.floor,x:p.x,z:p.z,ex:e.x,ez:e.z,ef:e.floor,mode:e.mode});if(this.trail.length>35)this.trail.shift();}
  if(!this.flags.prologue&&!this.flags.phoneAnswered&&Math.floor(this.elapsed/3)%2===0&&Math.floor(this.elapsed*2)!==this.lastRing){this.lastRing=Math.floor(this.elapsed*2);if(this.lastRing%6===0)this.sound('ring',ITEMS[0],.35);}
  this.tickEnemy(dt);
  if(this.flags.intruded&&this.elapsed>this.entryAt+45&&!this.flags.restored&&this.flags.power){this.flags.power=false;this.sound('breaker');this.caption('EVELYN','The lights. He knew which circuit to cut.');this.stage=3;}
  if(this.policeLeft>0){this.policeLeft=Math.max(0,this.policeLeft-dt);if(this.policeLeft===0&&this.active)this.finish(this.bestEnding()?'keys':'blue');}
  const d=distance(p,e);this.fear=Math.max(0,Math.min(1,this.fear+dt*(d<6&&this.flags.intruded?.24:-.13)));
 }
 walkAuto(dt){const t=this.autoPath[0];if(!t)return;if(t.floor!==this.player.floor){this.autoPath=[];this.useLink(t.link);return;}
  const d=distance(this.player,t);if(d<.15){this.autoPath.shift();return;}const a=Math.atan2(t.z-this.player.z,t.x-this.player.x);this.player.yaw+=angleDiff(a,this.player.yaw)*Math.min(1,dt*5);const old={x:this.player.x,z:this.player.z};this.move(0,1,dt,false);if(Math.hypot(this.player.x-old.x,this.player.z-old.z)<.003){this.autoPath=[];this.toast('Your route is blocked.');}}
 bestEnding(){return this.flags.address&&this.flags.policeNamed&&this.evidence.length>=4&&(this.evidence.includes('copyKey')||this.evidence.includes('invoice'));}
 tickEnemy(dt){
  const e=this.enemy,p=this.player;if(this.flags.prologue)return;e.stun=Math.max(0,e.stun-dt);if(e.stun>0)return;
  if(e.transit){e.transit.remaining-=dt;if(e.transit.remaining<=0){Object.assign(e,e.transit.to);e.transit=null;e.path.shift();}return;}
  if(e.mode==='outside'){
   // He starts behind the kitchen and crosses the actual back-door tile. No interior spawn.
   if(this.elapsed<this.cfg.entryDelay){e.yaw=Math.PI/2;return;}e.mode='enter';e.target={floor:0,x:16.5,z:5.5};e.think=0;
  }
  const dist=distance(p,e),line=dist<this.cfg.vision*(this.flags.power?1:.73)+(p.flashlight?3:0)&&visible(e,p,this.doors);
  const facing=Math.abs(angleDiff(Math.atan2(p.z-e.z,p.x-e.x),e.yaw))<1.23||dist<2.3;
  if(!p.hidden&&line&&facing&&this.flags.intruded){
   if(e.mode!=='chase'){this.sound('chase',e);this.caption('NATHANIEL','There you are. You don’t have to keep running.');}
   e.mode='chase';e.lastSeen={floor:p.floor,x:p.x,z:p.z};e.lastSeenAt=this.elapsed;e.target={...e.lastSeen};e.think=Math.min(e.think,.28);
  }else if(e.mode==='chase'&&this.elapsed-e.lastSeenAt>2.5){e.mode='investigate';e.target=e.lastSeen;e.think=0;}
  if(!['chase','enter'].includes(e.mode)){
   const heard=this.noises.filter(n=>n.floor===e.floor&&distance(n,e)<n.level*3.2).sort((a,b)=>b.level-a.level)[0];
   if(heard&&(!e.target||distance(heard,e.target)>.8)){e.mode='investigate';e.target={floor:heard.floor,x:heard.x,z:heard.z};e.think=0;}
  }
  e.think-=dt;if(e.think<=0){e.think=e.mode==='chase'?.4:1.8;if(!e.target)this.choosePatrol();e.path=route(e,e.target,this.doors,this.flags,true);}
  const step=e.path[0];
  if(step){
   if(step.floor!==e.floor){const l=LINKS.find(l=>l.id===step.link);e.transit={to:step,remaining:l?.duration||3};this.sound('stairs',e,.5);return;}
   const door=doorAt(step.floor,step.x,step.z);
   if(door&&!this.doors[door.id].open&&distance(e,door)<1.65){
    const state=this.doors[door.id];e.doorTime+=dt;const duration=state.barricaded?17:state.locked?4:1.2;
    if(Math.floor(e.doorTime*1.2)!==e.lastDoorBeat){e.lastDoorBeat=Math.floor(e.doorTime*1.2);this.sound(state.barricaded?'bang':'key',door,.65);}
    if(e.doorTime>=duration){state.open=true;state.locked=false;state.barricaded=false;e.doorTime=0;this.sound('door',door);if(!this.flags.intruded){this.flags.intruded=true;this.entryAt=this.elapsed;this.stage=3;this.caption('EVELYN','A key. That wasn’t a broken lock. He has a key.');}this.noise(.2,e);}
    return;
   }
   const dx=step.x-e.x,dz=step.z-e.z,d=Math.hypot(dx,dz),speed=this.cfg.speed*(e.mode==='chase'?1.13:e.mode==='enter'?.7:.69),s=Math.min(d,speed*dt);
   if(d<.14){e.path.shift();}else {const a=Math.atan2(dz,dx);e.yaw+=angleDiff(a,e.yaw)*Math.min(1,dt*7);this.tryMove(e,dx/d*s,dz/d*s,.14);e.stepClock=(e.stepClock||0)+s;if(e.stepClock>1){e.stepClock=0;this.sound('enemyStep',e,.8);}}
  }else if(e.target&&distance(e,e.target)<1.15){
   if(e.mode==='enter'){if(!this.flags.intruded){this.flags.intruded=true;this.entryAt=this.elapsed;this.stage=3;}this.choosePatrol();}
   else if(e.mode==='investigate'){
    const h=HIDES.filter(h=>h.floor===e.floor&&h.room===roomAt(e)&&distance(e,h)<9).sort((a,b)=>distance(e,a)-distance(e,b))[0];
    if(h){e.mode='search';e.searchId=h.id;e.target={...h};e.searchTime=0;e.think=0;this.caption('NATHANIEL','I can wait, Evelyn. You know I can wait.');}else this.choosePatrol();
   }else if(e.mode==='search'){
    e.searchTime+=dt;if(e.searchTime>this.cfg.search){const same=p.hidden===e.searchId;
     if(same&&(e.sawHide||!p.holding||p.breath<8)){this.capture('He searched the hiding spot. '+(e.sawHide?'He saw you enter it.':'He heard you breathing.'));return;}
     e.sawHide=false;this.choosePatrol();this.sound('cloth',e,.6);
    }
   }else this.choosePatrol();
  }else if(!step&&e.target){e.target=null;e.think=0;}
  if(!p.hidden&&distance(p,e)<.72&&this.flags.intruded&&this.freeze<=0&&visible(p,e,this.doors))this.capture('Nathaniel reached you in '+this.room().toLowerCase()+'.');
 }
 choosePatrol(){const e=this.enemy;e.mode='patrol';e.searchTime=0;let chosen=null;for(let i=0;i<PATROL.length;i++){const t=PATROL[e.patrol++%PATROL.length];if(route(e,t,this.doors,this.flags,true).length){chosen=t;break;}}e.target=chosen||{floor:e.floor,x:e.x,z:e.z};e.think=0;}
 capture(reason='Nathaniel found you.'){
  if(!this.active)return;const id=this.pendingEnding||(this.flags.recorded&&this.flags.mailed?'message':'ring');this.active=false;this.ending=id;this.sound('scream');this.emit('capture',{reason,ending:ENDINGS.find(e=>e.id===id),trail:clone(this.trail),checkpoint:!!this.checkpoint});
 }
 finish(id){if(!this.active)return;this.active=false;this.ending=id;this.sound(id==='keys'||id==='blue'?'siren':'resolve');this.emit('ending',ENDINGS.find(e=>e.id===id));}
}
