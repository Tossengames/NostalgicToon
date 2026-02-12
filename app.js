// === CONFIG ===
const SHEET_ID = '1CcZCwijJ0Gi-5QoFSU8HHkm6bkZyyluAb0Sych32dMs';
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeUhmbjy6ZckDE1MyetLete4WrVpHyZRkws9aj1heuSelGjog/viewform';
const PLAY_TIME = 25000;

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
const info = document.getElementById('info');

// === UI FUNCTIONS ===
function sfx() { click.currentTime = 0; click.play(); }
function showTV() { sfx(); tv.classList.add('active'); submit.classList.remove('active'); }
function showSubmit() { sfx(); submit.classList.add('active'); tv.classList.remove('active'); }
function toggleName() { sfx(); showName = !showName; meta.style.display = showName ? 'block' : 'none'; }
function closeInfo() { sfx(); info.classList.remove('active'); }

// === HOURS ===
function hour(t, v) {
  sfx();
  if (t === 'start') { 
    startH = (startH + v + 24) % 24; 
    document.getElementById('h_start').innerText = startH; 
  } else { 
    endH = (endH + v + 24) % 24; 
    document.getElementById('h_end').innerText = endH; 
  }
}

// === LOAD SHEET ===
fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`)
  .then(r => r.text())
  .then(t => {
    const json = JSON.parse(t.substring(47).slice(0, -2));
    videos = json.table.rows
      .map(r => ({
        url: r.c[1]?.v,      // Column B
        title: r.c[2]?.v,    // Column C
        by: r.c[3]?.v || 'Anonymous', // Column D
        start: r.c[4]?.v ?? 0,        // Column E
        end: r.c[5]?.v ?? 23,         // Column F
        ok: r.c[6]?.v === true        // Column G
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

// === SUBMISSION ===
const link = document.getElementById('s_link');
const title = document.getElementById('s_title');
const s_name = document.getElementById('s_name');
const s_email = document.getElementById('s_email');
const btnSend = document.getElementById('btnSend');

function validate() { 
  btnSend.disabled = !(link.value.includes('youtube') && title.value.length > 2); 
}
link.oninput = title.oninput = validate;

btnSend.onclick = () => {
  sfx();
  const params = new URLSearchParams({
    'entry.374842444': link.value,   // Video Link
    'entry.1792715707': title.value, // Title
    'entry.1202453826': s_name.value, // Name
    'entry.1066956225': s_email.value, // Email
    'entry.1319389294': startH,       // Start Hour
    'entry.117336059': endH           // End Hour
  });
  window.open(FORM_URL + '?' + params.toString(), '_blank');
  showTV();
};

// === BUTTON EVENTS ===
document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = () => { sfx(); info.classList.add('active'); };
document.getElementById('btnShowName').onclick = toggleName;

// === GLOBALS ===
window.hour = hour;
window.showTV = showTV;
window.closeInfo = closeInfo;