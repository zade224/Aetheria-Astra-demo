import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root not found');
app.innerHTML = `
<main class="battle-screen">
  <header class="topbar"><div class="brand"><span>✦</span><div><b>AETHERIA ASTRA</b><small>WIND VALLEY · TEST BATTLE</small></div></div><button id="backBtn" class="soft">← Main Menu</button></header>
  <section class="arena"><div class="sky-orb"></div><div class="ruins"></div><div class="ground"></div>
    <div class="enemy-wrap" id="enemyWrap"><div class="enemy-hp"><b>SHADOW BEAST</b><span id="enemyHpText">90 / 90</span><div class="bar"><i id="enemyHpBar"></i></div></div><img id="enemySprite" src="/assets/shadow_beast.png" alt="Shadow Beast enemy"></div>
    <div class="hero-wrap" id="heroWrap"><img id="heroSprite" src="/assets/ayan/idle/idle_01.png" alt="Ayan character"><div class="hero-hp"><b>AYAN · LV. 1</b><span id="heroHpText">100 / 100</span><div class="bar"><i id="heroHpBar"></i></div></div></div>
    <div class="battle-fx" id="battleFx"></div><div class="float-text" id="floatText"></div>
  </section>
  <section class="bottom-panel"><div class="status"><div><b>HP</b><div class="bar"><i id="heroHpBar2"></i></div></div><div><b>ENERGY <span id="energyText">0 / 50</span></b><div class="bar energy"><i id="energyBar"></i></div></div><p id="log">A Shadow Beast blocks the path. Choose an action!</p></div>
    <div class="actions"><button id="normalBtn"><strong>⚔</strong><span>Normal Attack<small>3 hits · +9 Energy</small></span></button><button id="skillBtn"><strong>🌪</strong><span>Gale Piercer<small>2 hits · +15 Energy</small></span></button><button id="ultBtn" disabled><strong>✦</strong><span>Tempest Awakening<small>50 Energy</small></span></button></div>
  </section><div class="toast" id="toast"></div>
</main>`;

const $ = <T extends HTMLElement>(id:string) => document.getElementById(id) as T;
const hero=$('heroSprite') as HTMLImageElement, enemy=$('enemySprite') as HTMLImageElement;
let heroHp=100, enemyHp=90, energy=0, busy=false, dead=false, buffRounds=0, defDown=0;
const maxEnergy=50;
const frames:Record<string,string[]>={
 idle:Array.from({length:7},(_,i)=>`/assets/ayan/idle/idle_${String(i+1).padStart(2,'0')}.png`),
 attack:Array.from({length:5},(_,i)=>`/assets/ayan/attack_1/attack_1_${String(i+1).padStart(2,'0')}.png`),
 skill:Array.from({length:6},(_,i)=>`/assets/ayan/skill_gale_piercer/skill_gale_piercer_${String(i+1).padStart(2,'0')}.png`),
 hurt:Array.from({length:7},(_,i)=>`/assets/ayan/damage_hurt/damage_hurt_${String(i+1).padStart(2,'0')}.png`),
 die:Array.from({length:7},(_,i)=>`/assets/ayan/die/die_${String(i+1).padStart(2,'0')}.png`)
};
function playFrames(list:string[],delay=95,loop=false){return new Promise<void>(resolve=>{let i=0;const step=()=>{hero.src=list[i];i++;if(i<list.length){setTimeout(step,delay)}else if(loop){i=0;setTimeout(step,delay)}else{setTimeout(()=>{hero.src=frames.idle[0];resolve()},delay)}};step()})}
function update(){ $('heroHpText').textContent=`${heroHp} / 100`; $('heroHpBar').style.width=`${heroHp}%`; $('heroHpBar2').style.width=`${heroHp}%`; $('enemyHpText').textContent=`${enemyHp} / 90`; $('enemyHpBar').style.width=`${enemyHp/90*100}%`; $('energyText').textContent=`${energy} / 50`; $('energyBar').style.width=`${energy/50*100}%`; $('ultBtn').toggleAttribute('disabled',energy<50||busy||dead); }
function say(t:string){$('log').textContent=t;}
function popup(t:string,who='hero'){const el=$('floatText');el.textContent=t;el.className=`float-text show ${who}`;setTimeout(()=>el.className='float-text',750)}
function fx(kind:string){const el=$('battleFx');el.className=`battle-fx ${kind}`;setTimeout(()=>el.className='battle-fx',650)}
async function enemyTurn(){if(enemyHp<=0||heroHp<=0)return;busy=true;update();say('Shadow Beast prepares a claw strike!');$('enemyWrap').classList.add('enemy-attack');await new Promise(r=>setTimeout(r,500));$('enemyWrap').classList.remove('enemy-attack');const dmg=Math.max(1,8-2);heroHp=Math.max(0,heroHp-dmg);popup(`-${dmg} HP`,'hero');$('heroWrap').classList.add('hurt');hero.src=frames.hurt[1];await new Promise(r=>setTimeout(r,550));$('heroWrap').classList.remove('hurt');if(heroHp<=0){dead=true;await playFrames(frames.die,130);say('Ayan has fallen. Press Restart to try again.');$('toast').textContent='DEFEAT';$('toast').classList.add('visible');}else{say('Your turn!');}busy=false;update();}
async function action(type:string){if(busy||dead||enemyHp<=0)return;busy=true;update();let damage=0;if(type==='normal'){say('Ayan performs a 3-hit spear combo!');await playFrames(frames.attack,90);for(let i=0;i<3;i++){const scale=[.52,.48,.68][i];damage+=Math.floor(20*scale*(buffRounds>0?1.3:1));energy=Math.min(50,energy+3);popup(`-${Math.floor(20*scale)} · +3 Energy`,'enemy');await new Promise(r=>setTimeout(r,140));}}
if(type==='skill'){if(energy>50)energy=50;say('Gale Piercer — two wind-charged hits!');await playFrames(frames.skill,100);damage=Math.floor(20*.89)+Math.floor(20*.89);energy=Math.min(50,energy+15);defDown=2;fx('wind');popup(`-${damage} · DEF -10%`,'enemy');}
if(type==='ult'){if(energy<50){busy=false;return;}say('TEMPEST AWAKENING!');energy-=50;damage=Math.floor(20*1.6);buffRounds=4;await playFrames(Array.from({length:6},(_,i)=>`/assets/ayan/ultimate_tempest_awakening/ultimate_tempest_awakening_${String(i+1).padStart(2,'0')}.png`),120);fx('ultimate');popup(`-${damage} · ATK UP 30%`,'enemy');}
// Simple prototype damage calculation; DEF reduction is represented in the combat log.
enemyHp=Math.max(0,enemyHp-damage);update();if(enemyHp<=0){$('enemyWrap').classList.add('dead');say('Shadow Beast defeated!');$('toast').textContent='VICTORY';$('toast').classList.add('visible');busy=false;return;}if(type!=='skill'&&defDown>0)defDown--;if(buffRounds>0)buffRounds--;await enemyTurn();}
$('normalBtn').addEventListener('click',()=>action('normal'));$('skillBtn').addEventListener('click',()=>action('skill'));$('ultBtn').addEventListener('click',()=>action('ult'));
$('backBtn').addEventListener('click',()=>{location.reload()});
const restart=document.createElement('button');restart.textContent='↻ Restart Battle';restart.className='restart';restart.onclick=()=>location.reload();document.querySelector('.bottom-panel')?.append(restart);
update();
