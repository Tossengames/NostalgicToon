// === CONFIG ===
const SHEET_ID = '1l3NChHHcKJzYW9dK8mbb60ASmf7vrd9yxXn2tNfSaz0';
const FORM_URL = 'PASTE_YOUR_GOOGLE_FORM_URL_HERE';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
const PLAY_TIME = 25000; // 25 seconds

// === STATE ===
let videos = [];
let startH = 0, endH = 23;
let showName = true;

// === ELEMENTS ===
const tv = document.getElementById('tv');
const submit = document.getElementById('submit');
const player = document.getElementById('player');
const meta = document.getElementById('meta');
const click = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');
const info = document.getElementById('info'); // declared for closeInfo

// === UI FUNCTIONS (fully preserved) ===
function sfx() { click.currentTime = 0; click.play(); }
function showTV() { sfx(); tv.classList.add('active'); submit.classList.remove('active'); }
function showSubmit() { sfx(); submit.classList.add('active'); tv.classList.remove('active'); }
function toggleName() { sfx(); showName = !showName; meta.style.display = showName ? 'block' : 'none'; }
function closeInfo() { sfx(); info.classList.remove('active'); }

// === HOURS ===
function hour(t, v) {
  sfx();
  if (t === 'start') { startH = (startH + v + 24) % 24; document.getElementById('h_start').innerText = startH; }
  else { endH = (endH + v + 24) % 24; document.getElementById('h_end').innerText = endH; }
}

// === LOAD SHEET ===
fetch(SHEET_URL)
  .then(r => r.text())
  .then(t => {
    const json = JSON.parse(t.substring(47).slice(0, -2));
    videos = json.table.rows
      .map(r => ({
        url: r.c[0]?.v,
        title: r.c[1]?.v,
        by: r.c[2]?.v || 'Anonymous',
        start: r.c[3]?.v ?? 0,
        end: r.c[4]?.v ?? 23,
        ok: r.c[5]?.v === true
      }))
      .filter(v => v.ok);
    playRandom();
  });

// === PLAY VIDEO ===
function playRandom() {
  if (!videos.length) return;
  const h = new Date().getHours();
  const pool = videos.filter(v => h >= v.start && h <= v.end);
  const v = pool[Math.floor(Math.random() * pool.length)] || videos[0];
  staticSfx.play();
  meta.innerText = `📼 ${v.title} — by ${v.by}`;
  meta.style.display = showName ? 'block' : 'none';
  player.style.opacity = 0;
  player.src = v.url + '?autoplay=1&controls=0';
  setTimeout(() => player.style.opacity = 1, 100);
  setTimeout(() => player.src = '', PLAY_TIME);
}

// === SUBMISSION (preserved – keep IDs) ===
const link = document.getElementById('s_link');
const title = document.getElementById('s_title');
const s_name = document.getElementById('s_name');
const s_email = document.getElementById('s_email');
const btnSend = document.getElementById('btnSend');

function validate() { btnSend.disabled = !(link.value.includes('youtube') && title.value.length > 2); }
link.oninput = title.oninput = validate;

btnSend.onclick = () => {
  sfx();
  const params = new URLSearchParams({
    'entry.111': link.value,
    'entry.222': title.value,
    'entry.333': s_name.value,
    'entry.444': s_email.value,
    'entry.555': startH,
    'entry.666': endH
  });
  window.open(FORM_URL + '?' + params.toString(), '_blank');
  showTV();
};

// === BUTTON EVENTS (all original handlers) ===
document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = () => { sfx(); info.classList.add('active'); };
document.getElementById('btnShowName').onclick = toggleName;

// attach hour functions globally (used inline)
window.hour = hour;
window.showTV = showTV;
window.closeInfo = closeInfo;