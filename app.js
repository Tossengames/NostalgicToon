const SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
const FORM_URL = 'PASTE_YOUR_GOOGLE_FORM_URL_HERE';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
const PLAY_TIME = 30000; // Increased to 30s

let videos = [];
let startH = 0, endH = 23;
let showName = true;

const player = document.getElementById('player');
const meta = document.getElementById('meta');
const click = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');

function sfx(){ click.currentTime=0; click.play(); }
function showTV(){ sfx(); document.getElementById('tv').classList.add('active'); document.getElementById('submit').classList.remove('active'); }
function showSubmit(){ sfx(); document.getElementById('submit').classList.add('active'); document.getElementById('tv').classList.remove('active'); }
function closeInfo(){ sfx(); document.getElementById('info').classList.remove('active'); }

function toggleName(){ 
    sfx(); 
    showName = !showName; 
    meta.style.opacity = showName ? "1" : "0"; 
}

function hour(t,v){
  sfx();
  if(t==='start'){ startH=(startH+v+24)%24; document.getElementById('h_start').innerText=startH; }
  else{ endH=(endH+v+24)%24; document.getElementById('h_end').innerText=endH; }
}

// FETCH DATA - Updated indices for Google Form Timestamp (Col A)
fetch(SHEET_URL)
  .then(r=>r.text())
  .then(t=>{
    const json = JSON.parse(t.substring(47).slice(0,-2));
    videos = json.table.rows
      .map(r=>({
        url:   r.c[1]?.v, // Column B (Link)
        title: r.c[2]?.v, // Column C (Title)
        by:    r.c[3]?.v || 'Anonymous', // Column D (Sender)
        start: r.c[5]?.v ?? 0,  // Column F (Start)
        end:   r.c[6]?.v ?? 23, // Column G (End)
        ok:    r.c[7]?.v === true // Column H (Checkmark)
      }))
      .filter(v=>v.ok && v.url);
    playRandom();
  });

function playRandom(){
  if(!videos.length) { meta.innerText = "NO SIGNAL"; return; }
  
  const h = new Date().getHours();
  const pool = videos.filter(v=>h>=v.start && h<=v.end);
  const v = pool[Math.floor(Math.random()*pool.length)] || videos[0];
  
  staticSfx.currentTime = 0;
  staticSfx.play();
  
  meta.innerText = `CH-AUTO: ${v.title.toUpperCase()}`;
  player.style.opacity = 0;
  
  let videoId = extractID(v.url);
  player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&mute=0&iv_load_policy=3&rel=0`;
  
  setTimeout(()=> player.style.opacity=1, 1200);
}

function extractID(url){
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// VALIDATION & SUBMIT
const link = document.getElementById('s_link');
const title = document.getElementById('s_title');
const btnSend = document.getElementById('btnSend');

link.oninput = title.oninput = () => {
    btnSend.disabled = !(link.value.length > 10 && title.value.length > 2);
};

btnSend.onclick = ()=>{
  sfx();
  const params = new URLSearchParams({
    'entry.111': link.value,
    'entry.222': title.value,
    'entry.333': document.getElementById('s_name').value,
    'entry.444': document.getElementById('s_email').value,
    'entry.555': startH,
    'entry.666': endH
  });
  window.open(FORM_URL + '?' + params.toString(),'_blank');
  showTV();
};

document.getElementById('btnSwitch').onclick = ()=>{ sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = () => { sfx(); document.getElementById('info').classList.add('active'); };
document.getElementById('btnShowName').onclick = toggleName;
