// === CONFIGURATION ===
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYVsilo654qcbY8lRVyYDjIDyHHYFluy_2sVZmQWEBHbGfF6t3cpN9sC0kroL9izednFK0IwmJFbyg/pub?gid=314817228&single=true&output=csv';

// === GLOBALS ===
let videos = [];
let showInfo = false;
let audioInitialized = false;
let playCooldown = false;
let stopTimeout = null;
let audioContext = null;
let humSource = null;
let reverbNode = null;
let pannerNode = null;
let humGainNode = null;
let settings = {
    enable8D: true,
    enableReverb: true,
    humVolume: 15
};

// Elements
const player = document.getElementById('player');
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
const settings8D = document.getElementById('setting8D');
const settingsReverb = document.getElementById('settingReverb');
const humVolumeSlider = document.getElementById('humVolume');
const humVolumeValue = document.getElementById('humVolumeValue');
const testSoundBtn = document.getElementById('testSoundBtn');

// === AUDIO INIT WITH EFFECTS ===
async function initAudio() {
    if (audioInitialized && audioContext && audioContext.state === 'running') return;
    
    // Resume context if it exists but is suspended
    if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
        audioInitialized = true;
        return;
    }

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        pannerNode = audioContext.createStereoPanner();
        reverbNode = audioContext.createConvolver();
        humGainNode = audioContext.createGain();
        
        // Create reverb impulse
        const reverbTime = 1.5;
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * reverbTime;
        const impulse = audioContext.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.exp(-i / (sampleRate * 0.3));
                channelData[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        reverbNode.buffer = impulse;
        
        if (humSfx) {
            const track = audioContext.createMediaElementSource(humSfx);
            track.connect(humGainNode);
            humGainNode.gain.value = settings.humVolume / 100;
            
            if (settings.enableReverb) {
                humGainNode.connect(reverbNode);
                reverbNode.connect(pannerNode);
            } else {
                humGainNode.connect(pannerNode);
            }
            
            pannerNode.connect(audioContext.destination);
            humSfx.play().catch(e => console.log("Hum autoplay blocked"));
        }
        
        audioInitialized = true;
        if (settings.enable8D) start8DEffect();
        
    } catch (e) {
        console.log('Audio Context Error:', e);
        audioInitialized = true; // Set to true to stop repeated attempts
    }
}

function start8DEffect() {
    if (!pannerNode || !settings.enable8D) return;
    let time = 0;
    function pan() {
        if (!settings.enable8D || !audioContext) return;
        time += 0.01;
        const panValue = Math.sin(time * 0.8);
        pannerNode.pan.setValueAtTime(panValue, audioContext.currentTime);
        requestAnimationFrame(pan);
    }
    pan();
}

function updateAudioSettings() {
    settings.enable8D = settings8D.checked;
    settings.enableReverb = settingsReverb.checked;
    settings.humVolume = parseInt(humVolumeSlider.value);
    humVolumeValue.textContent = settings.humVolume + '%';
    if (humGainNode) humGainNode.gain.value = settings.humVolume / 100;
}

function playTestSound() {
    sfx();
}

function sfx() { 
    if (clickSfx) { 
        clickSfx.currentTime = 0; 
        clickSfx.play().catch(() => {});
    } 
}

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
    videoInfoDisplay.style.display = showInfo ? 'block' : 'none';
}

function openInfo() { sfx(); document.getElementById('info').classList.add('active'); }
function closeInfo() { sfx(); document.getElementById('info').classList.remove('active'); }
function openSettings() { sfx(); document.getElementById('settings').classList.add('active'); }
function closeSettings() { sfx(); document.getElementById('settings').classList.remove('active'); }

function getPlatformFromUrl(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('dailymotion.com') || url.includes('dai.ly')) return 'dailymotion';
    return 'unknown';
}

function extractVideoId(url, platform) {
    if (platform === 'youtube') {
        const match = url.match(/^.*(youtu.be\/|v\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*)/);
        return (match && match[2].length === 11) ? match[2] : url;
    }
    return url;
}

function getEmbedUrl(videoUrl, startTime = 0) {
    const platform = getPlatformFromUrl(videoUrl);
    const videoId = extractVideoId(videoUrl, platform);
    
    switch(platform) {
        case 'youtube':
            // Added enablejsapi=1 and autoplay=1
            return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=0&start=${startTime}&enablejsapi=1&rel=0`;
        case 'vimeo':
            return `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`;
        default:
            return videoUrl;
    }
}

function playRandom() {
    if (playCooldown || videos.length === 0) return;
    playCooldown = true;
    playBtn.classList.add('disabled');
    setTimeout(() => { playCooldown = false; playBtn.classList.remove('disabled'); }, 1000);
    
    sfx();
    if (staticSfx) { staticSfx.currentTime = 0; staticSfx.play().catch(() => {}); }
    
    const selected = videos[Math.floor(Math.random() * videos.length)];
    videoInfoDisplay.innerHTML = `📼 ${selected.by.toUpperCase()}`;
    nowPlayingTitle.innerHTML = `📡 ${selected.by.toUpperCase()}`;
    
    const embedUrl = getEmbedUrl(selected.url, Math.floor(Math.random() * 20));
    player.src = embedUrl;
}

async function loadVideos() {
    try {
        const response = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`);
        const data = await response.text();
        videos = data.split('\n').slice(1).map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                url: cols[1] ? cols[1].replace(/"/g, '').trim() : null,
                by: cols[2] ? cols[2].replace(/"/g, '').trim() : 'ANON'
            };
        }).filter(v => v.url && v.url.includes('http'));
        if (videos.length > 0) playRandom();
    } catch (e) { console.log('Load error'); }
}

function submitNostalgia() {
    sfx();
    const linkVal = linkInput.value;
    const nameVal = nameInput.value.trim() || 'Nameless';
    
    document.getElementById('f_link').value = linkVal;
    document.getElementById('f_name').value = nameVal;
    document.getElementById('submissionForm').submit();

    if (successSfx) { successSfx.currentTime = 0; successSfx.play().catch(() => {}); }
    submitMessage.innerHTML = '✨ THANKS! ✨';
    setTimeout(() => { loadVideos(); showTV(); submitMessage.innerHTML = ''; }, 2000);
}

// Bindings
playBtn.onclick = playRandom;
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnSend').onclick = submitNostalgia;
document.getElementById('btnShowName').onclick = toggleVideoInfo;
document.getElementById('btnSettings').onclick = openSettings;
settings8D.onchange = updateAudioSettings;
settingsReverb.onchange = updateAudioSettings;
humVolumeSlider.oninput = updateAudioSettings;
testSoundBtn.onclick = playTestSound;

// The "Magic" Unlocker
const unlocker = () => {
    initAudio();
    // Remove listeners once unlocked
    document.body.removeEventListener('click', unlocker);
    document.body.removeEventListener('touchstart', unlocker);
};
document.body.addEventListener('click', unlocker);
document.body.addEventListener('touchstart', unlocker);

window.onload = loadVideos;
