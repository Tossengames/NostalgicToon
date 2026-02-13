// === CONFIGURATION ===
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYVsilo654qcbY8lRVyYDjIDyHHYFluy_2sVZmQWEBHbGfF6t3cpN9sC0kroL9izednFK0IwmJFbyg/pub?gid=314817228&single=true&output=csv';

// Google Form Action URL for background submission
const FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSebUTZIz5BC-l3I_iX9zguGN6XcoZ12ocZh6MvbWulyNCQ7ww/formResponse';

// Entry IDs from your pre-filled link
const ENTRY_LINK = 'entry.873128711';
const ENTRY_NAME = 'entry.3875702';

// === GLOBALS ===
let videos = [];
let showInfo = false;
let audioInitialized = false;

// Elements
const player = document.getElementById('player');
const meta = document.getElementById('meta');
const clickSfx = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');
const humSfx = document.getElementById('sfxHum');
const successSfx = document.getElementById('sfxSuccess');
const videoInfoDisplay = document.getElementById('videoInfoDisplay');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const submitBtn = document.getElementById('btnSend');
const linkInput = document.getElementById('s_link');
const nameInput = document.getElementById('s_name');
const submitMessage = document.getElementById('submitMessage');

// === AUDIO INIT (FIXED FOR MOBILE) ===
function initAudio() {
    if (audioInitialized) return;
    
    const enableAudio = () => {
        if (humSfx) {
            humSfx.volume = 0.1;
            humSfx.loop = true;
            humSfx.play().catch(e => console.log('Hum play failed:', e));
        }
        
        if (clickSfx) clickSfx.load();
        if (staticSfx) staticSfx.load();
        if (successSfx) successSfx.load();
        
        audioInitialized = true;
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    enableAudio();
}

// === CORE FUNCTIONS ===
function sfx() { 
    if (clickSfx && audioInitialized) { 
        clickSfx.currentTime = 0; 
        clickSfx.play().catch(e => console.log('Click play failed:', e));
    } 
}

function osdMsg(text, duration = 3000) {
    meta.innerText = `📺 ${text}`;
    setTimeout(() => { meta.innerText = '📼 READY'; }, duration);
}

// Navigation
function showTV() { 
    sfx(); 
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('tv').classList.add('active'); 
}

function showSubmit() { 
    sfx(); 
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('submit').classList.add('active');
    checkSubmitButton();
}

function toggleVideoInfo() {
    sfx();
    showInfo = !showInfo;
    videoInfoDisplay.style.display = showInfo ? 'block' : 'none';
    osdMsg(showInfo ? "INFO ON" : "INFO OFF", 1500);
}

function openInfo() { 
    sfx(); 
    document.getElementById('info').classList.add('active'); 
}

function closeInfo() { 
    sfx(); 
    document.getElementById('info').classList.remove('active'); 
}

// === VIDEO URL VALIDATION ===
function isValidVideoUrl(url) {
    if (!url || !url.includes('http')) return false;
    
    // Supported platforms
    const patterns = [
        'youtube.com',
        'youtu.be',
        'instagram.com',
        'fb.watch',
        'facebook.com',
        'tiktok.com',
        'vm.tiktok.com',
        'dailymotion.com',
        'vimeo.com'
    ];
    
    return patterns.some(pattern => url.includes(pattern));
}

// === DATA HANDLING ===
async function loadVideos() {
    try {
        const response = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`);
        const data = await response.text();
        
        const rows = data.split('\n').slice(1); 
        
        videos = rows.map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                url: cols[1] ? cols[1].replace(/"/g, '').trim() : null,
                by: cols[2] ? cols[2].replace(/"/g, '').trim() : 'ANON'
            };
        }).filter(v => v.url && v.url.includes('http'));

        if (videos.length > 0) {
            playRandom();
        } else {
            meta.innerText = "📺 NO VIDEOS YET";
        }
    } catch (e) {
        console.error("Signal fetch failed:", e);
        osdMsg("LOAD ERROR");
    }
}

// Generate random start time (between 10 seconds and 5 minutes)
function getRandomStartTime() {
    const minStart = 10;
    const maxStart = 300;
    return Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart;
}

function playRandom() {
    if (videos.length === 0) return;

    const selected = videos[Math.floor(Math.random() * videos.length)];

    if (staticSfx && audioInitialized) {
        staticSfx.currentTime = 0;
        staticSfx.play().catch(e => console.log('Static play failed:', e));
    }
    
    // Update video info
    videoInfoDisplay.innerHTML = `📼 UPLOADED BY: ${selected.by.toUpperCase()}`;
    nowPlayingTitle.innerHTML = `📡 ${selected.by.toUpperCase()}`;
    
    let videoId = extractID(selected.url);
    const startTime = getRandomStartTime();
    
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&enablejsapi=1&start=${startTime}`;
    player.style.opacity = 1;
    
    osdMsg(`PLAYING: ${selected.by}`, 2000);
}

function extractID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// === SUBMIT FORM HANDLING ===
function checkSubmitButton() {
    const linkVal = linkInput.value;
    const isValid = isValidVideoUrl(linkVal);
    
    if (isValid) {
        submitBtn.classList.add('active');
        submitBtn.disabled = false;
    } else {
        submitBtn.classList.remove('active');
        submitBtn.disabled = true;
    }
}

function showThanksMessage() {
    submitMessage.innerHTML = '✨ THANKS! VIDEO SENT ✨';
    submitMessage.style.color = '#99ff99';
    
    setTimeout(() => {
        submitMessage.innerHTML = '';
    }, 3000);
}

function submitNostalgia() {
    sfx();
    
    const linkVal = linkInput.value;
    const nameVal = nameInput.value.trim() || 'Nameless';
    
    if (!isValidVideoUrl(linkVal)) {
        osdMsg("INVALID LINK");
        submitMessage.innerHTML = '❌ INVALID VIDEO LINK';
        submitMessage.style.color = '#ff6ec7';
        setTimeout(() => { submitMessage.innerHTML = ''; }, 2000);
        return;
    }

    // Fill hidden form fields
    document.getElementById('f_link').value = linkVal;
    document.getElementById('f_name').value = nameVal;

    // Submit to Google Form
    document.getElementById('submissionForm').submit();

    // Play success sound
    if (successSfx && audioInitialized) {
        successSfx.currentTime = 0;
        successSfx.play().catch(e => console.log('Success sound failed:', e));
    }

    // Show thanks message
    showThanksMessage();
    
    // Clear form
    linkInput.value = '';
    nameInput.value = '';
    checkSubmitButton();
    
    // Return to TV after delay
    setTimeout(() => {
        loadVideos(); // Refresh list
        showTV();
    }, 2000);
}

// === EVENT BINDING ===
document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnSend').onclick = submitNostalgia;
document.getElementById('btnShowName').onclick = toggleVideoInfo;

// Form input validation
linkInput.addEventListener('input', checkSubmitButton);
nameInput.addEventListener('input', checkSubmitButton);

// Initialize
window.onload = () => {
    loadVideos();
    initAudio();
    document.body.addEventListener('touchstart', initAudio, { once: true });
};