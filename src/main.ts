
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root not found');

// GitHub Pages asset path
const ASSET_BASE = '/Aetheria-Astra-demo/';

app.innerHTML = `
<main class="battle-screen">
  <header class="topbar">
    <div class="brand">
      <span>✦</span>
      <div>
        <b>AETHERIA ASTRA</b>
        <small>WIND VALLEY · TEST BATTLE</small>
      </div>
    </div>
    <button id="backBtn" class="soft">← Main Menu</button>
  </header>

  <section class="arena">
    <div class="sky-orb"></div>
    <div class="ruins"></div>
    <div class="ground"></div>

    <div class="enemy-wrap" id="enemyWrap">
      <div class="enemy-hp">
        <b>SHADOW BEAST</b>
        <span id="enemyHpText">90 / 90</span>
        <div class="bar"><i id="enemyHpBar"></i></div>
      </div>
      <img id="enemySprite"
        src="${ASSET_BASE}assets/shadow_beast.png"
        alt="Shadow Beast enemy">
    </div>

    <div class="hero-wrap" id="heroWrap">
      <img id="heroSprite"
        src="${ASSET_BASE}assets/ayan/idle/idle_01.png"
        alt="Ayan character">
      <div class="hero-hp">
        <b>AYAN · LV. 1</b>
        <span id="heroHpText">100 / 100</span>
        <div class="bar"><i id="heroHpBar"></i></div>
      </div>
    </div>

    <div class="battle-fx" id="battleFx"></div>
    <div class="float-text" id="floatText"></div>
  </section>

  <section class="bottom-panel">
    <div class="status">
      <div>
        <b>HP</b>
        <div class="bar"><i id="heroHpBar2"></i></div>
      </div>
      <div>
        <b>ENERGY <span id="energyText">0 / 50</span></b>
        <div class="bar energy"><i id="energyBar"></i></div>
      </div>
      <p id="log">A Shadow Beast blocks the path. Choose an action!</p>
    </div>

    <div class="actions">
      <button id="normalBtn">
        <strong>⚔</strong>
        <span>Normal Attack<small>3 hits · +9 Energy</small></span>
      </button>

      <button id="skillBtn">
        <strong>🌪</strong>
        <span>Gale Piercer<small>2 hits · +15 Energy</small></span>
      </button>

      <button id="ultBtn" disabled>
        <strong>✦</strong>
        <span>Tempest Awakening<small>50 Energy</small></span>
      </button>
    </div>
  </section>

  <div class="toast" id="toast"></div>
</main>`;

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

const hero = $('heroSprite') as HTMLImageElement;

let heroHp = 100;
let enemyHp = 90;
let energy = 0;
let busy = false;
let dead = false;
let buffRounds = 0;
let defDown = 0;

const maxEnergy = 50;

const frames: Record<string, string[]> = {
  idle: Array.from({ length: 7 }, (_, i) =>
    `${ASSET_BASE}assets/ayan/idle/idle_${String(i + 1).padStart(2, '0')}.png`
  ),

  attack: Array.from({ length: 5 }, (_, i) =>
    `${ASSET_BASE}assets/ayan/attack_1/attack_1_${String(i + 1).padStart(2, '0')}.png`
  ),

  skill: Array.from({ length: 6 }, (_, i) =>
    `${ASSET_BASE}assets/ayan/skill_gale_piercer/skill_gale_piercer_${String(i + 1).padStart(2, '0')}.png`
  ),

  hurt: Array.from({ length: 7 }, (_, i) =>
    `${ASSET_BASE}assets/ayan/damage_hurt/damage_hurt_${String(i + 1).padStart(2, '0')}.png`
  ),

  die: Array.from({ length: 7 }, (_, i) =>
    `${ASSET_BASE}assets/ayan/die/die_${String(i + 1).padStart(2, '0')}.png`
  )
};

function playFrames(
  list: string[],
  delay = 95
): Promise<void> {
  return new Promise(resolve => {
    let i = 0;

    const step = () => {
      hero.src = list[i];
      i++;

      if (i < list.length) {
        setTimeout(step, delay);
      } else {
        setTimeout(() => {
          hero.src = frames.idle[0];
          resolve();
        }, delay);
      }
    };

    step();
  });
}

function update() {
  $('heroHpText').textContent = `${heroHp} / 100`;
  $('heroHpBar').style.width = `${heroHp}%`;
  $('heroHpBar2').style.width = `${heroHp}%`;

  $('enemyHpText').textContent = `${enemyHp} / 90`;
  $('enemyHpBar').style.width = `${enemyHp / 90 * 100}%`;

  $('energyText').textContent = `${energy} / 50`;
  $('energyBar').style.width = `${energy / 50 * 100}%`;

  $('ultBtn').toggleAttribute(
    'disabled',
    energy < maxEnergy || busy || dead
  );
}

function say(message: string) {
  $('log').textContent = message;
}

function popup(message: string, who = 'hero') {
  const el = $('floatText');
  el.textContent = message;
  el.className = `float-text show ${who}`;

  setTimeout(() => {
    el.className = 'float-text';
  }, 750);
}

function fx(kind: string) {
  const el = $('battleFx');
  el.className = `battle-fx ${kind}`;

  setTimeout(() => {
    el.className = 'battle-fx';
  }, 650);
}

async function enemyTurn() {
  if (enemyHp <= 0 || heroHp <= 0) return;

  busy = true;
  update();

  say('Shadow Beast prepares a claw strike!');
  $('enemyWrap').classList.add('enemy-attack');

  await new Promise(resolve => setTimeout(resolve, 500));

  $('enemyWrap').classList.remove('enemy-attack');

  const damage = 6;
  heroHp = Math.max(0, heroHp - damage);

  popup(`-${damage} HP`, 'hero');

  $('heroWrap').classList.add('hurt');
  hero.src = frames.hurt[1];

  await new Promise(resolve => setTimeout(resolve, 550));

  $('heroWrap').classList.remove('hurt');

  if (heroHp <= 0) {
    dead = true;
    await playFrames(frames.die, 130);

    say('Ayan has fallen. Press Restart to try again.');

    $('toast').textContent = 'DEFEAT';
    $('toast').classList.add('visible');
  } else {
    say('Your turn!');
  }

  busy = false;
  update();
}

async function action(type: string) {
  if (busy || dead || enemyHp <= 0) return;

  busy = true;
  update();

  let damage = 0;

  if (type === 'normal') {
    say('Ayan performs a 3-hit spear combo!');

    await playFrames(frames.attack, 90);

    const hits = [0.52, 0.48, 0.68];

    for (const scale of hits) {
      const hit = Math.floor(
        20 * scale * (buffRounds > 0 ? 1.3 : 1)
      );

      damage += hit;
      energy = Math.min(maxEnergy, energy + 3);

      popup(`-${hit} · +3 Energy`, 'enemy');

      await new Promise(resolve => setTimeout(resolve, 140));
    }
  }

  if (type === 'skill') {
    say('Gale Piercer — two wind-charged hits!');

    await playFrames(frames.skill, 100);

    damage = Math.floor(20 * 0.89) * 2;
    energy = Math.min(maxEnergy, energy + 15);

    defDown = 2;

    fx('wind');
    popup(`-${damage} · DEF -10%`, 'enemy');
  }

  if (type === 'ult') {
    if (energy < maxEnergy) {
      busy = false;
      update();
      return;
    }

    say('TEMPEST AWAKENING!');

    energy -= maxEnergy;
    damage = Math.floor(20 * 1.6);
    buffRounds = 4;

    const ultimateFrames = Array.from(
      { length: 6 },
      (_, i) =>
        `${ASSET_BASE}assets/ayan/ultimate_tempest_awakening/ultimate_tempest_awakening_${String(i + 1).padStart(2, '0')}.png`
    );

    await playFrames(ultimateFrames, 120);

    fx('ultimate');
    popup(`-${damage} · ATK UP 30%`, 'enemy');
  }

  enemyHp = Math.max(0, enemyHp - damage);
  update();

  if (enemyHp <= 0) {
    $('enemyWrap').classList.add('dead');
    say('Shadow Beast defeated!');

    $('toast').textContent = 'VICTORY';
    $('toast').classList.add('visible');

    busy = false;
    return;
  }

  if (type !== 'skill' && defDown > 0) {
    defDown--;
  }

  if (buffRounds > 0) {
    buffRounds--;
  }

  await enemyTurn();
}

$('normalBtn').addEventListener('click', () => action('normal'));
$('skillBtn').addEventListener('click', () => action('skill'));
$('ultBtn').addEventListener('click', () => action('ult'));

$('backBtn').addEventListener('click', () => {
  location.reload();
});

const restart = document.createElement('button');
restart.textContent = '↻ Restart Battle';
restart.className = 'restart';

restart.onclick = () => location.reload();

document.querySelector('.bottom-panel')?.append(restart);

update();
        
