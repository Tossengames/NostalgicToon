// === CONFIGURATION ===
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYVsilo654qcbY8lRVyYDjIDyHHYFluy_2sVZmQWEBHbGfF6t3cpN9sC0kroL9izednFK0IwmJFbyg/pub?gid=314817228&single=true&output=csv';
const FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSebUTZIz5BC-l3I_iX9zguGN6XcoZ12ocZh6MvbWulyNCQ7ww/formResponse';
const ENTRY_LINK = 'entry.873128711';
const ENTRY_NAME = 'entry.3875702';

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

// === ELEMENTS ===
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

// Settings elements
const settings8D = document.getElementById('setting8D');
const settingsReverb = document.getElementById('settingReverb');
const humVolumeSlider = document.getElementById('humVolume');
const humVolumeValue = document.getElementById('humVolumeValue');
const testSoundBtn = document.getElementById('testSoundBtn');

// === AUDIO INIT WITH EFFECTS ===
async function initAudio() {
    if (audioInitialized) return;

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create nodes
        pannerNode = audioContext.createStereoPanner();
        reverbNode = audioContext.createConvolver();
        humGainNode = audioContext.createGain();

        // Reverb impulse
        const reverbTime = 1.5;
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * reverbTime;
        const impulse = audioContext.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.3));
            }
        }
        reverbNode.buffer = impulse;

        if (humSfx) {
            humSfx.loop = true;
            humSfx.volume = settings.humVolume / 100;

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

            // Start hum
            humSfx.play().catch(() => {});
        }

        audioInitialized = true;

        if (settings.enable8D) start8DEffect();

    } catch (e) {
        console.warn('Audio init failed, fallback to simple audio.');
        if (humSfx) {
            humSfx.loop = true;
            humSfx.volume = settings.humVolume / 100;
            humSfx.play().catch(() => {});
        }
        audioInitialized = true;
    }
}

// 8D PAN EFFECT
function start8DEffect() {
    if (!pannerNode || !settings.enable8D) return;
    let time = 0;
    function pan() {
        if (!settings.enable8D) return;
        time += 0.01;
        pannerNode.pan.setValueAtTime(Math.sin(time * 0.8), audioContext.currentTime);
        requestAnimationFrame(pan);
    }
    pan();
}

// UPDATE AUDIO SETTINGS
function updateAudioSettings() {
    settings.enable8D = settings8D.checked;
    settings.enableReverb = settingsReverb.checked;
    settings.humVolume = parseInt(humVolumeSlider.value);
    humVolumeValue.textContent = settings.humVolume + '%';
    if (humGainNode) humGainNode.gain.value = settings.humVolume / 100;
    if (settings.enable8D && audioContext) start8DEffect();
}

// PLAY TEST SOUND
function playTestSound() {
    initAudio().then(() => {
        if (clickSfx) {
            clickSfx.currentTime = 0;
            clickSfx.play().catch(() => {});
        }
    });
}

// SIMPLE BUTTON SFX
function sfx() {
    if (clickSfx && audioInitialized) {
        clickSfx.currentTime = 0;
        clickSfx.play().catch(() => {});
    }
}

// === VIEW SWITCHING ===
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

function openInfo() { sfx(); document.getElementById('info').classList.add('active'); }
function closeInfo() { sfx(); document.getElementById('info').classList.remove('active'); }
function openSettings() { sfx(); document.getElementById('settings').classList.add('active'); }
function closeSettings() { sfx(); document.getElementById('settings').classList.remove('active'); }

// === VIDEO EMBEDDING ===
function getPlatformFromUrl(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('dailymotion.com') || url.includes('dai.ly')) return 'dailymotion';
    if (url.match(/\.(mp4|webm|mov)$/)) return 'direct';
    return 'unknown';
}

function extractVideoId(url, platform) {
    if (platform === 'youtube') {
        const match = url.match(/^.*(youtu.be\/|v\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*)/);
        return (match && match[2].length === 11) ? match[2] : url;
    }
    if (platform === 'vimeo') {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : url;
    }
    if (platform === 'tiktok') {
        const match = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
        return match ? match[1] : url;
    }
    if (platform === 'dailymotion') {
        const match = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
        return match ? match[1] : url;
    }
    return url;
}

function getEmbedUrl(videoUrl, startTime = 0) {
    const platform = getPlatformFromUrl(videoUrl);
    const videoId = extractVideoId(videoUrl, platform);
    switch(platform) {
        case 'youtube': return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=0&start=${startTime}`;
        case 'vimeo': return `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`;
        case 'tiktok': return `https://www.tiktok.com/embed/v2/${videoId}`;
        case 'dailymotion': return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
        case 'direct': return videoUrl;
        default: return null;
    }
}

// === VIDEO PLAYBACK ===
function estimateVideoDuration(url) {
    const platform = getPlatformFromUrl(url);
    if (platform === 'tiktok') return 30;
    if (platform === 'direct') return 60;
    return 120;
}

function getPlaybackStrategy(duration) {
    if (duration <= 45) return { startTime: 0, playDuration: duration };
    const skipStart = 5;
    const skipEnd = 10;
    const maxStart = duration - skipEnd - 30;
    const startTime = Math.floor(Math.random() * (maxStart - skipStart + 1)) + skipStart;
    return { startTime, playDuration: 30 };
}

function stopVideoAfterDelay(duration) {
    if (stopTimeout) clearTimeout(stopTimeout);
    stopTimeout = setTimeout(() => {
        player.src = '';
        if (staticSfx && audioInitialized) {
            staticSfx.currentTime = 0;
            staticSfx.play().catch(() => {});
        }
    }, duration * 1000);
}

function playRandom() {
    if (playCooldown || videos.length === 0) return;

    playCooldown = true;
    playBtn.classList.add('disabled');
    setTimeout(() => { playCooldown = false; playBtn.classList.remove('disabled'); }, 500);

    sfx();

    const selected = videos[Math.floor(Math.random() * videos.length)];

    if (staticSfx && audioInitialized) {
        staticSfx.currentTime = 0;
        staticSfx.play().catch(() => {});
    }

    videoInfoDisplay.innerHTML = `📼 ${selected.by.toUpperCase()}`;
    nowPlayingTitle.innerHTML = `📡 ${selected.by.toUpperCase()}`;

    const duration = estimateVideoDuration(selected.url);
    const strategy = getPlaybackStrategy(duration);
    const embedUrl = getEmbedUrl(selected.url, strategy.startTime);

    if (embedUrl) {
        player.src = embedUrl;
        stopVideoAfterDelay(strategy.playDuration);
    }
}

// === LOAD VIDEOS ===
async function loadVideos() {
    try {
        const response = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`);
        const data = await response.text();
        videos = data.split('\n').slice(1).map(line => {
            const [url, by] = line.split(',');
            return { url: url.trim(), by: (by || 'Unknown').trim() };
        }).filter(v => v.url);
    } catch(e) {
        console.error('Failed to load videos:', e);
    }
}

// === SUBMIT FORM ===
function checkSubmitButton() {
    submitBtn.disabled = !linkInput.value.trim();
}

linkInput.addEventListener('input', checkSubmitButton);

submitBtn.addEventListener('click', () => {
    const link = linkInput.value.trim();
    const name = nameInput.value.trim();
    if (!link) return;
    document.getElementById('f_link').value = link;
    document.getElementById('f_name').value = name;
    document.getElementById('submissionForm').submit();
    submitMessage.textContent = '✅ Video sent!';
    linkInput.value = '';
    nameInput.value = '';
    checkSubmitButton();
    sfx();
});

// === SETTINGS ===
settings8D.addEventListener('change', updateAudioSettings);
settingsReverb.addEventListener('change', updateAudioSettings);
humVolumeSlider.addEventListener('input', updateAudioSettings);
testSoundBtn.addEventListener('click', playTestSound);

// === PLAY BUTTON ===
playBtn.addEventListener('click', () => {
    initAudio().then(() => playRandom());
});

// === INITIALIZE ===
document.addEventListener('click', () => {
    if (!audioInitialized) initAudio();
}, { once: true });

loadVideos();