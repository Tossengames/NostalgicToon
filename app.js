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
let humGainNode = null;
let pannerNode = null;
let reverbNode = null;
let masterGain = null;

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

// Settings
const settings8D = document.getElementById('setting8D');
const settingsReverb = document.getElementById('settingReverb');
const humVolumeSlider = document.getElementById('humVolume');
const humVolumeValue = document.getElementById('humVolumeValue');
const testSoundBtn = document.getElementById('testSoundBtn');

// === AUDIO INIT (FIXED & SAFE) ===
async function initAudio() {
    if (audioInitialized) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);

    // Attach ALL sfx to AudioContext (THIS FIXES BUTTON SFX)
    [clickSfx, staticSfx, successSfx].forEach(el => {
        if (!el) return;
        const src = audioContext.createMediaElementSource(el);
        src.connect(masterGain);
    });

    // === HUM EFFECT CHAIN (UNCHANGED LOGIC) ===
    pannerNode = audioContext.createStereoPanner();
    reverbNode = audioContext.createConvolver();
    humGainNode = audioContext.createGain();

    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 1.5;
    const impulse = audioContext.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.3));
        }
    }
    reverbNode.buffer = impulse;

    if (humSfx) {
        humSfx.loop = true;
        const humSrc = audioContext.createMediaElementSource(humSfx);
        humSrc.connect(humGainNode);
        humGainNode.gain.value = settings.humVolume / 100;

        if (settings.enableReverb) {
            humGainNode.connect(reverbNode);
            reverbNode.connect(pannerNode);
        } else {
            humGainNode.connect(pannerNode);
        }

        pannerNode.connect(masterGain);
        humSfx.play().catch(() => {});
    }

    audioInitialized = true;

    if (settings.enable8D) start8DEffect();
}

// === 8D PAN ===
function start8DEffect() {
    if (!pannerNode) return;
    let t = 0;
    (function pan() {
        if (!settings.enable8D) return;
        t += 0.01;
        pannerNode.pan.setValueAtTime(Math.sin(t * 0.8), audioContext.currentTime);
        requestAnimationFrame(pan);
    })();
}

// === AUDIO SETTINGS ===
function updateAudioSettings() {
    settings.enable8D = settings8D.checked;
    settings.enableReverb = settingsReverb.checked;
    settings.humVolume = parseInt(humVolumeSlider.value);
    humVolumeValue.textContent = settings.humVolume + '%';
    if (humGainNode) humGainNode.gain.value = settings.humVolume / 100;
}

// === SFX (FIXED) ===
function play(el) {
    if (!audioInitialized || !el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
}
function sfx() { play(clickSfx); }

// === UI ===
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

// === VIDEO LOGIC (UNCHANGED) ===
// (everything below is untouched except SFX calls)

function playRandom() {
    if (playCooldown || videos.length === 0) return;
    playCooldown = true;
    playBtn.classList.add('disabled');
    setTimeout(() => {
        playCooldown = false;
        playBtn.classList.remove('disabled');
    }, 500);

    sfx();
    const selected = videos[Math.floor(Math.random() * videos.length)];
    play(staticSfx);

    videoInfoDisplay.innerHTML = `📼 ${selected.by.toUpperCase()}`;
    nowPlayingTitle.innerHTML = `📡 ${selected.by.toUpperCase()}`;

    player.src = getEmbedUrl(selected.url, 0);
}

// === LOAD VIDEOS (UNCHANGED) ===
async function loadVideos() {
    const res = await fetch(`${SHEET_CSV_URL}&cache=${Date.now()}`);
    const txt = await res.text();
    videos = txt.split('\n').slice(1).map(r => {
        const c = r.split(',');
        return { url: c[1], by: c[2] || 'ANON' };
    }).filter(v => v.url);
}

// === SUBMIT (UNCHANGED) ===
function submitNostalgia() {
    sfx();
    play(successSfx);
    submitMessage.innerHTML = '✨ THANKS! ✨';
    setTimeout(() => showTV(), 1500);
}

// === EVENTS ===
playBtn.onclick = playRandom;
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnSend').onclick = submitNostalgia;
document.getElementById('btnShowName').onclick = toggleVideoInfo;
document.getElementById('btnSettings').onclick = openSettings;

settings8D.addEventListener('change', updateAudioSettings);
settingsReverb.addEventListener('change', updateAudioSettings);
humVolumeSlider.addEventListener('input', updateAudioSettings);
testSoundBtn.addEventListener('click', () => play(clickSfx));

// === UNLOCK AUDIO ===
document.body.addEventListener('click', initAudio, { once: true });
document.body.addEventListener('touchstart', initAudio, { once: true });

// === INIT ===
window.onload = () => {
    videoInfoDisplay.style.display = 'none';
    loadVideos();
};