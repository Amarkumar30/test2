// Enhanced Home Page JavaScript

// Global variables
var heroVideoUrl, heroUploadBtn, heroGetStarted, previewCard, previewClose;
var previewImage, previewTitle, previewVideoTitle, previewDescription, previewDuration, previewProcess;
var navAuth, signInLink, signUpLink, userMenu, userName, logoutBtn;
var currentUser = null;
var accessToken = null;
var currentVideoData = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced home page initializing...');
    initializeElements();
    checkAuthStatus();
    setupEventListeners();
    console.log('Enhanced home page initialized successfully');
});

// Make functions globally available
window.initializeElements = initializeElements;
window.checkAuthStatus = checkAuthStatus;
window.showUserMenu = showUserMenu;
window.showAuthLinks = showAuthLinks;
window.logout = logout;
window.handleGetStarted = handleGetStarted;

function initializeElements() {
    // Main elements
    heroVideoUrl = document.getElementById('hero-video-url');
    heroUploadBtn = document.getElementById('hero-upload-btn');
    heroGetStarted = document.getElementById('hero-get-started');
    previewCard = document.getElementById('preview-card');
    previewClose = document.getElementById('preview-close');
    previewImage = document.getElementById('preview-image');
    previewTitle = document.getElementById('preview-title');
    previewVideoTitle = document.getElementById('preview-video-title');
    previewDescription = document.getElementById('preview-description');
    previewDuration = document.getElementById('preview-duration');
    previewProcess = document.getElementById('preview-process');

    // Authentication elements
    navAuth = document.getElementById('nav-auth');
    signInLink = document.getElementById('sign-in-link');
    signUpLink = document.getElementById('sign-up-link');
    userMenu = document.getElementById('user-menu');
    userName = document.getElementById('user-name');
    logoutBtn = document.getElementById('logout-btn');
}

function checkAuthStatus() {
    accessToken = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    console.log('Checking auth status:', { accessToken: !!accessToken, userStr: !!userStr });
    
    if (accessToken && userStr) {
        try {
            currentUser = JSON.parse(userStr);
            showUserMenu();
        } catch (e) {
            console.error('Error parsing user data:', e);
            showAuthLinks();
        }
    } else {
        showAuthLinks();
    }
}

function showUserMenu() {
    console.log('Showing user menu for:', currentUser);
    if (signInLink && signUpLink && userMenu && userName) {
        // Hide authentication buttons
        signInLink.style.display = 'none';
        signUpLink.style.display = 'none';
        // Show user menu
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.username || currentUser.email || 'User';
        
        // Also hide any authentication modals or overlays
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'none';
        }
    }
}

function showAuthLinks() {
    console.log('Showing auth links');
    if (signInLink && signUpLink && userMenu) {
        // Show authentication buttons
        signInLink.style.display = 'inline-flex';
        signUpLink.style.display = 'inline-flex';
        // Hide user menu
        userMenu.style.display = 'none';
    }
}

function setupEventListeners() {
    // Video URL input
    if (heroVideoUrl) {
        heroVideoUrl.addEventListener('input', handleUrlInput);
        heroVideoUrl.addEventListener('paste', handleUrlPaste);
    }
    
    // Upload button
    if (heroUploadBtn) {
        heroUploadBtn.addEventListener('click', handleUploadClick);
    }
    
    // Get started button
    if (heroGetStarted) {
        heroGetStarted.addEventListener('click', handleGetStarted);
    }
    
    // Preview close
    if (previewClose) {
        previewClose.addEventListener('click', hidePreview);
    }
    
    // Process button
    if (previewProcess) {
        previewProcess.addEventListener('click', handleProcessVideo);
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

function handleUrlInput(e) {
    const url = e.target.value.trim();
    if (isValidYouTubeURL(url)) {
        debounce(fetchVideoInfo, 500)(url);
    } else if (url === '') {
        hidePreview();
    }
}

function handleUrlPaste(e) {
    setTimeout(() => {
        const url = e.target.value.trim();
        if (isValidYouTubeURL(url)) {
            fetchVideoInfo(url);
        }
    }, 100);
}

function handleUploadClick() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

function handleFileUpload(file) {
    // Validate file
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/wmv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Please select a valid video file (MP4, AVI, MOV, MKV, WMV, WEBM)', 'error');
        return;
    }
    
    if (file.size > 500 * 1024 * 1024) {
        showNotification('File size must be less than 500MB', 'error');
        return;
    }
    
    // Show preview for uploaded file
    showFilePreview(file);
}

function handleGetStarted() {
    const url = heroVideoUrl ? heroVideoUrl.value.trim() : '';
    
    console.log('Get Started clicked, URL:', url);
    
    if (url && isValidYouTubeURL(url)) {
        // Process YouTube URL
        processVideo('url', url);
    } else if (currentVideoData && currentVideoData.type === 'file') {
        // Process uploaded file
        processVideo('file', currentVideoData.file);
    } else {
        // No video data, redirect to shortener page
        console.log('No video data, redirecting to shortener');
        window.location.href = 'shortener.html';
    }
}

function processVideo(type, data) {
    console.log('Processing video:', type, data);
    
    // Check authentication first
    if (!accessToken) {
        console.log('No access token, showing auth modal');
        showAuthModal();
        return;
    }
    
    // Redirect to shortener with data
    if (type === 'url') {
        const encodedUrl = encodeURIComponent(data);
        console.log('Redirecting with URL:', encodedUrl);
        window.location.href = `shortener.html?url=${encodedUrl}`;
    } else {
        // For file uploads, redirect to shortener page
        console.log('Redirecting to shortener for file upload');
        window.location.href = 'shortener.html';
    }
}

function handleProcessVideo() {
    if (currentVideoData) {
        processVideo(currentVideoData.type, currentVideoData.data);
    }
}

async function fetchVideoInfo(url) {
    try {
        // Show loading state
        showPreviewLoading();
        
        // Extract video ID from YouTube URL
        const videoId = extractYouTubeVideoId(url);
        if (!videoId) {
            hidePreview();
            return;
        }
        
        // Fetch video info using YouTube oEmbed API
        const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        
        if (response.ok) {
            const data = await response.json();
            showVideoPreview({
                title: data.title,
                thumbnail: data.thumbnail_url,
                author: data.author_name,
                duration: 'N/A', // oEmbed doesn't provide duration
                url: url
            });
            
            currentVideoData = {
                type: 'url',
                data: url,
                info: data
            };
        } else {
            // Fallback to basic preview
            showBasicPreview(url);
        }
    } catch (error) {
        console.error('Error fetching video info:', error);
        showBasicPreview(url);
    }
}

function showVideoPreview(videoInfo) {
    if (previewImage) previewImage.src = videoInfo.thumbnail;
    if (previewVideoTitle) previewVideoTitle.textContent = videoInfo.title;
    if (previewDescription) previewDescription.textContent = `By ${videoInfo.author}`;
    if (previewDuration) previewDuration.textContent = videoInfo.duration;
    
    showPreview();
}

function showFilePreview(file) {
    if (previewVideoTitle) previewVideoTitle.textContent = file.name;
    if (previewDescription) previewDescription.textContent = `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    if (previewImage) previewImage.src = 'https://via.placeholder.com/300x169/1a1a1a/ffffff?text=Video+File';
    if (previewDuration) previewDuration.textContent = 'Unknown';
    
    currentVideoData = {
        type: 'file',
        data: file,
        file: file
    };
    
    showPreview();
}

function showBasicPreview(url) {
    if (previewVideoTitle) previewVideoTitle.textContent = 'YouTube Video';
    if (previewDescription) previewDescription.textContent = 'Video information will be loaded during processing';
    if (previewImage) previewImage.src = 'https://via.placeholder.com/300x169/1a1a1a/ffffff?text=YouTube+Video';
    if (previewDuration) previewDuration.textContent = 'Unknown';
    
    currentVideoData = {
        type: 'url',
        data: url
    };
    
    showPreview();
}

function showPreviewLoading() {
    if (previewVideoTitle) previewVideoTitle.textContent = 'Loading...';
    if (previewDescription) previewDescription.textContent = 'Fetching video information...';
    if (previewImage) previewImage.src = 'https://via.placeholder.com/300x169/1a1a1a/ffffff?text=Loading...';
    
    showPreview();
}

function showPreview() {
    if (previewCard) {
        previewCard.classList.remove('hidden');
        previewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function hidePreview() {
    if (previewCard) {
        previewCard.classList.add('hidden');
    }
    currentVideoData = null;
    if (heroVideoUrl) heroVideoUrl.value = '';
}

function isValidYouTubeURL(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
}

function extractYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function showAuthModal() {
    // Create and show authentication modal
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-modal-header">
                <h3>Sign in to continue</h3>
                <button class="auth-modal-close">&times;</button>
            </div>
            <p>Please sign in or create an account to process your video.</p>
            <div class="auth-modal-actions">
                <a href="login.html" class="auth-modal-btn primary">Sign In</a>
                <a href="register.html" class="auth-modal-btn secondary">Sign Up</a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.auth-modal-close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    currentUser = null;
    accessToken = null;
    showAuthLinks();
    console.log('User logged out');
}

function showAuthModal() {
    // Create a simple modal asking user to sign up or log in
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-modal-header">
                <h3>Sign up to continue</h3>
                <button class="auth-modal-close">&times;</button>
            </div>
            <div class="auth-modal-body">
                <p>Please sign up or log in to process your video and create clips.</p>
                <div class="auth-modal-buttons">
                    <button class="auth-modal-btn auth-modal-signup" onclick="window.location.href='register.html'">
                        Sign Up - It's FREE
                    </button>
                    <button class="auth-modal-btn auth-modal-signin" onclick="window.location.href='login.html'">
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.auth-modal-close');
    closeBtn.onclick = () => {
        document.body.removeChild(modal);
    };
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS for modals and notifications
const additionalCSS = `
.auth-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
}

.auth-modal-content {
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 1rem;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    text-align: center;
}

.auth-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.auth-modal-header h3 {
    margin: 0;
    color: var(--text-primary);
}

.auth-modal-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.auth-modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.auth-modal-btn {
    flex: 1;
    padding: 0.75rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    text-align: center;
    transition: all var(--transition-normal);
}

.auth-modal-btn.primary {
    background: linear-gradient(135deg, var(--primary-purple), var(--primary-purple-dark));
    color: white;
}

.auth-modal-btn.secondary {
    background: var(--bg-input);
    border: 2px solid var(--border-secondary);
    color: var(--text-primary);
}

.auth-modal-btn:hover {
    transform: translateY(-2px);
}

.notification {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 0.5rem;
    padding: 1rem;
    color: var(--text-primary);
    z-index: 1001;
    transform: translateX(100%);
    transition: transform var(--transition-normal);
    max-width: 300px;
}

.notification.show {
    transform: translateX(0);
}

.notification-error {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
}

.notification-success {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

