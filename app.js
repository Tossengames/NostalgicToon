// ===== DATA =====
// Add videos here manually for now
const videos = [
  {
    title: "90s Cartoon Ad",
    author: "Alex",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    hour: null // null = anytime
  },
  {
    title: "Late Night TV Vibe",
    author: "Sam",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    hour: 23
  }
];

// ===== ELEMENTS =====
const videoEl = document.getElementById("video");
const titleEl = document.getElementById("title");
const infoEl = document.getElementById("info");
const clockEl = document.getElementById("clock");

let showInfo = true;

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}
setInterval(updateClock, 1000);
updateClock();

// ===== VIDEO PICKER =====
function getValidVideos() {
  const hour = new Date().getHours();
  return videos.filter(v => v.hour === null || v.hour === hour);
}

function playRandomVideo() {
  const pool = getValidVideos();
  if (pool.length === 0) return;

  const picked = pool[Math.floor(Math.random() * pool.length)];

  titleEl.textContent = `▸ ${picked.title} – by ${picked.author}`;

  videoEl.src = picked.url;
  videoEl.load();
  videoEl.play();
}

// ===== CONTROLS =====
document.getElementById("switch").onclick = () => {
  videoEl.pause();
  videoEl.src = "";
  setTimeout(playRandomVideo, 500);
};

document.getElementById("toggleInfo").onclick = () => {
  showInfo = !showInfo;
  infoEl.style.opacity = showInfo ? 1 : 0;
};

// Auto switch when video ends
videoEl.onended = playRandomVideo;

// Start first video
playRandomVideo();