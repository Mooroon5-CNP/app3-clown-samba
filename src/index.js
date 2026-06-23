'use strict';

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

const PORT = process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || '/data';
const DB_PATH = path.join(DATA_DIR, 'jokes.db');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'clown-samba' },
  transports: [new winston.transports.Console()],
});

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS blagues (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    setup TEXT    NOT NULL,
    punch TEXT    NOT NULL,
    told_at TEXT  NOT NULL DEFAULT (datetime('now'))
  )
`);

const BLAGUES = [
  { setup: "Pourquoi les plongeurs plongent-ils toujours en arrière ?", punch: "Parce que sinon ils tomberaient dans le bateau ! 🚤" },
  { setup: "Comment appelle-t-on un chat tombé dans un pot de peinture ?", punch: "Un chat-peint ! 🎨" },
  { setup: "Pourquoi l'épouvantail a-t-il reçu un prix ?", punch: "Parce qu'il était exceptionnel dans son domaine ! 🌾" },
  { setup: "Qu'est-ce qu'un boomerang qui ne revient pas ?", punch: "Un bâton ! 🪃" },
  { setup: "Comment appelle-t-on un chien sans pattes ?", punch: "Peu importe comment tu l'appelles, il viendra pas ! 🐕" },
  { setup: "Pourquoi les mathématiciens confondent Halloween et Noël ?", punch: "Parce que Oct 31 = Dec 25 ! 🎃🎄" },
  { setup: "Qu'est-ce qui est jaune et qui attend ?", punch: "Jonathan ! 🟡" },
  { setup: "Qu'est-ce qu'un canif ?", punch: "Un petit fien ! 🔪" },
  { setup: "Qu'est-ce qu'un crocodile qui surveille les autres crocodiles ?", punch: "Un vigil-ante ! 🐊" },
  { setup: "Pourquoi les girafes ont-elles un long cou ?", punch: "Parce que leurs pieds sentent mauvais ! 🦒" },
  { setup: "Comment appelle-t-on un magicien sans baguette ?", punch: "Un tragicien ! 🪄" },
  { setup: "Qu'est-ce qu'un piano au fond de la mer ?", punch: "Une épave ! 🎹" },
];

const insertBlague = db.prepare('INSERT INTO blagues (setup, punch) VALUES (?, ?)');
const getHistory  = db.prepare('SELECT id, setup, punch, told_at FROM blagues ORDER BY id DESC LIMIT 50');
const countTotal  = db.prepare('SELECT COUNT(*) as n FROM blagues');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.on('finish', () => logger.info('request', { method: req.method, path: req.path, status: res.statusCode }));
  next();
});

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
app.get('/ready',   (_req, res) => res.json({ status: 'ready' }));

app.get('/api/blague', (_req, res) => {
  const b = BLAGUES[Math.floor(Math.random() * BLAGUES.length)];
  insertBlague.run(b.setup, b.punch);
  const { n } = countTotal.get();
  res.json({ ...b, total: n });
});

app.get('/api/historique', (_req, res) => {
  res.json(getHistory.all());
});

app.get('/', (_req, res) => {
  const { n } = countTotal.get();
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🤡 Clown Samba</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: radial-gradient(ellipse at top, #1a0533 0%, #0d001a 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
      color: #fff;
    }
    h1 { font-size: 2.8rem; margin-bottom: .3rem; text-shadow: 0 0 20px #ff00ff88; }
    .subtitle { color: #c084fc; margin-bottom: 1.5rem; font-size: 1rem; }

    /* ── STAGE ── */
    .stage {
      position: relative;
      width: 220px;
      height: 220px;
      margin-bottom: 1.5rem;
    }
    .spotlight {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: radial-gradient(circle, #fff3 0%, transparent 70%);
      pointer-events: none;
    }
    .clown {
      font-size: 9rem;
      line-height: 1;
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      cursor: pointer;
      user-select: none;
      filter: drop-shadow(0 0 12px #ff00ff);
      transition: filter .2s;
    }
    .clown.dancing { animation: samba 0.35s infinite alternate; }
    @keyframes samba {
      0%   { transform: translate(-50%, -50%) rotate(-18deg) translateY(0px)   scale(1);    }
      25%  { transform: translate(-50%, -50%) rotate(0deg)   translateY(-18px) scale(1.08); }
      50%  { transform: translate(-50%, -50%) rotate(18deg)  translateY(0px)   scale(1);    }
      75%  { transform: translate(-50%, -50%) rotate(0deg)   translateY(-12px) scale(1.05); }
      100% { transform: translate(-50%, -50%) rotate(-18deg) translateY(0px)   scale(1);    }
    }
    .notes {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .note {
      position: absolute;
      font-size: 1.5rem;
      animation: floatNote 1.2s ease-out forwards;
      opacity: 0;
    }
    @keyframes floatNote {
      0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
      100% { opacity: 0; transform: translateY(-90px) rotate(25deg); }
    }

    /* ── JOKE CARD ── */
    .joke-card {
      background: linear-gradient(135deg, #2d0057, #4a0072);
      border: 2px solid #a855f7;
      border-radius: 1.2rem;
      padding: 1.5rem 2rem;
      max-width: 500px;
      width: 100%;
      margin-bottom: 1.5rem;
      box-shadow: 0 0 30px #a855f744;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      gap: .75rem;
      transition: opacity .3s;
    }
    .setup  { font-size: 1.15rem; color: #e9d5ff; }
    .punch  { font-size: 1.3rem;  font-weight: bold; color: #fde68a; display: none; }
    .punch.visible { display: block; }

    /* ── CONTROLS ── */
    .controls { display: flex; gap: .75rem; margin-bottom: 2rem; flex-wrap: wrap; justify-content: center; }
    button {
      padding: .75rem 1.5rem;
      font-size: 1.05rem;
      font-weight: bold;
      border: none;
      border-radius: .7rem;
      cursor: pointer;
      transition: transform .1s, box-shadow .1s;
    }
    button:active { transform: scale(.96); }
    .btn-blague  { background: linear-gradient(135deg, #9333ea, #ec4899); color: #fff; box-shadow: 0 4px 15px #9333ea66; }
    .btn-punch   { background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; box-shadow: 0 4px 15px #f59e0b66; }
    .btn-music   { background: linear-gradient(135deg, #10b981, #0891b2); color: #fff; box-shadow: 0 4px 15px #10b98166; }
    .btn-blague:hover { box-shadow: 0 6px 20px #9333ea99; }

    /* ── COUNTER ── */
    .counter { color: #c084fc; font-size: .9rem; margin-bottom: 1.5rem; }

    /* ── HISTORY ── */
    .history-section { width: 100%; max-width: 600px; }
    .history-section h2 { font-size: 1.3rem; color: #a855f7; margin-bottom: .75rem; }
    .history-list { display: flex; flex-direction: column; gap: .5rem; max-height: 300px; overflow-y: auto; }
    .history-item {
      background: #ffffff0d;
      border-left: 3px solid #7c3aed;
      border-radius: .5rem;
      padding: .6rem 1rem;
      font-size: .85rem;
    }
    .history-item .h-setup { color: #d8b4fe; }
    .history-item .h-punch { color: #fde68a; margin-top: .2rem; }
    .history-item .h-time  { color: #6b7280; font-size: .75rem; margin-top: .2rem; }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>🤡 Clown Samba 🥁</h1>
  <p class="subtitle">Le clown qui danse et raconte des blagues mémorables</p>

  <div class="stage">
    <div class="spotlight"></div>
    <div class="clown" id="clown" title="Clique pour danser !">🤡</div>
    <div class="notes" id="notes"></div>
  </div>

  <div class="joke-card" id="jokeCard">
    <div class="setup" id="setup">Clique sur "Nouvelle blague" pour commencer !</div>
    <div class="punch" id="punch"></div>
  </div>

  <div class="controls">
    <button class="btn-blague" id="btnBlague">🎭 Nouvelle blague</button>
    <button class="btn-punch"  id="btnPunch"  style="display:none">🥁 La chute !</button>
    <button class="btn-music"  id="btnMusic">🎵 Samba ON</button>
  </div>

  <p class="counter" id="counter">Total de blagues racontées : <strong>${n}</strong></p>

  <div class="history-section">
    <h2>📜 Historique des blagues</h2>
    <div class="history-list" id="historyList">
      <p style="color:#6b7280;font-size:.85rem">Chargement…</p>
    </div>
  </div>

<script>
// ── State ──
let currentBlague = null;
let danceTimer    = null;
let sambaInterval = null;
let musicOn       = false;
let audioCtx      = null;

// ── DOM ──
const clown     = document.getElementById('clown');
const notesEl   = document.getElementById('notes');
const setupEl   = document.getElementById('setup');
const punchEl   = document.getElementById('punch');
const btnBlague = document.getElementById('btnBlague');
const btnPunch  = document.getElementById('btnPunch');
const btnMusic  = document.getElementById('btnMusic');
const counter   = document.getElementById('counter');
const historyEl = document.getElementById('historyList');

// ── Dance ──
function dance(ms) {
  clown.classList.add('dancing');
  clearTimeout(danceTimer);
  danceTimer = setTimeout(() => clown.classList.remove('dancing'), ms || 3000);
}

function spawnNote() {
  const symbols = ['🎵','🎶','🎷','🎺','🥁','♪','♫'];
  const note = document.createElement('span');
  note.className = 'note';
  note.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  note.style.left = (20 + Math.random() * 60) + '%';
  note.style.top  = (40 + Math.random() * 30) + '%';
  note.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
  notesEl.appendChild(note);
  note.addEventListener('animationend', () => note.remove());
}

// ── Web Audio samba beat ──
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playDrum(time, type) {
  const ctx   = audioCtx;
  const dur   = type === 'hihat' ? 0.04 : type === 'snare' ? 0.12 : 0.25;
  const decay = type === 'hihat' ? 8 : type === 'snare' ? 5 : 10;
  const buf   = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data  = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, decay);
  }
  const src  = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buf;
  gain.gain.value = type === 'kick' ? 0.9 : type === 'snare' ? 0.55 : 0.28;
  src.connect(gain);
  gain.connect(ctx.destination);
  if (type === 'kick') {
    const osc = ctx.createOscillator();
    const og  = ctx.createGain();
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.2);
    og.gain.setValueAtTime(0.8, time);
    og.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(og); og.connect(ctx.destination);
    osc.start(time); osc.stop(time + 0.25);
  }
  src.start(time);
  src.stop(time + dur);
}

function startSamba() {
  initAudio();
  const bpm  = 132;
  const step = (60 / bpm) / 4;
  // samba pattern (16 steps): kick, snare, hihat
  const K = [1,0,0,0, 1,0,0,1, 0,0,1,0, 1,0,0,0];
  const S = [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0];
  const H = [1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1];
  let idx  = 0;
  let next = audioCtx.currentTime + 0.05;

  sambaInterval = setInterval(() => {
    while (next < audioCtx.currentTime + 0.15) {
      const s = idx % 16;
      if (K[s]) playDrum(next, 'kick');
      if (S[s]) playDrum(next, 'snare');
      if (H[s]) playDrum(next, 'hihat');
      idx++;
      next += step;
    }
    if (musicOn) spawnNote();
  }, 25);
}

function stopSamba() {
  clearInterval(sambaInterval);
  sambaInterval = null;
}

btnMusic.addEventListener('click', () => {
  musicOn = !musicOn;
  if (musicOn) {
    btnMusic.textContent = '🔇 Samba OFF';
    btnMusic.style.background = 'linear-gradient(135deg,#ef4444,#991b1b)';
    startSamba();
    dance(99999);
  } else {
    btnMusic.textContent = '🎵 Samba ON';
    btnMusic.style.background = 'linear-gradient(135deg,#10b981,#0891b2)';
    stopSamba();
    clown.classList.remove('dancing');
    clearTimeout(danceTimer);
  }
});

// ── Jokes ──
async function nouvelleBlague() {
  btnPunch.style.display = 'none';
  punchEl.classList.remove('visible');
  setupEl.textContent = '🥁 Le clown cherche une blague…';
  const res  = await fetch('/api/blague');
  const data = await res.json();
  currentBlague = data;
  setupEl.textContent = data.setup;
  punchEl.textContent = '';
  btnPunch.style.display = 'inline-block';
  counter.innerHTML = 'Total de blagues racontées : <strong>' + data.total + '</strong>';
}

function revelerChute() {
  if (!currentBlague) return;
  punchEl.textContent = currentBlague.punch;
  punchEl.classList.add('visible');
  btnPunch.style.display = 'none';
  dance(currentBlague.punch.length * 60 + 2500);
  if (!musicOn) { initAudio(); startSamba(); setTimeout(stopSamba, 3000); }
  loadHistory();
}

btnBlague.addEventListener('click', nouvelleBlague);
btnPunch.addEventListener('click', revelerChute);
clown.addEventListener('click', () => dance(3000));

// ── History ──
async function loadHistory() {
  const res  = await fetch('/api/historique');
  const list = await res.json();
  if (!list.length) {
    historyEl.innerHTML = '<p style="color:#6b7280;font-size:.85rem">Aucune blague racontée pour l'instant.</p>';
    return;
  }
  historyEl.innerHTML = list.map(b => \`
    <div class="history-item">
      <div class="h-setup">\${b.setup}</div>
      <div class="h-punch">\${b.punch}</div>
      <div class="h-time">\${new Date(b.told_at + 'Z').toLocaleString('fr-FR')}</div>
    </div>
  \`).join('');
}

loadHistory();
</script>
</body>
</html>`);
});

module.exports = app;

if (require.main === module) {
  const server = app.listen(PORT, () => logger.info('server started', { port: PORT }));
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}
