// === CONFIG ===
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYVsilo654qcbY8lRVyYDjIDyHHYFluy_2sVZmQWEBHbGfF6t3cpN9sC0kroL9izednFK0IwmJFbyg/pub?gid=314817228&single=true&output=csv';

const player = document.getElementById('player');
const meta = document.getElementById('meta');
const staticSfx = document.getElementById('sfxStatic');

let videos = [];

// 1. FETCH THE DATA
async function loadVideos() {
    try {
        // cachebust ensures it doesn't load an old version of your sheet
        const response = await fetch(`${SHEET_CSV_URL}&t=${Date.now()}`);
        const data = await response.text();
        
        // Split rows and remove the header (Row 1)
        const rows = data.split('\n').slice(1); 
        
        videos = rows.map(row => {
            // Regex to handle commas inside quotes
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            /* MAPPING CHECK:
               If your sheet is: Timestamp (A), Link (B), Name (C)
               Use: cols[1] and cols[2]
               
               If your sheet is JUST: Link (A), Name (B)
               Use: cols[0] and cols[1]
            */
            return {
                url: cols[1] ? cols[1].replace(/"/g, '').trim() : null, 
                by: cols[2] ? cols[2].replace(/"/g, '').trim() : 'ANONYMOUS'
            };
        }).filter(v => v.url && v.url.includes('http'));

        if (videos.length > 0) {
            playRandom();
        } else {
            meta.innerText = "OSD: NO SIGNAL DETECTED";
        }
    } catch (e) {
        console.error(e);
        meta.innerText = "OSD: TUNER ERROR";
    }
}

// 2. PLAY RANDOM VIDEO
function playRandom() {
    if (videos.length === 0) return;

    // Pick random entry
    const selected = videos[Math.floor(Math.random() * videos.length)];

    // Play static sound
    if (staticSfx) {
        staticSfx.currentTime = 0;
        staticSfx.play();
    }
    
    // Update OSD text
    meta.innerText = `OSD: SOURCE [${selected.by.toUpperCase()}]`;
    
    // Video transition
    player.style.opacity = 0;
    
    let videoId = extractID(selected.url);
    // Parameters: autoplay, no controls, hide related videos
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3`;
    
    setTimeout(() => {
        player.style.opacity = 1;
    }, 1200);
}

// 3. EXTRACT YOUTUBE ID (Works for Shorts and Regular links)
function extractID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// 4. BUTTON BINDING
document.getElementById('btnSwitch').onclick = () => {
    // Play the 'click' sound effect if it exists
    if(typeof sfx === "function") sfx(); 
    playRandom();
};

// INITIALIZE
loadVideos();
