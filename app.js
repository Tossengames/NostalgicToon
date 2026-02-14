const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYVsilo654qcbY8lRVyYDjIDyHHYFluy_2sVZmQWEBHbGfF6t3cpN9sC0kroL9izednFK0IwmJFbyg/pub?gid=314817228&single=true&output=csv';

let videos = [];
let audioInitialized = false;
let audioContext, pannerNode, reverbNode, humGainNode;
let settings = { enable8D: true, enableReverb: true, humVolume: 15 };

// Elements
const player = document.getElementById('player');
const clickSfx = document.getElementById('sfxClick');
const humSfx = document.getElementById('sfxHum');
const playBtn = document.getElementById('btnSwitch');
const linkInput = document.getElementById('s_link');
const nameInput = document.getElementById('s_name');

async function initAudio() {
    if (audioInitialized) {
        if (audioContext.state === 'suspended') await audioContext.resume();
        return;
    }
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        pannerNode = audioContext.createStereoPanner();
        reverbNode = audioContext.createConvolver();
        humGainNode = audioContext.createGain();

        // Impulse for reverb
        const length = audioContext.sampleRate * 1.5;
        const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
        for (let i = 0; i < length; i++) {
            const decay = Math.exp(-i / (audioContext.sampleRate * 0.3));
            impulse.getChannelData(0)[i] = (Math.random() * 2 - 1) * decay;
            impulse.getChannelData(1)[i] = (Math.random() * 2 - 1) * decay;
        }
        reverbNode.buffer = impulse;

        const track = audioContext.createMediaElementSource(humSfx);
        track.connect(humGainNode);
        humGainNode.gain.value = settings.humVolume / 100;
        humGainNode.connect(settings.enableReverb ? reverbNode : pannerNode);
        if (settings.enableReverb) reverbNode.connect(pannerNode);
        pannerNode.connect(audioContext.destination);

        humSfx.play();
        audioInitialized = true;
        if (settings.enable8D) start8D();
    } catch (e) { console.warn("Audio Context failed", e); }
}

function start8D() {
    let t = 0;
    const loop = () => {
        if (!settings.enable8D) return;
        pannerNode.pan.setValueAtTime(Math.sin(t += 0.01), audioContext.currentTime);
        requestAnimationFrame(loop);
    };
    loop();
}

function playRandom() {
    if (videos.length === 0) return;
    clickSfx.play();
    const v = videos[Math.floor(Math.random() * videos.length)];
    document.getElementById('nowPlayingTitle').innerText = `📡 ${v.by.toUpperCase()}`;
    
    let id = v.url;
    if (v.url.includes('v=')) id = v.url.split('v=')[1].split('&')[0];
    else if (v.url.includes('be/')) id = v.url.split('be/')[1];

    player.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0`;
}

async function loadVideos() {
    const res = await fetch(`${SHEET_CSV_URL}&t=${Date.now()}`);
    const text = await res.text();
    videos = text.split('\n').slice(1).map(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        return { url: (parts[1]||'').replace(/"/g,''), by: (parts[2]||'ANON').replace(/"/g,'') };
    }).filter(v => v.url.includes('http'));
    if (videos.length) playRandom();
}

function submitNostalgia() {
    document.getElementById('f_link').value = linkInput.value;
    document.getElementById('f_name').value = nameInput.value || 'Nameless';
    document.getElementById('submissionForm').submit();
    document.getElementById('submitMessage').innerText = "SENT! RELOADING...";
    setTimeout(() => location.reload(), 2000);
}

// Controls
playBtn.onclick = playRandom;
document.getElementById('btnSend').onclick = submitNostalgia;
document.getElementById('btnSubmit').onclick = () => { clickSfx.play(); document.getElementById('submit').classList.add('active'); };
document.getElementById('btnSettings').onclick = () => { clickSfx.play(); document.getElementById('settings').classList.add('active'); };
window.showTV = () => { document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); document.getElementById('tv').classList.add('active'); };
window.closeSettings = () => document.getElementById('settings').classList.remove('active');

linkInput.oninput = () => document.getElementById('btnSend').disabled = !linkInput.value.includes('http');

document.body.onclick = () => { initAudio(); document.body.onclick = null; };

window.onload = loadVideos;
