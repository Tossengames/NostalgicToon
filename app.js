// ======================
// CONFIG
// ======================
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?output=csv";

const MAX_PLAY_TIME = 25; // seconds

let videos = [];
let forceTimer = null;
let showInfo = true;

// ======================
// ELEMENTS
// ======================
const videoEl = document.getElementById("video");
const titleEl = document.getElementById("title");
const infoEl = document.getElementById("info");
const clockEl = document.getElementById("clock");

// ======================
// AUDIO (OLD TECH STYLE)
// ======================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep(freq = 900, dur = 0.05) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "square";
  o.frequency.value = freq;
  g.gain.value = 0.05;
  o.connect(g).connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + dur);
}

function staticNoise(dur = 0.25) {
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.connect(audioCtx.destination);
  src.start();
}

// ======================
// CLOCK
// ======================
setInterval(() => {
  clockEl.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}, 1000);

// ======================
// LOAD SHEET DATA
// ======================
async function loadVideos() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();

  videos = text
    .trim()
    .split("\n")
    .slice(1)
    .map(row => {
      const [approved, title, author, url, hour] =
        row.split(",").map(v => v.replace(/^"|"$/g, "").trim());

      return {
        approved: approved === "yes",
        title,
        author,
        url,
        hour: hour === "" ? null : Number(hour)
      };
    })
    .filter(v => v.approved && v.url);
}

// ======================
// VIDEO LOGIC
// ======================
function validVideos() {
  const h = new Date().getHours();
  return videos.filter(v => v.hour === null || v.hour === h);
}

function playRandom() {
  if (!videos.length) return;

  const pool = validVideos();
  if (!pool.length) return;

  const v = pool[Math.floor(Math.random() * pool.length)];
  titleEl.textContent = `▸ ${v.title} – by ${v.author}`;

  videoEl.src = v.url;
  videoEl.play();

  if (forceTimer) clearTimeout(forceTimer);
  forceTimer = setTimeout(() => {
    staticNoise();
    playRandom();
  }, MAX_PLAY_TIME * 1000);
}

videoEl.onended = () => {
  if (forceTimer) clearTimeout(forceTimer);
  staticNoise(0.2);
  playRandom();
};

// ======================
// CONTROLS
// ======================
document.getElementById("switch").onclick = () => {
  audioCtx.resume();
  beep(700);
  staticNoise();
  playRandom();
};

document.getElementById("toggleInfo").onclick = () => {
  audioCtx.resume();
  beep(1200, 0.04);
  showInfo = !showInfo;
  infoEl.style.opacity = showInfo ? 1 : 0;
};

// ======================
// START
// ======================
loadVideos().then(playRandom);