// === CONFIGURATION ===
// Your specific published CSV link (Form Responses 1 tab)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYVsilo654qcbY8lRVyYDjIDyHHYFluy_2sVZmQWEBHbGfF6t3cpN9sC0kroL9izednFK0IwmJFbyg/pub?gid=314817228&single=true&output=csv';

// Google Form Action URL for background submission
const FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSebUTZIz5BC-l3I_iX9zguGN6XcoZ12ocZh6MvbWulyNCQ7ww/formResponse';

// Entry IDs from your pre-filled link
const ENTRY_LINK = 'entry.873128711';
const ENTRY_NAME = 'entry.3875702';

// === GLOBALS ===
let videos = [];
let showName = true;

// Elements
const player = document.getElementById('player');
const meta = document.getElementById('meta');
const clickSfx = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');

// === CORE FUNCTIONS ===

// Play UI Click Sound
function sfx() { 
    if(clickSfx) { clickSfx.currentTime = 0; clickSfx.play(); } 
}

// OSD System Messaging
function osdMsg(text, duration = 3000) {
    const originalText = meta.innerText;
    meta.innerText = `>> ${text.toUpperCase()}`;
    setTimeout(() => { meta.innerText = originalText; }, duration);
}

// Navigation Logic
function showTV() { 
    sfx(); 
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('tv').classList.add('active'); 
}

function showSubmit() { 
    sfx(); 
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('submit').classList.add('active'); 
}

function openInfo() { sfx(); document.getElementById('info').classList.add('active'); }
function closeInfo() { sfx(); document.getElementById('info').classList.remove('active'); }

// === DATA HANDLING ===

// Fetch and Parse CSV
async function loadVideos() {
    try {
        // cachebust=Date.now() prevents the browser from showing old sheet data
        const response = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`);
        const data = await response.text();
        
        // Split rows and skip the header (Row 1)
        const rows = data.split('\n').slice(1); 
        
        videos = rows.map(row => {
            // Regex to handle commas inside quotes (e.g., if a name is "Doe, John")
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                // Column B (Index 1) is the Link, Column C (Index 2) is the Name
                url: cols[1] ? cols[1].replace(/"/g, '').trim() : null, 
                by: cols[2] ? cols[2].replace(/"/g, '').trim() : 'ANON'
            };
        }).filter(v => v.url && v.url.includes('http'));

        if (videos.length > 0) {
            playRandom();
        } else {
            meta.innerText = "OSD: NO SIGNAL FOUND";
        }
    } catch (e) {
        console.error("Signal fetch failed:", e);
        osdMsg("TUNER ERROR");
    }
}

// Pick a random video and update the player
function playRandom() {
    if (videos.length === 0) return;

    const selected = videos[Math.floor(Math.random() * videos.length)];

    // Play static sound effect
    if (staticSfx) {
        staticSfx.currentTime = 0;
        staticSfx.play();
    }
    
    // Update OSD text with the submitter's name
    meta.innerText = `OSD: SOURCE [${selected.by.toUpperCase()}]`;
    
    // Smooth transition
    player.style.opacity = 0;
    
    let videoId = extractID(selected.url);
    // YouTube Parameters: Autoplay, Mute off, Hide controls, Hide related, Hide info
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0`;
    
    setTimeout(() => {
        player.style.opacity = 1;
    }, 1200);
}

// Extract ID from regular links or Shorts
function extractID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// Handle Custom Submission
function submitNostalgia() {
    sfx();
    const linkVal = document.getElementById('s_link').value;
    const nameVal = document.getElementById('s_name').value || 'Anonymous';

    if(!linkVal.includes('http')) {
        osdMsg("INVALID URL");
        return;
    }

    // 1. Fill the hidden form (from index.html)
    document.getElementById('f_link').value = linkVal;
    document.getElementById('f_name').value = nameVal;

    // 2. Transmit via hidden iframe
    document.getElementById('submissionForm').submit();

    // 3. UI Feedback
    osdMsg("SIGNAL TRANSMITTED");
    
    // 4. Reset inputs and return to TV
    document.getElementById('s_link').value = '';
    document.getElementById('s_name').value = '';
    
    setTimeout(() => {
        loadVideos(); // Refresh list to include new submission
        showTV();
    }, 2000);
}

// === EVENT BINDING ===

document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnSend').onclick = submitNostalgia;

document.getElementById('btnShowName').onclick = () => { 
    sfx(); 
    showName = !showName;
    meta.style.opacity = showName ? "1" : "0"; 
};

// Start the TV
loadVideos();
