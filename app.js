// === CONFIG ===
const SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
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
const info = document.getElementById('info');
const h_start = document.getElementById('h_start');
const h_end = document.getElementById('h_end');
const btnSend = document.getElementById('btnSend');
const s_link = document.getElementById('s_link');
const s_title = document.getElementById('s_title');
const s_name = document.getElementById('s_name');
const s_email = document.getElementById('s_email');

const btnSwitch = document.getElementById('btnSwitch');
const btnSubmit = document.getElementById('btnSubmit');
const btnInfo = document.getElementById('btnInfo');
const btnShowName = document.getElementById('btnShowName');

// === UI FUNCTIONS ===
function sfx(){ click.currentTime=0; click.play(); }
function showTV(){ sfx(); tv.classList.add('active'); submit.classList.remove('active'); }
function showSubmit(){ sfx(); submit.classList.add('active'); tv.classList.remove('active'); }
function toggleName(){ sfx(); showName = !showName; meta.style.visibility = showName ? 'visible' : 'hidden'; }
function closeInfo(){ sfx(); info.classList.remove('active'); }

// === HOURS ===
function hour(t,v){
  sfx();
  if(t==='start'){ startH=(startH+v+24)%24; h_start.innerText=startH; }
  else{ endH=(endH+v+24)%24; h_end.innerText=endH; }
}

// === LOAD SHEET ===
fetch(SHEET_URL)
  .then(r=>r.text())
  .then(t=>{
    try {
        const json = JSON.parse(t.substring(47).slice(0,-2));
        videos = json.table.rows
          .map(r=>({
            url:r.c[0]?.v,
            title:r.c[1]?.v,
            by:r.c[2]?.v||'Anonymous',
            start:r.c[3]?.v ?? 0,
            end:r.c[4]?.v ?? 23,
            ok:r.c[5]?.v===true
          }))
          .filter(v=>v.ok);
        playRandom();
    } catch(e) {
        meta.innerText = "SIGNAL LOST - CHECK CONFIG";
    }
  });

// === PLAY VIDEO ===
function playRandom(){
  if(!videos.length) return;
  const h = new Date().getHours();
  const pool = videos.filter(v=>h>=v.start && h<=v.end);
  const v = pool[Math.floor(Math.random()*pool.length)] || videos[0];
  
  staticSfx.currentTime = 0;
  staticSfx.play();
  
  meta.innerText = `📼 ${v.title} — BY ${v.by}`;
  meta.style.visibility = showName ? 'visible' : 'hidden';
  
  player.style.opacity = 0;
  // Ensure the URL is prepared for autoplay
  let finalUrl = v.url;
  finalUrl += v.url.includes('?') ? '&autoplay=1&controls=0' : '?autoplay=1&controls=0';
  
  player.src = finalUrl;
  setTimeout(()=> player.style.opacity=1, 800);
  setTimeout(()=> player.src='', PLAY_TIME);
}

// === SUBMISSION ===
function validate(){ btnSend.disabled = !(s_link.value.includes('http') && s_title.value.length>2); }
s_link.oninput = s_title.oninput = validate;

btnSend.onclick = ()=>{
  sfx();
  const params = new URLSearchParams({
    'entry.111': s_link.value,
    'entry.222': s_title.value,
    'entry.333': s_name.value,
    'entry.444': s_email.value,
    'entry.555': startH,
    'entry.666': endH
  });
  window.open(FORM_URL + '?' + params.toString(),'_blank');
  showTV();
};

// === BUTTON EVENTS ===
btnSwitch.onclick = ()=>{ sfx(); playRandom(); };
btnSubmit.onclick = showSubmit;
btnInfo.onclick = ()=>{ sfx(); info.classList.add('active'); };
btnShowName.onclick = toggleName;
