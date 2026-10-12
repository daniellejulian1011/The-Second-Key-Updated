export class Soundscape {
 constructor(){this.ctx=null;this.master=.7;this.ambient=.65;this.effects=.8;this.voices=.8;this.speech=true;this.started=false;this.lastHeartbeat=0;this.nodes=[];}
 start(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.bus=this.ctx.createGain();this.bus.gain.value=this.master;this.bus.connect(this.ctx.destination);this.rainGain=this.ctx.createGain();this.rainGain.gain.value=.07*this.ambient;this.rainGain.connect(this.bus);this.rain=this.ctx.createBufferSource();this.rain.buffer=this.noiseBuffer(5);this.rain.loop=true;const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=3500;this.rain.connect(f);f.connect(this.rainGain);this.rain.start();this.drone=this.ctx.createOscillator();this.drone.frequency.value=43;this.droneGain=this.ctx.createGain();this.droneGain.gain.value=.02*this.ambient;this.drone.connect(this.droneGain);this.droneGain.connect(this.bus);this.drone.start();}this.ctx.resume().catch(()=>{});this.started=true;}catch(e){this.started=false;}}
 noiseBuffer(seconds){const n=Math.floor(this.ctx.sampleRate*seconds),b=this.ctx.createBuffer(1,n,this.ctx.sampleRate),a=b.getChannelData(0);let seed=137;for(let i=0;i<n;i++){seed=(seed*16807)%2147483647;a[i]=seed/1073741823.5-1;}return b;}
 configure(s){this.master=s.master/100;this.ambient=s.ambient/100;this.effects=s.effects/100;this.voices=s.voices/100;this.speech=s.speech;if(this.bus)this.bus.gain.setTargetAtTime(this.master,this.ctx.currentTime,.1);if(!this.speech&&window.speechSynthesis)window.speechSynthesis.cancel();}
 update(game,paused=false){if(!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime;this.rainGain.gain.setTargetAtTime(this.ambient*(paused?.026:game.room().includes('YARD')?.16:.052),t,.5);this.droneGain.gain.setTargetAtTime(this.ambient*(.015+game.fear*.024),t,.6);if(game.active&&!paused&&game.fear>.3&&t>this.lastHeartbeat){this.lastHeartbeat=t+1.1-game.fear*.53;this.play('heartbeat',null,game,.28+game.fear*.25);}}
 output(pos,game,volume){const c=this.ctx,g=c.createGain();let attenuation=1,pan=0;if(pos&&game){const p=game.player,d=Math.hypot(pos.x-p.x,pos.z-p.z);attenuation=1/(1+d*.30);if(pos.floor!==p.floor)attenuation*=.12;pan=Math.sin(Math.atan2(pos.z-p.z,pos.x-p.x)-p.yaw);}
  g.gain.value=volume*this.effects*attenuation;if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(this.bus);g.panner=p;}else g.connect(this.bus);return g;
 }
 tone(freq,time,duration,volume,out,type='sine',end=freq){const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);o.frequency.exponentialRampToValueAtTime(Math.max(10,end),time+duration);g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),time+.015);g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g);g.connect(out);o.start(time);o.stop(time+duration+.03);o.onended=()=>{o.disconnect();g.disconnect();};}
 burst(time,duration,volume,out,freq=900){const c=this.ctx,b=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();b.buffer=this.noiseBuffer(duration);f.type='lowpass';f.frequency.value=freq;g.gain.setValueAtTime(volume,time);g.gain.exponentialRampToValueAtTime(.0001,time+duration);b.connect(f);f.connect(g);g.connect(out);b.start(time);b.onended=()=>{b.disconnect();f.disconnect();g.disconnect();};}
 play(name,pos=null,game=null,volume=1){if(!this.started||!this.ctx||this.effects===0)return;const c=this.ctx,t=c.currentTime,out=this.output(pos,game,volume);
  const tone=(f,d,v,type='sine',end=f)=>this.tone(f,t,d,v,out,type,end),noise=(d,v,f=900)=>this.burst(t,d,v,out,f);
  switch(name){
   case 'ring':for(let i=0;i<2;i++){this.tone(480,t+i*.2,.15,.075,out,'square');this.tone(620,t+i*.2,.15,.04,out,'sine');}break;
   case 'step':case 'softStep':case 'enemyStep':tone(name==='enemyStep'?80:110,.12,name==='softStep'?.022:.07,'sine',43);noise(.075,name==='softStep'?.025:.11,800);break;
   case 'door':tone(73,.4,.13,'sine',34);noise(.21,.22,1600);break;
   case 'bang':tone(47,.55,.18,'triangle',27);noise(.19,.28,1100);break;
   case 'key':tone(1350,.12,.028,'triangle',850);noise(.09,.04,3500);break;
   case 'switch':case 'receiver':case 'equip':noise(.045,.045,2100);break;
   case 'paper':case 'cloth':noise(.33,.09,2300);break;
   case 'stairs':for(let i=0;i<6;i++){this.tone(110-i*4,t+i*.32,.12,.024,out,'triangle',60);this.burst(t+i*.32,.1,.045,out,850);}break;
   case 'shutter':noise(.065,.26,4400);this.burst(t+.09,.10,.16,out,2900);tone(1900,.14,.02,'triangle');break;
   case 'static':noise(.9,.18,5300);break;
   case 'thunder':noise(2.2,.27,220);tone(39,2,.18,'sine',24);break;
   case 'breaker':noise(.12,.28,2200);tone(67,.3,.15,'sawtooth',20);break;
   case 'drag':noise(1,.11,580);break;
   case 'tape':noise(.3,.04,1700);tone(170,.7,.015,'sawtooth',169);break;
   case 'heartbeat':tone(52,.14,.10,'sine',33);this.tone(47,t+.19,.15,.07,out,'sine',29);break;
   case 'chase':tone(75,1.3,.15,'sawtooth',37);tone(112,1.1,.09,'triangle',51);break;
   case 'gasp':noise(.6,.15,3200);break;
   case 'radio':for(let i=0;i<20;i++)this.tone([220,277,330,294][i%4],t+i*.3,.19,.017,out,'triangle');noise(6,.015,1600);break;
   case 'siren':for(let i=0;i<5;i++){this.tone(570,t+i*1.1,.7,.055,out,'sine',980);this.tone(980,t+i*1.1+.7,.4,.05,out,'sine',570);}break;
   case 'resolve':tone(164,2,.04,'sine');tone(246,2,.035,'sine');break;
   case 'scream':this.scream(out,t);break;
  }
  setTimeout(()=>{try{out.disconnect();out.panner?.disconnect();}catch{}},name==='radio'?7500:6500);
 }
 scream(out,t){
  // A synthesised voiced scream: falling fundamental, vowel formants and a breath layer.
  const c=this.ctx,src=c.createOscillator(),env=c.createGain();src.type='sawtooth';src.frequency.setValueAtTime(740,t);src.frequency.exponentialRampToValueAtTime(1140,t+.2);src.frequency.exponentialRampToValueAtTime(410,t+1.45);env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(.25,t+.045);env.gain.exponentialRampToValueAtTime(.0001,t+1.6);src.connect(env);
  const filters=[];for(const [f,q,v] of [[820,6,.48],[1330,7,.35],[2700,9,.19]]){const filter=c.createBiquadFilter(),g=c.createGain();filter.type='bandpass';filter.frequency.value=f;filter.Q.value=q;g.gain.value=v;env.connect(filter);filter.connect(g);g.connect(out);filters.push(filter,g);}this.burst(t,1.15,.3,out,4100);this.tone(42,t,1.9,.25,out,'sawtooth',24);src.start(t);src.stop(t+1.62);src.onended=()=>{src.disconnect();env.disconnect();filters.forEach(n=>n.disconnect());};
 }
 say(speaker,text){if(!this.speech||!this.started||!window.speechSynthesis||!text)return;try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);const voices=window.speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));const male=/NATHANIEL|ORTIZ/.test(speaker);const preferred=male?/David|Daniel|George|James|Alex|Guy|Male/i:/Zira|Samantha|Victoria|Karen|Susan|Jenny|Female/i;u.voice=voices.find(v=>preferred.test(v.name))||voices[0]||null;u.pitch=male?.79:1.08;u.rate=speaker.includes('NATHANIEL')?.83:.93;u.volume=this.voices*this.master;window.speechSynthesis.speak(u);}catch{}}
 stopSpeech(){if(window.speechSynthesis)window.speechSynthesis.cancel();}
}
