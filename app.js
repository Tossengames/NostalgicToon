// --- Data Sheet (The "Channels") ---
const videoSheet = [
    { name: "Neon City", uploader: "Spy01", url: "video1.mp4" },
    { name: "Cyber Sunset", uploader: "Agent_X", url: "video2.mp4" }
];

const video = document.getElementById('main-video');
const canvas = document.getElementById('static-canvas');
const ctx = canvas.getContext('2d');
let audioCtx, panner, humOsc;

// --- Static Noise Effect ---
function drawStatic() {
    const idata = ctx.createImageData(canvas.width, canvas.height);
    const buffer = new Uint32Array(idata.data.buffer);
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.random() < 0.5 ? 0xff000000 : 0xffffffff;
    }
    ctx.putImageData(idata, 0, 0);
    if (!video.src) requestAnimationFrame(drawStatic);
}
canvas.width = 200; canvas.height = 150;
drawStatic();

// --- Audio Engine (8D + Hum + Reverb) ---
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Hum
    humOsc = audioCtx.createOscillator();
    const humGain = audioCtx.createGain();
    humOsc.frequency.value = 50;
    humGain.gain.value = 0.03;
    humOsc.connect(humGain).connect(audioCtx.destination);
    humOsc.start();

    // 8D Panner
    const source = audioCtx.createMediaElementSource(video);
    panner = audioCtx.createPanner();
    panner.panningModel = 'HRTF';
    source.connect(panner).connect(audioCtx.destination);
    
    update8D();
}

function update8D() {
    let angle = 0;
    setInterval(() => {
        panner.positionX.value = Math.sin(angle) * 5;
        panner.positionZ.value = Math.cos(angle) * 5;
        angle += 0.02;
    }, 50);
}

// --- Interaction Logic ---
function switchChannel() {
    initAudio();
    const randomVid = videoSheet[Math.floor(Math.random() * videoSheet.length)];
    
    canvas.classList.add('hidden'); // Hide noise
    video.src = randomVid.url;
    video.play();

    document.getElementById('display-name').innerText = randomVid.name;
    document.getElementById('display-uploader').innerText = `By: ${randomVid.uploader}`;
}

function openSubmit() { document.getElementById('submit-panel').classList.remove('hidden'); }
function closeSubmit() { document.getElementById('submit-panel').classList.add('hidden'); }

function submitVideo() {
    const newVid = {
        name: document.getElementById('input-name').value,
        uploader: document.getElementById('input-uploader').value,
        url: document.getElementById('input-url').value
    };
    videoSheet.push(newVid);
    alert("Channel Encrypted and Added!");
    closeSubmit();
}

function toggleInfo() {
    document.getElementById('video-info').classList.toggle('hidden');
}
