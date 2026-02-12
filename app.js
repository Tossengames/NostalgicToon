// === CONFIG ===
// 1. PASTE YOUR PUBLISHED CSV LINK HERE:
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1mVgVFSpT4fb6HTf4-8fi_fxDXReZ69LUOI5vGdo0DPU/pub?output=csv';

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

function sfx() { click.currentTime = 0; click.play(); }

function osdMsg(text) {
    const originalText = meta.innerText;
    meta.innerText = `>> ${text.toUpperCase()}`;
    setTimeout(() => { meta.innerText = originalText; }, 3000);
}

// NAVIGATION
function showTV() { sfx(); document.getElementById('tv').classList.add('active'); document.getElementById('submit').classList.remove('active'); }
function showSubmit() { sfx(); document.getElementById('submit').classList.add('active'); document.getElementById('tv').classList.remove('active'); }

// LOAD DATA FROM YOUR SHEET
async function loadVideos() {
    try {
        // We add a timestamp to the URL to prevent the browser from caching old data
        const response = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`);
        const data = await response.text();
        
        // CSV Parsing
        const rows = data.split('\n').slice(1); // Skip Header
        videos = rows.map(row => {
            // Handles potential commas in names
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                url: cols[1] ? cols[1].replace(/"/g, '').trim() : null, // Column B (Link)
                by: cols[2] ? cols[2].replace(/"/g, '').trim() : 'ANON'   // Column C (Name)
            };
        }).filter(v => v.url && v.url.includes('http'));

        console.log("Loaded videos:", videos.length);
        playRandom(); // Start the first video
    } catch (e) {
        console.error("Load failed:", e);
        osdMsg("SIGNAL ERROR");
        playRandom(); // Fallback to default
    }
}

function playRandom() {
    // Pick from your sheet, or use default if sheet is empty/failed
    let selected = (videos.length > 0) 
        ? videos[Math.floor(Math.random() * videos.length)] 
        : { url: DEFAULT_VIDEO, by: 'SYSTEM' };

    staticSfx.play();
    meta.innerText = `OSD: SOURCE [${selected.by.toUpperCase()}]`;
    
    player.style.opacity = 0;
    let videoId = extractID(selected.url);
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&rel=0&modestbranding=1`;
    
    // Fade in after "static" transition
    setTimeout(() => player.style.opacity = 1, 1200);
}

function extractID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// FORM SUBMISSION
function submitNostalgia() {
    sfx();
    const linkVal = document.getElementById('s_link').value;
    const nameVal = document.getElementById('s_name').value || 'Anonymous';

    if(!linkVal.includes('http')) {
        osdMsg("INVALID URL");
        return;
    }

    document.getElementById('f_link').value = linkVal;
    document.getElementById('f_name').value = nameVal;
    document.getElementById('submissionForm').submit();

    osdMsg("SIGNAL TRANSMITTED");
    
    document.getElementById('s_link').value = '';
    document.getElementById('s_name').value = '';
    
    // Refresh the video list after submission (slight delay for Google to process)
    setTimeout(() => {
        loadVideos(); 
        showTV();
    }, 2000);
}

// BINDINGS
document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnSend').onclick = submitNostalgia;
document.getElementById('btnShowName').onclick = () => { sfx(); meta.style.display = meta.style.display === 'none' ? 'block' : 'none'; };

// BOOT UP
loadVideos();
