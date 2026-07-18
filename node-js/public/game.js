const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const message = document.getElementById('message');
const startBtn = document.getElementById('start');
const soundBtn = document.getElementById('sound');

let high = Number(localStorage.getItem('dinoDashHigh') || 0), playing = false, score = 0, speed = 6, last = 0, spawn = 0, muted = false;
let obstacles = [], clouds = [{x:90,y:82,s:1},{x:440,y:54,s:.7},{x:715,y:105,s:.85}];
const dino = { x:110, y:282, w:48, h:58, vy:0, duck:false };
highEl.textContent = String(high).padStart(5,'0');

function beep(freq=440, duration=.06) { if (muted) return; const ac = new (window.AudioContext||window.webkitAudioContext)(); const o=ac.createOscillator(), g=ac.createGain(); o.frequency.value=freq; g.gain.value=.025; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+duration); o.stop(ac.currentTime+duration); }
function rect(x,y,w,h,c) { ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); }
function drawCloud(c) { ctx.fillStyle='#dbe6df'; ctx.beginPath(); ctx.arc(c.x,c.y,15*c.s,0,Math.PI*2); ctx.arc(c.x+18*c.s,c.y-8*c.s,20*c.s,0,Math.PI*2); ctx.arc(c.x+39*c.s,c.y,14*c.s,0,Math.PI*2); ctx.fill(); }
function drawDino() { const y=dino.y+(dino.duck?18:0), h=dino.duck?40:dino.h; const c='#4e9e65'; rect(dino.x+8,y+15,31,h-15,c); rect(dino.x+26,y,25,27,c); rect(dino.x+46,y+9,9,12,c); rect(dino.x+32,y+8,4,4,'#fff9e9'); rect(dino.x+33,y+9,2,3,'#24313b'); rect(dino.x+4,y+25,9,8,c); rect(dino.x+13,y+h-6,8,8,c); rect(dino.x+34,y+h-6,8,8,c); }
function drawCactus(o) { const c='#3b9c66'; rect(o.x,o.y,o.w,o.h,c); rect(o.x-8,o.y+o.h*.42,8,11,c); rect(o.x-11,o.y+o.h*.32,5,22,c); rect(o.x+o.w,o.y+o.h*.27,8,10,c); rect(o.x+o.w+5,o.y+o.h*.18,5,21,c); }
function reset() { score=0; speed=6; obstacles=[]; spawn=0; dino.y=282; dino.vy=0; dino.duck=false; }
function start() { reset(); playing=true; overlay.classList.add('hidden'); last=performance.now(); requestAnimationFrame(loop); beep(660); }
function end() { playing=false; beep(120,.18); high=Math.max(high,Math.floor(score)); localStorage.setItem('dinoDashHigh',high); highEl.textContent=String(high).padStart(5,'0'); message.textContent=`Игра окончена! Твой счёт: ${Math.floor(score)}`; startBtn.textContent='ЕЩЁ РАЗ'; overlay.classList.remove('hidden'); }
function jump() { if (!playing) return start(); if (dino.y >= 282) { dino.vy=-15; beep(500); } }
function update(delta) { const t=delta/16.67; score += t; speed = 6 + Math.min(7, score/280); dino.vy += .8*t; dino.y += dino.vy*t; if(dino.y>282) {dino.y=282;dino.vy=0;} spawn -= t; if(spawn<=0) { const h=38+Math.random()*45, w=16+Math.random()*12; obstacles.push({x:925,y:340-h,w,h}); spawn=58+Math.random()*48-speed*1.5; } obstacles.forEach(o=>o.x-=speed*t); obstacles=obstacles.filter(o=>o.x>-35); clouds.forEach(c=>{c.x-=.45*t*c.s;if(c.x<-80)c.x=970;}); const dh=dino.duck?40:dino.h, dy=dino.y+(dino.duck?18:0); if(obstacles.some(o=>dino.x+8<o.x+o.w+9 && dino.x+dino.w-4>o.x && dy+dh-4>o.y && dy+12<o.y+o.h)) end(); }
function render() { ctx.clearRect(0,0,900,390); ctx.fillStyle='#fff9e9';ctx.fillRect(0,0,900,390); clouds.forEach(drawCloud); ctx.fillStyle='#ffe58a';ctx.beginPath();ctx.arc(770,74,31,0,Math.PI*2);ctx.fill(); rect(0,340,900,5,'#24313b'); for(let x=-30;x<930;x+=39) rect((x-(score*speed*.7)%39),354,21,3,'#b9c6ae'); obstacles.forEach(drawCactus); drawDino(); }
function loop(now) { if(!playing)return; const delta=Math.min(35,now-last);last=now;update(delta);render();scoreEl.textContent=String(Math.floor(score)).padStart(5,'0');requestAnimationFrame(loop); }
function setDuck(v){ dino.duck=v && dino.y>=280; }
startBtn.addEventListener('click',start); canvas.addEventListener('pointerdown',jump);
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();if(e.code==='Space'||e.code==='ArrowUp')jump();if(e.code==='ArrowDown')setDuck(true);});addEventListener('keyup',e=>{if(e.code==='ArrowDown')setDuck(false);});
soundBtn.addEventListener('click',()=>{muted=!muted;soundBtn.textContent=muted?'♩':'♫';}); render();
