// === CONFIG ===
const SHEET_ID = '1mVgVFSpT4fb6HTf4-8fi_fxDXReZ69LUOI5vGdo0DPU';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSebUTZIz5BC-l3I_iX9zguGN6XcoZ12ocZh6MvbWulyNCQ7ww/formResponse';
const DEFAULT_VIDEO = 'https://youtube.com/shorts/b9LB6XlmqsM';

// IDs from your pre-filled link
const ENTRY_LINK = 'entry.873128711';
const ENTRY_NAME = 'entry.3875702';

// STATE
let videos = [];
const player = document.getElementById('player');
const meta = document.getElementById('meta');
const click = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');

// UI ACTIONS
function sfx() { click.currentTime = 0; click.play(); }
function showTV() { sfx(); document.getElementById('tv').classList.add('active'); document.getElementById('submit').classList.remove('active'); }
function showSubmit() { sfx(); document.getElementById('submit').classList.add('active'); document.getElementById('tv').classList.remove('active'); }
function openInfo() { sfx(); document.getElementById('info').classList.add('active'); }
function closeInfo() { sfx(); document.getElementById('info').classList.remove('active'); }

// LOAD DATA
async function loadVideos() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        
        // Parse CSV (Split by lines, then by comma)
        const rows = data.split('\n').slice(1); // Skip header row
        videos = rows.map(row => {
            const cols = row.split(',');
            return {
                url: cols[0] ? cols[0].replace(/"/g, '').trim() : null,
                by: cols[1] ? cols[1].replace(/"/g, '').trim() : 'Anonymous'
            };
        }).filter(v => v.url && v.url.includes('http'));

    } catch (e) {
        console.error("Sheet load failed.");
    }
    playRandom();
}

function playRandom() {
    let selected = (videos.length > 0) 
        ? videos[Math.floor(Math.random() * videos.length)] 
        : { url: DEFAULT_VIDEO, by: 'SYSTEM' };

    staticSfx.play();
    meta.innerText = `OSD: SOURCE [${selected.by.toUpperCase()}]`;
    
    player.style.opacity = 0;
    let videoId = extractID(selected.url);
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&rel=0&modestbranding=1`;
    
    setTimeout(() => player.style.opacity = 1, 1200);
}

function extractID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// FORM SUBMISSION
async function submitNostalgia() {
    sfx();
    const linkVal = document.getElementById('s_link').value;
    const nameVal = document.getElementById('s_name').value || 'Anonymous';

    if(!linkVal.includes('http')) {
        alert("Please enter a valid URL");
        return;
    }

    const formData = new FormData();
    formData.append(ENTRY_LINK, linkVal);
    formData.append(ENTRY_NAME, nameVal);

    // Send via no-cors (Standard for Google Forms background submission)
    fetch(FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    });

    alert("TRANSMISSION RECEIVED. Refresh later to see your clip!");
    document.getElementById('s_link').value = '';
    document.getElementById('s_name').value = '';
    showTV();
}

// BINDING
document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnShowName').onclick = () => { sfx(); meta.style.display = meta.style.display === 'none' ? 'block' : 'none'; };
document.getElementById('btnSend').onclick = submitNostalgia;

loadVideos();
