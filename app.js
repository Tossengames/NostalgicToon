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
let playCooldown = false;
let currentVideoDuration = 180;
let stopTimeout = null;

// Elements
const player = document.getElementById('player');
const metaDisplay = document.querySelector('.meta-display');
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
const playBtn = document.getElementById('btnSwitch');

// === AUDIO INIT ===
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
}

function openInfo() { 
    sfx(); 
    document.getElementById('info').classList.add('active'); 
}

function closeInfo() { 
    sfx(); 
    document.getElementById('info').classList.remove('active'); 
}

// === VIDEO DURATION DETECTION ===
function estimateVideoDuration(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 180;
    } else if (url.includes('instagram.com')) {
        return 60;
    } else if (url.includes('tiktok.com')) {
        return 30;
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
        return 120;
    }
    return 120;
}

function getRandomStartTime(duration) {
    const maxStart = Math.max(0, duration - 35);
    const minStart = 5;
    
    if (maxStart <= minStart) return minStart;
    return Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart;
}

function stopVideoAfterDelay() {
    if (stopTimeout) clearTimeout(stopTimeout);
    
    stopTimeout = setTimeout(() => {
        player.src = '';
        
        if (staticSfx && audioInitialized) {
            staticSfx.currentTime = 0;
            staticSfx.play().catch(e => console.log('Static play failed:', e));
        }
    }, 30000);
}

// === VIDEO PLAYBACK ===
function playVideo(videoId, startTime) {
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&enablejsapi=1&start=${startTime}`;
    player.style.opacity = 1;
    stopVideoAfterDelay();
}

function playRandom() {
    if (playCooldown) return;
    if (videos.length === 0) return;

    // Quick cooldown - just 500ms to prevent double clicks
    playCooldown = true;
    playBtn.classList.add('disabled');
    
    setTimeout(() => {
        playCooldown = false;
        playBtn.classList.remove('disabled');
    }, 500);
    
    sfx();
    
    const selected = videos[Math.floor(Math.random() * videos.length)];

    if (staticSfx && audioInitialized) {
        staticSfx.currentTime = 0;
        staticSfx.play().catch(e => console.log('Static play failed:', e));
    }
    
    // Update video info
    videoInfoDisplay.innerHTML = `📼 UPLOADED BY: ${selected.by.toUpperCase()}`;
    nowPlayingTitle.innerHTML = `📡 ${selected.by.toUpperCase()}`;
    
    let videoId = extractID(selected.url);
    const duration = estimateVideoDuration(selected.url);
    const startTime = getRandomStartTime(duration);
    
    playVideo(videoId, startTime);
}

function extractID(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('/shorts/')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : url;
    }
    return url;
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
        }).filter(v => v.url && isValidVideoUrl(v.url));

        if (videos.length > 0) {
            playRandom();
        }
    } catch (e) {
        console.error("Signal fetch failed:", e);
    }
}

// === VIDEO URL VALIDATION ===
function isValidVideoUrl(url) {
    if (!url || !url.includes('http')) return false;
    
    const patterns = [
        'youtube.com', 'youtu.be', 'instagram.com', 'fb.watch',
        'facebook.com', 'tiktok.com', 'vm.tiktok.com', 'dailymotion.com',
        'vimeo.com', '.mp4', '.webm', '.mov'
    ];
    
    return patterns.some(pattern => url.includes(pattern));
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
        submitMessage.innerHTML = '❌ INVALID VIDEO LINK';
        submitMessage.style.color = '#ff6ec7';
        setTimeout(() => { submitMessage.innerHTML = ''; }, 2000);
        return;
    }

    document.getElementById('f_link').value = linkVal;
    document.getElementById('f_name').value = nameVal;
    document.getElementById('submissionForm').submit();

    if (successSfx && audioInitialized) {
        successSfx.currentTime = 0;
        successSfx.play().catch(e => console.log('Success sound failed:', e));
    }

    showThanksMessage();
    
    linkInput.value = '';
    nameInput.value = '';
    checkSubmitButton();
    
    setTimeout(() => {
        loadVideos();
        showTV();
    }, 2000);
}

// === EVENT BINDING ===
playBtn.onclick = () => { playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnSend').onclick = submitNostalgia;
document.getElementById('btnShowName').onclick = toggleVideoInfo;

// Form input validation
if (linkInput) linkInput.addEventListener('input', checkSubmitButton);
if (nameInput) nameInput.addEventListener('input', checkSubmitButton);

// Initialize
window.onload = () => {
    // Hide info display initially
    showInfo = false;
    videoInfoDisplay.style.display = 'none';
    
    loadVideos();
    initAudio();
    document.body.addEventListener('touchstart', initAudio, { once: true });
};