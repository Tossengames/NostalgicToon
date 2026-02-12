// === CONFIG – YOUR ACTUAL SHEET & FORM ===
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
function sfx() { if (click) { click.currentTime = 0; click.play(); } }
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

// === LOAD SHEET – UPDATED FOR YOUR COLUMN ORDER ===
fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq&gid=0`)
  .then(r => r.text())
  .then(t => {
    console.log('Sheet loaded successfully');
    const json = JSON.parse(t.substring(47).slice(0, -2));
    videos = json.table.rows
      .map(r => ({
        // Your sheet columns are:
        // A: Timestamp, B: Email, C: Video Link, D: Video Title, 
        // E: Your Name, F: Start Hour, G: End Hour
        // NO APPROVED COLUMN – so we need to mark everything as approved
        url: r.c[2]?.v,      // Column C: Video Link
        title: r.c[3]?.v,    // Column D: Video Title
        by: r.c[4]?.v || 'Anonymous', // Column E: Your Name
        start: r.c[5]?.v ?? 0,        // Column F: Start Hour
        end: r.c[6]?.v ?? 23,         // Column G: End Hour
        ok: true              // ✅ EVERY video is approved (no approval column)
      }))
      .filter(v => v.url && v.title); // Only filter out empty rows
    console.log(`Loaded ${videos.length} videos`);
    playRandom();
  })
  .catch(err => {
    console.error('Sheet load error:', err);
    meta.innerText = '📼 Loading sheet... check sharing settings';
  });

// === PLAY VIDEO ===
function playRandom() {
  if (!videos.length) {
    meta.innerText = '📼 No videos yet – submit one!';
    return;
  }
  const h = new Date().getHours();
  const pool = videos.filter(v => h >= v.start && h <= v.end);
  const v = pool[Math.floor(Math.random() * pool.length)] || videos[0];
  
  if (staticSfx) staticSfx.play();
  meta.innerText = `📼 ${v.title} — by ${v.by}`;
  meta.style.display = showName ? 'block' : 'none';
  
  player.style.opacity = 0;
  player.src = v.url + '?autoplay=1&controls=0&enablejsapi=1';
  
  setTimeout(() => player.style.opacity = 1, 100);
  setTimeout(() => { player.src = ''; }, PLAY_TIME);
}

// === SUBMISSION – YOUR REAL ENTRY IDs ===
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
    'entry.1202453826': s_name.value, // Your Name
    'entry.1066956225': s_email.value, // Email
    'entry.1319389294': startH,       // Start Hour
    'entry.117336059': endH           // End Hour
  });
  window.open(FORM_URL + '?' + params.toString(), '_blank');
  showTV();
  
  // Clear form
  link.value = '';
  title.value = '';
  s_name.value = '';
  s_email.value = '';
  startH = 0; endH = 23;
  document.getElementById('h_start').innerText = '0';
  document.getElementById('h_end').innerText = '23';
  btnSend.disabled = true;
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

// === AUTO-PLAY ON LOAD ===
window.addEventListener('load', () => {
  setTimeout(() => {
    if (videos.length > 0) playRandom();
  }, 500);
});