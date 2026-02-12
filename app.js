const SHEET_ID = '1mVgVFSpT4fb6HTf4-8fi_fxDXReZ69LUOI5vGdo0DPU';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const DEFAULT_VIDEO = 'https://youtube.com/shorts/b9LB6XlmqsM';

let videos = [];
let showName = true;
const player = document.getElementById('player');
const meta = document.getElementById('meta');
const click = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');

function sfx() { click.currentTime = 0; click.play(); }

function osdMsg(text) {
    const old = meta.innerText;
    meta.innerText = `>> ${text.toUpperCase()}`;
    setTimeout(() => { meta.innerText = old; }, 3000);
}

function showTV() { sfx(); document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); document.getElementById('tv').classList.add('active'); }
function showSubmit() { sfx(); document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); document.getElementById('submit').classList.add('active'); }
function closeInfo() { sfx(); document.getElementById('info').classList.remove('active'); }

async function loadVideos() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        const rows = data.split('\n').slice(1); 
        videos = rows.map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                url: cols[1] ? cols[1].replace(/"/g, '').trim() : null, // Col B
                by: cols[2] ? cols[2].replace(/"/g, '').trim() : 'Anon'  // Col C
            };
        }).filter(v => v.url && v.url.includes('http'));
    } catch (e) { osdMsg("LOAD ERROR"); }
    playRandom();
}

function playRandom() {
    let v = (videos.length > 0) ? videos[Math.floor(Math.random()*videos.length)] : {url: DEFAULT_VIDEO, by: 'SYSTEM'};
    staticSfx.play();
    meta.innerText = `OSD: ${v.by.toUpperCase()}`;
    player.style.opacity = 0;
    let id = extractID(v.url);
    player.src = `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&rel=0`;
    setTimeout(() => player.style.opacity = 1, 1000);
}

function extractID(url) {
    const reg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = url.match(reg);
    return (match && match[2].length === 11) ? match[2] : url;
}

// THE FIXED SUBMISSION LOGIC
function submitNostalgia() {
    sfx();
    const linkVal = document.getElementById('s_link').value;
    const nameVal = document.getElementById('s_name').value || 'Anonymous';

    if(!linkVal.includes('http')) return osdMsg("INVALID URL");

    // 1. Map values to hidden form
    document.getElementById('f_link').value = linkVal;
    document.getElementById('f_name').value = nameVal;

    // 2. Fire the hidden form
    document.getElementById('submissionForm').submit();

    // 3. UI feedback
    osdMsg("TRANSMITTING...");
    setTimeout(() => {
        osdMsg("SIGNAL SENT");
        document.getElementById('s_link').value = '';
        document.getElementById('s_name').value = '';
        showTV();
    }, 1500);
}

document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnSend').onclick = submitNostalgia;
document.getElementById('btnInfo').onclick = () => { sfx(); document.getElementById('info').classList.add('active'); };
document.getElementById('btnShowName').onclick = () => { sfx(); showName=!showName; meta.style.opacity = showName?"1":"0"; };

loadVideos();
