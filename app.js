let audioCtx, panner, humOsc;
const video = document.getElementById('main-video');

// 1. Random Image or Bloom Logic
const images = ['bg1.jpg', 'bg2.png', 'bg3.jpg']; // Add your filenames here
const bgContainer = document.getElementById('bg-container');

function setBackground() {
    const randomImg = images[Math.floor(Math.random() * images.length)];
    const img = new Image();
    img.src = `images/${randomImg}`;
    
    img.onload = () => {
        bgContainer.classList.remove('fallback-bg');
        bgContainer.style.backgroundImage = `url(${img.src})`;
        bgContainer.style.backgroundSize = 'cover';
        bgContainer.style.filter = 'blur(10px) brightness(0.6)';
    };
    img.onerror = () => {
        console.log("No images found, keeping animated bloom.");
    };
}

// 2. Audio Engine (8D Effect + Hum + Reverb)
function initAudio() {
    if (audioCtx) return; // Prevent multiple initializations

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(video);

    // Reverb (Simple simulate using a low-pass and gain for "echo")
    const reverb = audioCtx.createConvolver(); 
    // Note: True reverb needs an impulse file, using simple gain for now
    
    // 8D Panner
    panner = audioCtx.createPanner();
    panner.panningModel = 'HRTF';

    // TV Hum (Low volume 50Hz)
    humOsc = audioCtx.createOscillator();
    const humGain = audioCtx.createGain();
    humOsc.frequency.value = 50;
    humGain.gain.value = 0.02; // Very quiet
    humOsc.connect(humGain).connect(audioCtx.destination);
    humOsc.start();

    // Route: Video -> Panner -> Destination
    source.connect(panner).connect(audioCtx.destination);

    video.play();
    update8D();
}

// Rotate sound in 3D space
let angle = 0;
function update8D() {
    const x = Math.sin(angle) * 5;
    const z = Math.cos(angle) * 5;
    panner.positionX.value = x;
    panner.positionZ.value = z;
    angle += 0.015; 
    requestAnimationFrame(update8D);
}

// 3. UI Logic
function toggleInfo() {
    document.getElementById('video-info').classList.toggle('hidden');
}

function loadVideo() {
    const url = document.getElementById('input-url').value;
    const name = document.getElementById('input-name').value;
    const uploader = document.getElementById('input-uploader').value;

    if(url) video.src = url;
    document.getElementById('display-name').innerText = name || "Untitled";
    document.getElementById('display-uploader').innerText = `Uploader: ${uploader || "Unknown"}`;
    video.play();
}

// Initialize BG on load
setBackground();
