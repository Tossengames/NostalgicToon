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
let stopTimeout = null;

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

// === PLATFORM DETECTION & EMBED URL GENERATION ===
function getPlatformFromUrl(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('/shorts/')) {
        return 'youtube';
    } else if (url.includes('vimeo.com')) {
        return 'vimeo';
    } else if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) {
        return 'tiktok';
    } else if (url.includes('instagram.com') || url.includes('instagr.am')) {
        return 'instagram';
    } else if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) {
        return 'facebook';
    } else if (url.includes('dailymotion.com') || url.includes('dai.ly')) {
        return 'dailymotion';
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
        return 'twitter';
    } else if (url.includes('twitch.tv')) {
        return 'twitch';
    } else if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('.avi')) {
        return 'direct';
    }
    return 'unknown';
}

function extractVideoId(url, platform) {
    switch(platform) {
        case 'youtube':
            const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
            const match = url.match(youtubeRegex);
            return (match && match[2].length === 11) ? match[2] : url;
            
        case 'vimeo':
            const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
            const vimeoMatch = url.match(vimeoRegex);
            return vimeoMatch ? vimeoMatch[1] : url;
            
        case 'tiktok':
            const tiktokRegex = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/;
            const tiktokMatch = url.match(tiktokRegex);
            return tiktokMatch ? tiktokMatch[1] : url;
            
        case 'dailymotion':
            const dailymotionRegex = /dailymotion\.com\/video\/([a-zA-Z0-9]+)/;
            const dailymotionMatch = url.match(dailymotionRegex);
            return dailymotionMatch ? dailymotionMatch[1] : url;
            
        default:
            return url;
    }
}

function getEmbedUrl(videoUrl, startTime = 0) {
    const platform = getPlatformFromUrl(videoUrl);
    const videoId = extractVideoId(videoUrl, platform);
    
    switch(platform) {
        case 'youtube':
            return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&enablejsapi=1&start=${startTime}`;
            
        case 'vimeo':
            return `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`;
            
        case 'tiktok':
            return `https://www.tiktok.com/embed/v2/${videoId}`;
            
        case 'instagram':
            // Instagram requires authentication - this may not work without access token
            return `https://www.instagram.com/p/${videoId}/embed`;
            
        case 'facebook':
            // Facebook requires App ID - this may not work without proper setup
            return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&autoplay=1`;
            
        case 'dailymotion':
            return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
            
        case 'twitter':
            return `https://twitframe.com/show?url=${encodeURIComponent(videoUrl)}`;
            
        case 'direct':
            return videoUrl; // Direct video file URL
            
        default:
            return null;
    }
}

// === VIDEO DURATION HANDLING ===
function estimateVideoDuration(url) {
    const platform = getPlatformFromUrl(url);
    
    switch(platform) {
        case 'youtube':
            return 180;
        case 'vimeo':
            return 180;
        case 'instagram':
            return 60;
        case 'tiktok':
            return 30;
        case 'facebook':
            return 120;
        case 'twitter':
            return 120;
        case 'dailymotion':
            return 180;
        case 'direct':
            return 60;
        default:
            return 120;
    }
}

function getPlaybackStrategy(duration) {
    // Videos shorter than 30 seconds: play full
    if (duration < 30) {
        return {
            type: 'full',
            startTime: 0,
            playDuration: duration
        };
    }
    
    // Videos between 30-45 seconds: play full (can't fit 30s with skips)
    if (duration <= 45) {
        return {
            type: 'full',
            startTime: 0,
            playDuration: duration
        };
    }
    
    // Videos longer than 45 seconds: play random 30s from middle
    const skipStart = 5;
    const skipEnd = 10;
    const availableDuration = duration - skipStart - skipEnd;
    
    if (availableDuration < 30) {
        // Fallback if middle is less than 30s
        return {
            type: 'full',
            startTime: 0,
            playDuration: duration
        };
    }
    
    const maxStart = duration - skipEnd - 30;
    const startTime = Math.floor(Math.random() * (maxStart - skipStart + 1)) + skipStart;
    
    return {
        type: 'segment',
        startTime: startTime,
        playDuration: 30
    };
}

function stopVideoAfterDelay(duration) {
    if (stopTimeout) clearTimeout(stopTimeout);
    
    stopTimeout = setTimeout(() => {
        player.src = '';
        
        if (staticSfx && audioInitialized) {
            staticSfx.currentTime = 0;
            staticSfx.play().catch(e => console.log('Static play failed:', e));
        }
    }, duration * 1000);
}

// === VIDEO PLAYBACK ===
function playVideo(videoUrl, startTime, playDuration) {
    const embedUrl = getEmbedUrl(videoUrl, startTime);
    
    if (!embedUrl) {
        console.log('Unsupported platform for embedding');
        videoInfoDisplay.innerHTML = '❌ PLATFORM NOT SUPPORTED';
        return;
    }
    
    player.src = embedUrl;
    player.style.opacity = 1;
    stopVideoAfterDelay(playDuration);
}

function playRandom() {
    if (playCooldown) return;
    if (videos.length === 0) return;

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
    
    videoInfoDisplay.innerHTML = `📼 UPLOADED BY: ${selected.by.toUpperCase()}`;
    nowPlayingTitle.innerHTML = `📡 ${selected.by.toUpperCase()}`;
    
    const duration = estimateVideoDuration(selected.url);
    const strategy = getPlaybackStrategy(duration);
    
    const platform = getPlatformFromUrl(selected.url);
    console.log(`Playing from ${platform}: ${strategy.type === 'full' ? 'full video' : '30s segment starting at ' + strategy.startTime + 's'}`);
    
    playVideo(selected.url, strategy.startTime, strategy.playDuration);
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
        'youtube.com', 'youtu.be', 'vimeo.com', 'instagram.com', 
        'fb.watch', 'facebook.com', 'tiktok.com', 'vm.tiktok.com', 
        'dailymotion.com', 'dai.ly', 'twitter.com', 'x.com', 'twitch.tv',
        '.mp4', '.webm', '.mov', '.avi'
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