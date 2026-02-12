// ======================
// AUDIO (90s TECH STYLE)
// ======================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function clickBeep(freq = 900, duration = 0.05) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = "square";
  gain.gain.value = 0.05;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function staticNoise(duration = 0.3) {
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(audioCtx.destination);
  src.start();
}

// ======================
// DATA (SHORT TEST CLIPS)
// ======================
const videos = [
  {
    title: "90s Commercial Vibe",
    author: "Archive",
    url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    hour: null
  },
  {
    title: "Old Cartoon Energy",
    author: "Retro",
    url: "https://media.w3.org/2010/05/bunny/trailer.mp4",
    hour: null
  },
  {
    title: "Late Night TV Mood",
    author: "Night",
    url: "https://media.w3.org/2010/05/video/movie_300.mp4",
    hour: 23
  }
];

// ======================
// ELEMENTS
// ======================
const videoEl = document.getElementById("video");
const titleEl = document.getElementById("title");
const infoEl = document.getElementById("info");
const clockEl = document.getElementById("clock");
const tv = document.getElementById("tv");

let showInfo = true;

// ======================
// CLOCK
// ======================
function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}
setInterval(updateClock, 1000);
updateClock();

// ======================
// VIDEO LOGIC
// ======================
function validVideos() {
  const h = new Date().getHours();
  return videos.filter(v => v.hour === null || v.hour === h);
}

function playRandom() {
  const pool = validVideos();
  if (!pool.length) return;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  titleEl.textContent = `▸ ${pick.title} – by ${pick.author}`;

  videoEl.src = pick.url;
  videoEl.load();
  videoEl.play();
}

// ======================
// CONTROLS
// ======================
document.getElementById("switch").onclick = () => {
  audioCtx.resume();
  clickBeep(700);
  staticNoise();
  tv.classList.add("switching");
  videoEl.pause();
  setTimeout(() => {
    playRandom();
    tv.classList.remove("switching");
  }, 400);
};

document.getElementById("toggleInfo").onclick = () => {
  audioCtx.resume();
  clickBeep(1200, 0.04);
  showInfo = !showInfo;
  infoEl.style.opacity = showInfo ? 1 : 0;
};

// Auto-play next
videoEl.onended = () => {
  staticNoise(0.2);
  playRandom();
};

// Start
playRandom();