// === CONFIGURATION ===
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYVsilo654qcbY8lRVyYDjIDyHHYFluy_2sVZmQWEBHbGfF6t3cpN9sC0kroL9izednFK0IwmJFbyg/pub?gid=314817228&single=true&output=csv';
const FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSebUTZIz5BC-l3I_iX9zguGN6XcoZ12ocZh6MvbWulyNCQ7ww/formResponse';
const ENTRY_LINK = 'entry.873128711';
const ENTRY_NAME = 'entry.3875702';
const ENTRY_VIDEO_NAME = 'entry.123456789'; // You'll need to update this with your actual form entry ID

// === GLOBALS ===
let videos = [];
let showInfo = false;
let audioContext;
let humSource;
let reverbNode;
let filterNode;

// Elements
const player = document.getElementById('player');
const meta = document.getElementById('meta');
const clickSfx = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');
const humSfx = document.getElementById('sfxHum');
const videoInfoDisplay = document.getElementById('videoInfoDisplay');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');

// === AUDIO EFFECTS ===
async function initAudioEffects() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 8D effect - auto panner
        const panner = audioContext.createStereoPanner();
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.value = 0.15; // Slow pan
        
        // Reverb effect
        reverbNode = audioContext.createConvolver();
        const reverbTime = 2.5;
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * reverbTime;
        const impulse = audioContext.createBuffer(2, length, sampleRate);
        const leftChannel = impulse.getChannelData(0);
        const rightChannel = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            const decay = Math.exp(-i / (sampleRate * 0.5));
            leftChannel[i] = (Math.random() * 2 - 1) * decay;
            rightChannel[i] = (Math.random() * 2 - 1) * decay;
        }
        
        reverbNode.buffer = impulse;
        
        // Low pass filter for hum
        filterNode = audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 120;
        
        // Connect hum with effects
        if (humSfx) {
            humSfx.loop = true;
            humSfx.volume = 0.15;
            
            const track = audioContext.createMediaElementSource(humSfx);
            track.connect(filterNode);
            filterNode.connect(reverbNode);
            reverbNode.connect(panner);
            panner.connect(audioContext.destination);
            
            // Auto pan for 8D effect
            function pan8D() {
                if (!panner.pan) return;
                const time = audioContext.currentTime;
                panner.pan.setValueAtTime(Math.sin(time * 0.5), time);
                requestAnimationFrame(pan8D);
            }
            
            humSfx.play();
            pan8D();
        }
    } catch (e) {
        console.log('Audio effects not supported:', e);
        if (humSfx) {
            humSfx.volume = 0.15;
            humSfx.loop = true;
            humSfx.play();
        }
    }
}

// === CORE FUNCTIONS ===
function sfx() { 
    if(clickSfx) { clickSfx.currentTime = 0; clickSfx.play(); } 
}

function osdMsg(text, duration = 3000) {
    const originalText = meta.innerText;
    meta.innerText = `>> ${text.toUpperCase()}`;
    setTimeout(() => { meta.innerText = originalText; }, duration);
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
}

function toggleVideoInfo() {
    sfx();
    showInfo = !showInfo;
    if (showInfo) {
        videoInfoDisplay.style.display = 'block';
    } else {
        videoInfoDisplay.style.display = 'none';
    }
}

function openInfo() { 
    sfx(); 
    document.getElementById('info').classList.add('active'); 
}

function closeInfo() { 
    sfx(); 
    document.getElementById('info').classList.remove('active'); 
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
                by: cols[2] ? cols[2].replace(/"/g, '').trim() : 'ANON',
                title: cols[3] ? cols[3].replace(/"/g, '').trim() : 'UNTITLED'
            };
        }).filter(v => v.url && v.url.includes('http'));

        if (videos.length > 0) {
            playRandom();
        } else {
            meta.innerText = "OSD: NO SIGNAL";
        }
    } catch (e) {
        console.error("Signal fetch failed:", e);
        osdMsg("TUNER ERROR");
    }
}

function playRandom() {
    if (videos.length === 0) return;

    const selected = videos[Math.floor(Math.random() * videos.length)];

    if (staticSfx) {
        staticSfx.currentTime = 0;
        staticSfx.play();
    }
    
    // Update displays
    meta.innerText = `OSD: SOURCE [${selected.by.toUpperCase()}]`;
    
    // Update video info
    const videoTitle = selected.title !== 'UNTITLED' ? selected.title : 'UNKNOWN TITLE';
    const uploader = selected.by !== 'ANON' ? selected.by : 'ANONYMOUS';
    videoInfoDisplay.innerHTML = `📼 ${videoTitle} — UPLOADED BY: ${uploader}`;
    nowPlayingTitle.innerHTML = `🎬 ${videoTitle.substring(0, 30)}${videoTitle.length > 30 ? '...' : ''}`;
    
    let videoId = extractID(selected.url);
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0`;
    player.style.opacity = 1;
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
    const videoNameVal = document.getElementById('s_video_name').value || 'Untitled';

    if(!linkVal.includes('http')) {
        osdMsg("INVALID URL");
        return;
    }

    document.getElementById('f_link').value = linkVal;
    document.getElementById('f_name').value = nameVal;
    document.getElementById('f_video_name').value = videoNameVal;

    document.getElementById('submissionForm').submit();

    osdMsg("📡 SIGNAL TRANSMITTED");
    
    document.getElementById('s_link').value = '';
    document.getElementById('s_name').value = '';
    document.getElementById('s_video_name').value = '';
    
    setTimeout(() => {
        loadVideos();
        showTV();
    }, 2000);
}

// === EVENT BINDING ===
document.getElementById('btnSwitch').onclick = () => { sfx(); playRandom(); };
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnSend').onclick = submitNostalgia;

document.getElementById('btnShowName').onclick = toggleVideoInfo;

// Initialize
window.onload = () => {
    loadVideos();
    initAudioEffects();
};