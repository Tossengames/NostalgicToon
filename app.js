// === CONFIGURATION ===
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYVsilo654qcbY8lRVyYDjIDyHHYFluy_2sVZmQWEBHbGfF6t3cpN9sC0kroL9izednFK0IwmJFbyg/pub?gid=314817228&single=true&output=csv';

// === GLOBALS ===
let videos = [];
let showInfo = true; // Default enabled
let audioInitialized = false;
let playCooldown = false;
let stopTimeout = null;
let humPlaying = false;
let useProgrammaticSound = false;
let audioContext = null;

// Color palette for nostalgic feel
const borderColors = [
  '#ff6ec7', // pink
  '#4d9eff', // blue
  '#ffd966', // yellow
  '#b983ff', // purple
  '#ff99cc', // light pink
  '#66ccff', // light blue
  '#99ff99', // light green
  '#ffaa00'  // orange
];

// Elements
const player = document.getElementById('player');
const clickSfx = document.getElementById('sfxClick');
const staticSfx = document.getElementById('sfxStatic');
const humSfx = document.getElementById('sfxHum');
const successSfx = document.getElementById('sfxSuccess');
const videoInfoDisplay = document.getElementById('videoInfoDisplay');
const submitBtn = document.getElementById('btnSend');
const linkInput = document.getElementById('s_link');
const nameInput = document.getElementById('s_name');
const submitMessage = document.getElementById('submitMessage');
const playBtn = document.getElementById('btnSwitch');
const tvUnit = document.getElementById('tv-unit');
const tvPanel = document.getElementById('tv-panel');
const backdrop = document.getElementById('tv-backdrop');

// === RANDOM COLOR GENERATOR ===
function getRandomColor() {
  return borderColors[Math.floor(Math.random() * borderColors.length)];
}

function updateRandomColors() {
  const color1 = getRandomColor();
  const color2 = getRandomColor();
  const color3 = getRandomColor();
  
  // Update TV unit border
  if (tvUnit) {
    tvUnit.style.borderColor = color1;
    tvUnit.style.boxShadow = `0 40px 80px rgba(0,0,0,0.9), 0 0 0 3px ${color1}, 0 0 50px ${color2}`;
  }
  
  // Update panel border
  if (tvPanel) {
    tvPanel.style.borderColor = color2;
  }
  
  // Update retro cards in overlays
  document.querySelectorAll('.retro-card').forEach(card => {
    card.style.borderColor = color3;
  });
  
  console.log('Colors updated:', color1, color2, color3);
}

// === RANDOM BACKGROUND IMAGE ===
async function loadRandomBackgroundImage() {
  // Try to load from images folder, fallback to gradient
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const imageFolder = 'images/';
  
  // Try to find a random image
  for (let i = 1; i <= 10; i++) {
    const randomNum = Math.floor(Math.random() * 20) + 1;
    for (const ext of imageExtensions) {
      const imgPath = `${imageFolder}image${randomNum}.${ext}`;
      try {
        const response = await fetch(imgPath, { method: 'HEAD' });
        if (response.ok) {
          backdrop.style.backgroundImage = `url('${imgPath}')`;
          console.log('Loaded background:', imgPath);
          return;
        }
      } catch (e) {
        // Continue trying
      }
    }
  }
  
  // Fallback to gradient if no images found
  const gradient = `radial-gradient(circle at 30% 40%, ${getRandomColor()}, ${getRandomColor()}, ${getRandomColor()})`;
  backdrop.style.backgroundImage = gradient;
  backdrop.style.backgroundSize = 'cover';
  console.log('Using gradient fallback');
}

// === RIPPLE ANIMATION ===
function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  
  const size = Math.max(rect.width, rect.height) * 2;
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.classList.add('ripple');
  
  // Remove existing ripples
  const existingRipple = button.querySelector('.ripple');
  if (existingRipple) {
    existingRipple.remove();
  }
  
  button.appendChild(ripple);
  
  // Remove after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// === PROGRAMMATIC SOUND GENERATION ===
function initProgrammaticSound() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return true;
  } catch (e) {
    console.log('Web Audio API not supported');
    return false;
  }
}

function playProgrammaticClick() {
  if (!audioContext) {
    if (!initProgrammaticSound()) return;
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      generateClickSound();
    });
  } else {
    generateClickSound();
  }
}

function generateClickSound() {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.value = 800;
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1);
}

function playProgrammaticStatic() {
  if (!audioContext) {
    if (!initProgrammaticSound()) return;
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      generateStaticSound();
    });
  } else {
    generateStaticSound();
  }
}

function generateStaticSound() {
  const bufferSize = 4096;
  const noiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
  const gainNode = audioContext.createGain();
  
  noiseNode.onaudioprocess = function(e) {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  };
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
  
  noiseNode.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  setTimeout(() => {
    noiseNode.disconnect();
    gainNode.disconnect();
  }, 300);
}

function playProgrammaticHum() {
  if (!audioContext) {
    if (!initProgrammaticSound()) return;
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      startProgrammaticHum();
    });
  } else {
    startProgrammaticHum();
  }
}

function startProgrammaticHum() {
  if (humPlaying) return;
  
  const bufferSize = 4096;
  const noiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();
  
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 200;
  
  noiseNode.onaudioprocess = function(e) {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.3;
    }
  };
  
  gainNode.gain.value = 0.05;
  
  noiseNode.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  humPlaying = true;
  console.log('Programmatic hum started');
}

function playProgrammaticSuccess() {
  if (!audioContext) {
    if (!initProgrammaticSound()) return;
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      generateSuccessSound();
    });
  } else {
    generateSuccessSound();
  }
}

function generateSuccessSound() {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator1.type = 'sine';
  oscillator1.frequency.value = 523.25; // C5
  
  oscillator2.type = 'sine';
  oscillator2.frequency.value = 659.25; // E5
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
  
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator1.start();
  oscillator2.start();
  oscillator1.stop(audioContext.currentTime + 0.2);
  oscillator2.stop(audioContext.currentTime + 0.3);
}

// === AUDIO INIT WITH FALLBACK ===
async function initAudio() {
  if (audioInitialized) return;
  
  console.log('Initializing audio...');
  
  // Try to load external MP3s first
  const mp3Sources = {
    click: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_4b77a0a9d5.mp3',
    static: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_5c68b1c0b0.mp3',
    hum: 'https://cdn.pixabay.com/download/audio/2021/08/08/audio_9a93c0a6f7.mp3',
    success: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_6a8c0a4d8f.mp3'
  };
  
  // Try to load each MP3
  try {
    clickSfx.src = mp3Sources.click;
    await clickSfx.load();
    // Test if it can play
    clickSfx.play().catch(() => {}).then(() => {
      clickSfx.pause();
      clickSfx.currentTime = 0;
    });
    console.log('MP3 sounds loaded successfully');
    useProgrammaticSound = false;
  } catch (e) {
    console.log('MP3 loading failed, using programmatic sound');
    useProgrammaticSound = true;
    initProgrammaticSound();
  }
  
  // Set up hum
  if (!useProgrammaticSound && humSfx) {
    humSfx.loop = true;
    humSfx.volume = 0.15;
    try {
      await humSfx.play();
      humPlaying = true;
      console.log('Hum started');
    } catch (e) {
      console.log('Hum play blocked');
    }
  } else if (useProgrammaticSound) {
    playProgrammaticHum();
  }
  
  audioInitialized = true;
  console.log('Audio initialized, using', useProgrammaticSound ? 'programmatic' : 'MP3', 'sounds');
}

// Play hum
function playHum() {
  if (humPlaying) return;
  
  if (!audioInitialized) {
    initAudio();
    setTimeout(() => {
      if (useProgrammaticSound) {
        playProgrammaticHum();
      } else if (humSfx) {
        humSfx.play().catch(() => {});
        humPlaying = true;
      }
    }, 100);
  } else {
    if (useProgrammaticSound) {
      playProgrammaticHum();
    } else if (humSfx) {
      humSfx.play().catch(() => {});
      humPlaying = true;
    }
  }
}

// Main sound function
function sfx(event) {
  // Create ripple effect
  if (event) {
    createRipple(event);
  }
  
  if (!audioInitialized) {
    initAudio();
    setTimeout(() => {
      if (useProgrammaticSound) {
        playProgrammaticClick();
      } else if (clickSfx) {
        clickSfx.currentTime = 0;
        clickSfx.play().catch(() => {});
      }
      playHum();
    }, 100);
  } else {
    if (useProgrammaticSound) {
      playProgrammaticClick();
    } else if (clickSfx) {
      clickSfx.currentTime = 0;
      clickSfx.play().catch(() => {});
    }
    playHum();
  }
}

// Static sound
function playStatic() {
  if (!audioInitialized) {
    initAudio();
    setTimeout(() => {
      if (useProgrammaticSound) {
        playProgrammaticStatic();
      } else if (staticSfx) {
        staticSfx.currentTime = 0;
        staticSfx.play().catch(() => {});
      }
    }, 100);
  } else {
    if (useProgrammaticSound) {
      playProgrammaticStatic();
    } else if (staticSfx) {
      staticSfx.currentTime = 0;
      staticSfx.play().catch(() => {});
    }
  }
}

// Success sound
function playSuccess() {
  if (!audioInitialized) {
    initAudio();
    setTimeout(() => {
      if (useProgrammaticSound) {
        playProgrammaticSuccess();
      } else if (successSfx) {
        successSfx.currentTime = 0;
        successSfx.play().catch(() => {});
      }
    }, 100);
  } else {
    if (useProgrammaticSound) {
      playProgrammaticSuccess();
    } else if (successSfx) {
      successSfx.currentTime = 0;
      successSfx.play().catch(() => {});
    }
  }
}

// === UI FUNCTIONS ===
function showTV() { 
  sfx(event); 
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('tv').classList.add('active'); 
}

function showSubmit() { 
  sfx(event); 
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('submit').classList.add('active');
  checkSubmitButton();
}

function toggleVideoInfo() {
  sfx(event);
  showInfo = !showInfo;
  videoInfoDisplay.style.display = showInfo ? 'block' : 'none';
}

function openInfo() { 
  sfx(event); 
  document.getElementById('info').classList.add('active'); 
}

function closeInfo() { 
  sfx(event); 
  document.getElementById('info').classList.remove('active'); 
}

// === VIDEO FUNCTIONS ===
function getPlatformFromUrl(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('dailymotion.com') || url.includes('dai.ly')) return 'dailymotion';
  if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) return 'direct';
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
    case 'youtube':
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=0&start=${startTime}`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`;
    case 'tiktok':
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    case 'dailymotion':
      return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
    case 'direct':
      return videoUrl;
    default:
      return null;
  }
}

function estimateVideoDuration(url) {
  const platform = getPlatformFromUrl(url);
  if (platform === 'tiktok') return 30;
  if (platform === 'direct') return 60;
  return 180;
}

function getPlaybackStrategy(duration) {
  if (duration <= 70) {
    return { startTime: 0, playDuration: duration };
  }
  const maxStart = Math.max(5, duration - 65);
  const startTime = Math.floor(Math.random() * maxStart);
  return { startTime, playDuration: 60 };
}

function stopVideoAndPlayNext() {
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }
  
  player.src = '';
  playStatic();
  
  setTimeout(() => {
    playRandom(false);
    updateRandomColors(); // Change colors on new video
    loadRandomBackgroundImage(); // Change background on new video
  }, 500);
}

function stopVideoAfterDelay(duration) {
  if (stopTimeout) clearTimeout(stopTimeout);
  
  stopTimeout = setTimeout(() => {
    stopVideoAndPlayNext();
  }, duration * 1000);
  
  console.log(`Video will play for ${duration} seconds`);
}

function playRandom(playSfxSound = true) {
  if (playCooldown || videos.length === 0) return;

  playCooldown = true;
  playBtn.classList.add('disabled');
  setTimeout(() => {
    playCooldown = false;
    playBtn.classList.remove('disabled');
  }, 500);
  
  if (playSfxSound) {
    sfx(event);
  }
  
  const selected = videos[Math.floor(Math.random() * videos.length)];

  playStatic();
  
  videoInfoDisplay.innerHTML = `📼 ${selected.by.toUpperCase()}`;
  
  const duration = estimateVideoDuration(selected.url);
  const strategy = getPlaybackStrategy(duration);
  const embedUrl = getEmbedUrl(selected.url, strategy.startTime);
  
  if (embedUrl) {
    player.src = embedUrl;
    stopVideoAfterDelay(strategy.playDuration);
  }
}

async function loadVideos() {
  try {
    const response = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`);
    const data = await response.text();
    
    videos = data.split('\n').slice(1).map(row => {
      const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      return {
        url: cols[1] ? cols[1].replace(/"/g, '').trim() : null,
        by: cols[2] ? cols[2].replace(/"/g, '').trim() : 'بدون اسم'
      };
    }).filter(v => v.url && isValidVideoUrl(v.url));

    if (videos.length > 0) {
      setTimeout(() => {
        playRandom();
        updateRandomColors();
        loadRandomBackgroundImage();
      }, 1000);
    }
  } catch (e) {
    console.log('Video load error:', e);
  }
}

function isValidVideoUrl(url) {
  if (!url || !url.includes('http')) return false;
  const patterns = ['youtube.com', 'youtu.be', 'vimeo.com', 'tiktok.com', 'dailymotion.com', 'dai.ly', '.mp4', '.webm', '.mov'];
  return patterns.some(pattern => url.includes(pattern));
}

function checkSubmitButton() {
  const isValid = isValidVideoUrl(linkInput.value);
  submitBtn.disabled = !isValid;
  if (isValid) {
    submitBtn.classList.add('active');
  } else {
    submitBtn.classList.remove('active');
  }
}

function submitNostalgia() {
  sfx(event);
  
  const linkVal = linkInput.value;
  const nameVal = nameInput.value.trim() || 'بدون اسم';
  
  if (!isValidVideoUrl(linkVal)) {
    submitMessage.innerHTML = '❌ رابط غير صالح';
    setTimeout(() => { submitMessage.innerHTML = ''; }, 2000);
    return;
  }

  document.getElementById('f_link').value = linkVal;
  document.getElementById('f_name').value = nameVal;
  document.getElementById('submissionForm').submit();

  playSuccess();

  submitMessage.innerHTML = '✨ شكراً لك! ✨';
  linkInput.value = '';
  nameInput.value = '';
  checkSubmitButton();
  
  setTimeout(() => {
    loadVideos();
    showTV();
    submitMessage.innerHTML = '';
  }, 2000);
}

// === AUTO-PLAY MANAGEMENT ===
function startAutoPlay() {
  if (stopTimeout) {
    return;
  }
  
  if (videos.length > 0) {
    playRandom();
  }
}

// === EVENT BINDING ===
playBtn.onclick = (e) => playRandom(true);
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnSend').onclick = submitNostalgia;
document.getElementById('btnShowName').onclick = toggleVideoInfo;
window.closeInfo = closeInfo;
window.showTV = showTV;

// Add ripple to all buttons
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', createRipple);
});

// Form input validation
linkInput.addEventListener('input', checkSubmitButton);
nameInput.addEventListener('input', checkSubmitButton);

// First click initializes audio
document.body.addEventListener('click', function initOnFirstClick(e) {
  initAudio();
  // Also create ripple on body click for fun
  if (e.target === document.body) {
    const ripple = document.createElement('span');
    ripple.style.position = 'fixed';
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.classList.add('ripple');
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }
  document.body.removeEventListener('click', initOnFirstClick);
}, { once: true });

document.body.addEventListener('touchstart', function initOnFirstTouch() {
  initAudio();
  document.body.removeEventListener('touchstart', initOnFirstTouch);
}, { once: true });

// Initialize
window.onload = () => {
  videoInfoDisplay.style.display = 'block'; // Default enabled
  loadVideos();
  updateRandomColors();
  loadRandomBackgroundImage();
  
  setInterval(() => {
    if (!player.src && videos.length > 0) {
      console.log('Auto-play: Starting new video');
      playRandom();
      updateRandomColors();
      loadRandomBackgroundImage();
    }
  }, 30000);
  
  // Change colors slightly over time for subtle variation
  setInterval(() => {
    updateRandomColors();
  }, 300000); // Every 5 minutes
};