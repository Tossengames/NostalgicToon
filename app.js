// === CONFIGURATION ===
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYVsilo654qcbY8lRVyYDjIDyHHYFluy_2sVZmQWEBHbGfF6t3cpN9sC0kroL9izednFK0IwmJFbyg/pub?gid=314817228&single=true&output=csv';

// === GLOBALS ===
let videos = [];
let showInfo = false;
let audioInitialized = false;
let playCooldown = false;
let stopTimeout = null;
let humPlaying = false;
let autoPlayInterval = null;
let currentVideoEndTime = null;

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

// === SIMPLE AUDIO INIT (Works on all browsers) ===
function initAudio() {
    if (audioInitialized) return;
    
    console.log('Initializing audio...');
    
    // Set initial volume for all audio elements
    if (clickSfx) clickSfx.volume = 0.7;
    if (staticSfx) staticSfx.volume = 0.5;
    if (successSfx) successSfx.volume = 0.8;
    
    // Set up hum sound
    if (humSfx) {
        humSfx.loop = true;
        humSfx.volume = 0.15; // 15% volume
        
        // Try to play hum (browsers might block this, but we'll try)
        humSfx.play().then(() => {
            humPlaying = true;
            console.log('Hum started');
        }).catch(e => {
            console.log('Hum play blocked - will start on next interaction');
        });
    }
    
    audioInitialized = true;
    console.log('Audio initialized');
}

// Play hum sound (call this after user interaction)
function playHum() {
    if (!humSfx || humPlaying) return;
    
    if (!audioInitialized) {
        initAudio();
        setTimeout(() => {
            humSfx.play().catch(() => {});
            humPlaying = true;
        }, 100);
    } else {
        humSfx.play().catch(() => {});
        humPlaying = true;
    }
}

// Simple sfx for buttons
function sfx() {
    if (!clickSfx) return;
    
    if (!audioInitialized) {
        initAudio();
        setTimeout(() => {
            clickSfx.currentTime = 0;
            clickSfx.play().catch(e => console.log('sfx error:', e));
            playHum();
        }, 100);
    } else {
        clickSfx.currentTime = 0;
        clickSfx.play().catch(e => console.log('sfx error:', e));
        playHum();
    }
}

// === UI FUNCTIONS ===
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
    if (platform === 'tiktok') return 30; // TikTok shorts are short
    if (platform === 'direct') return 60; // Direct videos default to 60s
    return 180; // YouTube/Vimeo default to 3 minutes
}

function getPlaybackStrategy(duration) {
    // For videos longer than 70 seconds, play 60 seconds from a random starting point
    // For shorter videos, play the whole thing
    if (duration <= 70) {
        return { startTime: 0, playDuration: duration };
    }
    
    // Start between 5 seconds in and (duration - 65) to ensure we have 60 seconds
    const maxStart = Math.max(5, duration - 65);
    const startTime = Math.floor(Math.random() * maxStart);
    
    return { startTime, playDuration: 60 }; // Always play for 60 seconds
}

function stopVideoAndPlayNext() {
    // Clear any existing timeout
    if (stopTimeout) {
        clearTimeout(stopTimeout);
        stopTimeout = null;
    }
    
    // Stop current video
    player.src = '';
    
    // Play static sound
    if (staticSfx && audioInitialized) {
        staticSfx.currentTime = 0;
        staticSfx.play().catch(() => {});
    }
    
    // Automatically play next video after a short delay (simulating channel change)
    setTimeout(() => {
        playRandom(false); // Pass false to not trigger sfx again
    }, 500);
}

function stopVideoAfterDelay(duration) {
    if (stopTimeout) clearTimeout(stopTimeout);
    
    // Store when this video will end
    currentVideoEndTime = Date.now() + (duration * 1000);
    
    // Set timeout to play next video
    stopTimeout = setTimeout(() => {
        stopVideoAndPlayNext();
    }, duration * 1000);
    
    console.log(`Video will play for ${duration} seconds, then auto-advance`);
}

function playRandom(playSfx = true) {
    if (playCooldown || videos.length === 0) return;

    playCooldown = true;
    playBtn.classList.add('disabled');
    setTimeout(() => {
        playCooldown = false;
        playBtn.classList.remove('disabled');
    }, 500);
    
    if (playSfx) {
        sfx();
    }
    
    const selected = videos[Math.floor(Math.random() * videos.length)];

    // Play static sound when changing channels
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
        }).filter(v => v.url && isValidVideoUrl(v.url));

        if (videos.length > 0) {
            // Automatically start playing when videos are loaded
            setTimeout(() => {
                playRandom();
            }, 1000); // Small delay to ensure everything is ready
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
    sfx();
    
    const linkVal = linkInput.value;
    const nameVal = nameInput.value.trim() || 'Nameless';
    
    if (!isValidVideoUrl(linkVal)) {
        submitMessage.innerHTML = '❌ INVALID LINK';
        setTimeout(() => { submitMessage.innerHTML = ''; }, 2000);
        return;
    }

    document.getElementById('f_link').value = linkVal;
    document.getElementById('f_name').value = nameVal;
    document.getElementById('submissionForm').submit();

    if (successSfx && audioInitialized) {
        successSfx.currentTime = 0;
        successSfx.play().catch(() => {});
    }

    submitMessage.innerHTML = '✨ THANKS! ✨';
    linkInput.value = '';
    nameInput.value = '';
    checkSubmitButton();
    
    setTimeout(() => {
        loadVideos(); // Reload videos to include the new one
        showTV();
        submitMessage.innerHTML = '';
    }, 2000);
}

// === AUTO-PLAY MANAGEMENT ===
function startAutoPlay() {
    // If there's a video currently playing, let it finish
    if (stopTimeout) {
        console.log('Auto-play: Video already playing, will auto-advance');
        return;
    }
    
    // Otherwise start playing
    if (videos.length > 0) {
        playRandom();
    }
}

// === EVENT BINDING ===
playBtn.onclick = () => playRandom(true);
document.getElementById('btnSubmit').onclick = showSubmit;
document.getElementById('btnInfo').onclick = openInfo;
document.getElementById('btnSend').onclick = submitNostalgia;
document.getElementById('btnShowName').onclick = toggleVideoInfo;
window.closeInfo = closeInfo;
window.showTV = showTV;

// Form input validation
linkInput.addEventListener('input', checkSubmitButton);
nameInput.addEventListener('input', checkSubmitButton);

// First click anywhere initializes audio
document.body.addEventListener('click', function initOnFirstClick() {
    initAudio();
    document.body.removeEventListener('click', initOnFirstClick);
}, { once: true });

document.body.addEventListener('touchstart', function initOnFirstTouch() {
    initAudio();
    document.body.removeEventListener('touchstart', initOnFirstTouch);
}, { once: true });

// Initialize
window.onload = () => {
    videoInfoDisplay.style.display = 'none';
    loadVideos(); // This will automatically start playing when videos are loaded
    
    // Check every minute if we need to restart auto-play (fallback)
    setInterval(() => {
        // If no video is playing (player src is empty) and we have videos, play one
        if (!player.src && videos.length > 0) {
            console.log('Auto-play: No video playing, starting one');
            playRandom();
        }
    }, 30000); // Check every 30 seconds
};