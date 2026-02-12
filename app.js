// === CONFIG ===
const SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
const FORM_URL = 'PASTE_YOUR_GOOGLE_FORM_URL_HERE';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
const DEFAULT_VIDEO = 'https://youtube.com/shorts/b9LB6XlmqsM';
const PLAY_TIME = 30000; 

// === STATE ===
let videos = [];
let startH = 0, endH = 23;
let showName = true;

// === ELEMENTS ===
const player = document.getElementById('player');
const meta = document.getElementById('meta');
const click = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');
const viewTV = document.getElementById('tv');
const viewSubmit = document.getElementById('submit');
const viewInfo = document.getElementById('info');

// === UI NAVIGATION ===
function sfx(){ click.currentTime=0; click.play(); }

function showTV(){ 
    sfx(); 
    viewTV.classList.add('active'); 
    viewSubmit.classList.remove('active'); 
    viewInfo.classList.remove('active');
}

function showSubmit(){ 
    sfx(); 
    viewSubmit.classList.add('active'); 
    viewTV.classList.remove('active'); 
}

function openInfo(){ 
    sfx(); 
    viewInfo.classList.add('active'); 
}

function closeInfo(){ 
    sfx(); 
    viewInfo.classList.remove('active'); 
}

function toggleName(){ 
    sfx(); 
    showName = !showName; 
    meta.style.visibility = showName ? "visible" : "hidden"; 
}

// === LOAD DATA ===
fetch(SHEET_URL)
  .then(r=>r.text())
  .then(t=>{
    try {
        const json = JSON.parse(t.substring(47).slice(0,-2));
        videos = json.table.rows
          .map(r=>({
            url:   r.c[1]?.v, 
            title: r.c[2]?.v, 
            by:    r.c[3]?.v || 'Anonymous', 
            start: r.c[5]?.v ?? 0,  
            end:   r.c[6]?.v ?? 23, 
            ok:    r.c[7]?.v === true 
          }))
          .filter(v=>v.ok && v.url);
    } catch(e) {
        console.log("Sheet not ready, using default.");
    }
    playRandom();
  })
  .catch(() => playRandom());

// === PLAY LOGIC ===
function playRandom(){
  // Use pool if sheet works, otherwise use default
  const h = new Date().getHours();
  const pool = videos.filter(v=>h>=v.start && h<=v.end);
  
  let selected;
  if(pool.length > 0) {
      selected = pool[Math.floor(Math.random()*pool.length)];
  } else if (videos.length > 0) {
      selected = videos[0];
  } else {
      selected = { url: DEFAULT_VIDEO, title: 'NOSTALGIA TV BOOT', by: 'System' };
  }
  
  staticSfx.play();
  meta.innerText = `OSD: ${selected.title.toUpperCase()}`;
  player.style.opacity = 0;
  
  let videoId = extractID(selected.url);
  player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&mute=0&rel=0&showinfo=0`;
  
  setTimeout(()=> player.style.opacity=1, 1000);
}

function extractID(url){
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// === HOURS ===
function hour(t,v){
  sfx();
  if(t==='start'){ startH=(startH+v+24)%24; document.getElementById('h_start').innerText=startH; }
  else{ endH=(endH+v+24)%24; document.getElementById('h_end').innerText=endH; }
}

// === BIND EVENTS ===
document.getElementById('btnSwitch').onclick = ()=>{ sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnShowName').onclick = toggleName;

// Validation
document.getElementById('s_link').oninput = document.getElementById('s_title').oninput = () => {
    document.getElementById('btnSend').disabled = !(document.getElementById('s_link').value.length > 5);
};
