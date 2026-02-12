// === CONFIG ===
const SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
const FORM_URL = 'PASTE_YOUR_GOOGLE_FORM_URL_HERE';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
const PLAY_TIME = 25000; // 25 seconds
const FADE_TIME = 1000; // 1s fade

// === STATE ===
let videos = [];
let startH = 0, endH = 23;

// === ELEMENTS ===
const tv = document.getElementById('tv');
const submit = document.getElementById('submit');
const player = document.getElementById('player');
const meta = document.getElementById('meta');
const click = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');

// === UI ===
function sfx(){ click.currentTime=0; click.play(); }
function showTV(){ sfx(); tv.classList.add('active'); submit.classList.remove('active'); }
function showSubmit(){ sfx(); submit.classList.add('active'); tv.classList.remove('active'); }

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
  });

// === PLAY WITH FADE ===
function playRandom(){
  if(!videos.length) return;
  const h = new Date().getHours();
  const pool = videos.filter(v=>h>=v.start && h<=v.end);
  const v = pool[Math.floor(Math.random()*pool.length)] || videos[0];
  staticSfx.play();
  meta.innerText = `📼 ${v.title} — by ${v.by}`;

  // Fade in
  player.style.opacity = 0;
  player.src = v.url + '?autoplay=1&controls=0';
  setTimeout(()=>player.style.opacity=1,50);

  // Schedule fade out
  setTimeout(()=>{
    player.style.opacity = 0;
    setTimeout(()=>player.src='', FADE_TIME);
  }, PLAY_TIME - FADE_TIME);
}

// === SUBMIT ===
const link = s_link, title = s_title;
function validate(){ btnSend.disabled = !(link.value.includes('youtube') && title.value.length>2); }
link.oninput = title.oninput = validate;

btnSend.onclick = ()=>{
  sfx();
  const params = new URLSearchParams({
    'entry.111': link.value,
    'entry.222': title.value,
    'entry.333': s_name.value,
    'entry.444': s_email.value,
    'entry.555': startH,
    'entry.666': endH
  });
  window.open(FORM_URL + '?' + params.toString(),'_blank');
  showTV();
};

// === BUTTONS ===
btnSwitch.onclick = ()=>{ sfx(); playRandom(); }
btnSubmit.onclick = showSubmit;
btnInfo.onclick = ()=>{ sfx(); info.classList.add('active'); }
function closeInfo(){ sfx(); info.classList.remove('active'); }