// === CONFIG – YOUR NEW SHEET & FORM ===
const SHEET_ID = '1mVgVFSpT4fb6HTf4-8fi_fxDXReZ69LUOI5vGdo0DPU';
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSebUTZIz5BC-l3I_iX9zguGN6XcoZ12ocZh6MvbWulyNCQ7ww/viewform';
const PLAY_TIME = 25000;

// === STATE ===
let videos = [];
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

// === LOAD SHEET – CSV ENDPOINT ===
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

fetch(SHEET_CSV_URL)
  .then(r => r.text())
  .then(csvText => {
    console.log('Sheet loaded successfully');
    const rows = csvText.split('\n').filter(row => row.trim());
    const headers = rows[0].split(',');
    
    // Find columns dynamically
    const linkIndex = headers.findIndex(h => 
      h.toLowerCase().includes('video') || h.toLowerCase().includes('link')
    ) || 1;
    
    const nameIndex = headers.findIndex(h => 
      h.toLowerCase().includes('name') || h.toLowerCase().includes('submitted')
    ) || 2;
    
    // Process rows (skip header)
    videos = rows.slice(1).map(row => {
      const cols = row.split(',');
      return {
        url: cols[linkIndex]?.replace(/"/g, '').trim(),
        by: cols[nameIndex]?.replace(/"/g, '').trim() || 'Anonymous'
      };
    }).filter(v => v.url && v.url.includes('youtube'));
    
    console.log(`Loaded ${videos.length} videos`);
    playRandom();
  })
  .catch(err => {
    console.error('Sheet load error:', err);
    meta.innerText = '📼 Click the ▶ button to start';
    // Fallback demo video
    videos = [
      {
        url: 'https://www.youtube.com/watch?v=2yJgwwDcgV8',
        by: 'RetroFan'
      }
    ];
  });

// === PLAY VIDEO ===
function playRandom() {
  if (!videos.length) {
    meta.innerText = '📼 No videos yet – submit one!';
    return;
  }
  
  const v = videos[Math.floor(Math.random() * videos.length)];
  
  if (staticSfx) staticSfx.play();
  meta.innerText = `📼 ${v.by}`;
  meta.style.display = showName ? 'block' : 'none';
  
  player.style.opacity = 0;
  player.src = v.url + '?autoplay=1&controls=0&enablejsapi=1';
  
  setTimeout(() => player.style.opacity = 1, 100);
  setTimeout(() => { player.src = ''; }, PLAY_TIME);
}

// === SUBMISSION – YOUR NEW ENTRY IDs ===
const link = document.getElementById('s_link');
const s_name = document.getElementById('s_name');
const btnSend = document.getElementById('btnSend');

function validate() { 
  btnSend.disabled = !(link.value.includes('youtube') && s_name.value.length > 0); 
}
link.oninput = s_name.oninput = validate;

btnSend.onclick = () => {
  sfx();
  
  // Your new Entry IDs from prefilled link
  const params = new URLSearchParams({
    'entry.873128711': link.value,   // ✅ Video Link ID
    'entry.3875702': s_name.value    // ✅ Your Name ID
  });
  
  window.open(FORM_URL + '?' + params.toString(), '_blank');
  showTV();
  
  // Clear form
  link.value = '';
  s_name.value = '';
  btnSend.disabled = true;
};

// === BUTTON EVENTS ===
document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = () => { sfx(); info.classList.add('active'); };
document.getElementById('btnShowName').onclick = toggleName;

// === GLOBALS ===
window.showTV = showTV;
window.closeInfo = closeInfo;

// === AUTO-PLAY ===
window.addEventListener('load', () => {
  setTimeout(() => {
    if (videos.length > 0) playRandom();
  }, 500);
});