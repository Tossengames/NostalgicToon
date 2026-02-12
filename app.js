const SHEET_ID = '1mVgVFSpT4fb6HTf4-8fi_fxDXReZ69LUOI5vGdo0DPU';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const DEFAULT_VIDEO = 'https://youtube.com/shorts/b9LB6XlmqsM';

let videos = [];
const player = document.getElementById('player');
const meta = document.getElementById('meta');
const click = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');

function sfx() { click.currentTime = 0; click.play(); }

// OSD Notification instead of Alerts
function osdMsg(text, duration = 3000) {
    const originalText = meta.innerText;
    meta.innerText = `>> ${text.toUpperCase()}`;
    setTimeout(() => { meta.innerText = originalText; }, duration);
}

function showTV() { sfx(); document.getElementById('tv').classList.add('active'); document.getElementById('submit').classList.remove('active'); }
function showSubmit() { sfx(); document.getElementById('submit').classList.add('active'); document.getElementById('tv').classList.remove('active'); }

async function loadVideos() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        const rows = data.split('\n').slice(1); 
        
        videos = rows.map(row => {
            // This regex handles commas inside quotes if necessary
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                url: cols[1] ? cols[1].replace(/"/g, '').trim() : null, // Column B: Link
                by: cols[2] ? cols[2].replace(/"/g, '').trim() : 'Anonymous' // Column C: Name
            };
        }).filter(v => v.url && v.url.includes('http'));
    } catch (e) {
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
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&rel=0&modestbranding=1`;
    
    setTimeout(() => player.style.opacity = 1, 1000);
}

function extractID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

function submitNostalgia() {
    sfx();
    const linkVal = document.getElementById('s_link').value;
    const nameVal = document.getElementById('s_name').value || 'Anonymous';

    if(!linkVal.includes('http')) {
        osdMsg("INVALID URL");
        return;
    }

    // Fill hidden form
    document.getElementById('f_link').value = linkVal;
    document.getElementById('f_name').value = nameVal;

    // Submit hidden form
    document.getElementById('submissionForm').submit();

    // Feedback
    osdMsg("SIGNAL TRANSMITTED");
    
    // Clear inputs and return
    document.getElementById('s_link').value = '';
    document.getElementById('s_name').value = '';
    setTimeout(showTV, 1500);
}

// Bindings
document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnSend').onclick = submitNostalgia;
document.getElementById('btnShowName').onclick = () => { sfx(); meta.style.opacity = meta.style.opacity === '0' ? '1' : '0'; };

loadVideos();
