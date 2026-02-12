// === CONFIG ===
const SHEET_ID = '1mVgVFSpT4fb6HTf4-8fi_fxDXReZ69LUOI5vGdo0DPU';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const DEFAULT_VIDEO = 'https://youtube.com/shorts/b9LB6XlmqsM';

// IDs from your pre-filled link
const ENTRY_LINK = 'entry.873128711';
const ENTRY_NAME = 'entry.3875702';

// STATE
let videos = [];
let showName = true;
const player = document.getElementById('player');
const meta = document.getElementById('meta');
const click = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');

function sfx() { click.currentTime = 0; click.play(); }

// CUSTOM OSD MESSAGE SYSTEM
function osdMsg(text, duration = 3000) {
    const originalText = meta.innerText;
    meta.innerText = `>> ${text.toUpperCase()}`;
    setTimeout(() => { meta.innerText = originalText; }, duration);
}

function showTV() { sfx(); document.getElementById('tv').classList.add('active'); document.getElementById('submit').classList.remove('active'); }
function showSubmit() { sfx(); document.getElementById('submit').classList.add('active'); document.getElementById('tv').classList.remove('active'); }
function openInfo() { sfx(); document.getElementById('info').classList.add('active'); }
function closeInfo() { sfx(); document.getElementById('info').classList.remove('active'); }

// LOAD DATA
async function loadVideos() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        
        // Split by lines, then parse columns
        const rows = data.split('\n').slice(1); // Skip header row
        videos = rows.map(row => {
            // This regex handles commas within quotes if users use names like "Smith, John"
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                url: cols[1] ? cols[1].replace(/"/g, '').trim() : null, // Column B: Video Link
                by: cols[2] ? cols[2].replace(/"/g, '').trim() : 'Anonymous' // Column C: Your Name
            };
        }).filter(v => v.url && v.url.includes('http'));

    } catch (e) {
        console.error("Sheet load failed.");
        osdMsg("SIGNAL ERROR");
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
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3`;
    
    setTimeout(() => player.style.opacity = 1, 1000);
}

function extractID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// FORM SUBMISSION (No alerts, use OSD)
function submitNostalgia() {
    sfx();
    const linkVal = document.getElementById('s_link').value;
    const nameVal = document.getElementById('s_name').value || 'Anonymous';

    if(!linkVal.includes('http')) {
        osdMsg("INVALID URL");
        return;
    }

    // 1. Fill the hidden form
    document.getElementById('f_link').value = linkVal;
    document.getElementById('f_name').value = nameVal;

    // 2. Submit via the hidden iframe
    document.getElementById('submissionForm').submit();

    // 3. Feedback
    osdMsg("SIGNAL TRANSMITTED");
    
    // 4. Clear and Return
    document.getElementById('s_link').value = '';
    document.getElementById('s_name').value = '';
    setTimeout(showTV, 2000);
}

// BINDING
document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnShowName').onclick = () => { 
    sfx(); 
    showName = !showName;
    meta.style.opacity = showName ? "1" : "0"; 
};
document.getElementById('btnSend').onclick = submitNostalgia;

// Auto-run
loadVideos();
