// Video Shortener JavaScript

// DOM Elements
const urlOption = document.getElementById('url-option');
const uploadOption = document.getElementById('upload-option');
const urlInputMethod = document.getElementById('url-input-method');
const fileInputMethod = document.getElementById('file-input-method');
const youtubeUrl = document.getElementById('youtube-url');
const videoFile = document.getElementById('video-file');
const uploadArea = document.getElementById('upload-area');
const processUrlBtn = document.getElementById('process-url-btn');
const processFileBtn = document.getElementById('process-file-btn');
const processingModal = document.getElementById('processing-modal');
const authRequiredModal = document.getElementById('auth-required-modal');
const processingStatus = document.getElementById('processing-status');
const resultsSection = document.getElementById('results-section');
const videoInfo = document.getElementById('video-info');
const clipsGrid = document.getElementById('clips-grid');

// Authentication elements
const navAuth = document.getElementById('nav-auth');
const signInLink = document.getElementById('sign-in-link');
const signUpLink = document.getElementById('sign-up-link');
const userMenu = document.getElementById('user-menu');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

// State
let selectedFile = null;
let currentUser = null;
let accessToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

function checkAuthStatus() {
    accessToken = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    if (accessToken && userStr) {
        currentUser = JSON.parse(userStr);
        showUserMenu();
    } else {
        showAuthLinks();
    }
}

function showUserMenu() {
    signInLink.classList.add('hidden');
    signUpLink.classList.add('hidden');
    userMenu.classList.remove('hidden');
    userName.textContent = currentUser.username;
}

function showAuthLinks() {
    signInLink.classList.remove('hidden');
    signUpLink.classList.remove('hidden');
    userMenu.classList.add('hidden');
}

function setupEventListeners() {
    // Option selection
    urlOption.addEventListener('click', () => selectOption('url'));
    uploadOption.addEventListener('click', () => selectOption('upload'));
    
    // File upload
    uploadArea.addEventListener('click', () => videoFile.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    videoFile.addEventListener('change', handleFileSelect);
    
    // Process buttons
    processUrlBtn.addEventListener('click', processYouTubeVideo);
    processFileBtn.addEventListener('click', processUploadedVideo);
    
    // Logout
    logoutBtn.addEventListener('click', logout);
}

function selectOption(option) {
    if (option === 'url') {
        urlOption.classList.add('active');
        uploadOption.classList.remove('active');
        urlInputMethod.classList.remove('hidden');
        fileInputMethod.classList.add('hidden');
    } else {
        uploadOption.classList.add('active');
        urlOption.classList.remove('active');
        fileInputMethod.classList.remove('hidden');
        urlInputMethod.classList.add('hidden');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files } });
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/wmv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid video file (MP4, AVI, MOV, MKV, WMV, WEBM)');
        return;
    }
    
    // Validate file size (500MB)
    if (file.size > 500 * 1024 * 1024) {
        alert('File size must be less than 500MB');
        return;
    }
    
    selectedFile = file;
    updateUploadArea(file);
    processFileBtn.classList.remove('hidden');
}

function updateUploadArea(file) {
    const uploadContent = uploadArea.querySelector('.upload-content');
    uploadContent.innerHTML = `
        <i class="fas fa-file-video upload-icon"></i>
        <h3>${file.name}</h3>
        <p>Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        <small>Click to select a different file</small>
    `;
}

async function processYouTubeVideo() {
    const url = youtubeUrl.value.trim();
    if (!url) {
        alert('Please enter a YouTube URL');
        return;
    }
    
    if (!isValidYouTubeURL(url)) {
        alert('Please enter a valid YouTube URL');
        return;
    }
    
    if (!accessToken) {
        showModal(authRequiredModal);
        return;
    }
    
    showProcessingModal();
    updateProcessingStep(1);
    updateProcessingStatus('Downloading video from YouTube...');
    
    try {
        const response = await fetch('/api/shortener/process-youtube', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            updateProcessingStep(2);
            updateProcessingStatus('Creating short clips...');
            
            setTimeout(() => {
                updateProcessingStep(3);
                updateProcessingStatus('Generating titles and hashtags...');
                
                setTimeout(() => {
                    hideModal(processingModal);
                    showResults(data);
                }, 2000);
            }, 2000);
        } else {
            hideModal(processingModal);
            alert(data.error || 'Failed to process video');
        }
    } catch (error) {
        hideModal(processingModal);
        alert('Network error. Please try again.');
    }
}

async function processUploadedVideo() {
    if (!selectedFile) {
        alert('Please select a video file');
        return;
    }
    
    if (!accessToken) {
        showModal(authRequiredModal);
        return;
    }
    
    showProcessingModal();
    updateProcessingStep(1);
    updateProcessingStatus('Uploading video file...');
    
    const formData = new FormData();
    formData.append('video', selectedFile);
    
    try {
        const response = await fetch('/api/shortener/upload-video', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            updateProcessingStep(2);
            updateProcessingStatus('Creating short clips...');
            
            setTimeout(() => {
                updateProcessingStep(3);
                updateProcessingStatus('Generating titles and hashtags...');
                
                setTimeout(() => {
                    hideModal(processingModal);
                    showResults(data);
                }, 2000);
            }, 2000);
        } else {
            hideModal(processingModal);
            alert(data.error || 'Failed to process video');
        }
    } catch (error) {
        hideModal(processingModal);
        alert('Network error. Please try again.');
    }
}

function showResults(data) {
    // Populate video info
    videoInfo.innerHTML = `
        <h3>${data.video.title}</h3>
        <p>Duration: ${Math.round(data.video.duration)} seconds | ${data.clips.length} clips generated</p>
    `;
    
    // Populate clips
    clipsGrid.innerHTML = data.clips.map((clip, index) => `
        <div class="clip-card">
            <div class="clip-header">
                <h4>Clip ${index + 1}</h4>
                <button class="copy-btn" onclick="copyToClipboard('${clip.title_suggestion}')">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            <div class="clip-content">
                <div class="clip-section">
                    <h5>Title Suggestion</h5>
                    <p>${clip.title_suggestion}</p>
                </div>
                <div class="clip-section">
                    <h5>Hashtags</h5>
                    <p>${JSON.parse(clip.hashtags).join(' ')}</p>
                </div>
                <div class="clip-section">
                    <h5>Description</h5>
                    <p>${clip.description}</p>
                </div>
            </div>
        </div>
    `).join('');
    
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function isValidYouTubeURL(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
}

function showModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function showProcessingModal() {
    showModal(processingModal);
}

function updateProcessingStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    const currentStep = document.getElementById(`step-${stepNumber}`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
}

function updateProcessingStatus(status) {
    processingStatus.textContent = status;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show success feedback
        const btn = event.target.closest('.copy-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
        }, 2000);
    });
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    currentUser = null;
    accessToken = null;
    showAuthLinks();
}

// Add CSS for new elements
const additionalCSS = `
.shortener-container {
    max-width: 800px;
    margin: 0 auto;
}

.upload-options {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    justify-content: center;
}

.option-card {
    background: var(--bg-card);
    border: 2px solid var(--border-primary);
    border-radius: 1rem;
    padding: 1.5rem;
    cursor: pointer;
    transition: all var(--transition-normal);
    text-align: center;
    flex: 1;
    max-width: 200px;
}

.option-card:hover {
    border-color: var(--primary-purple);
    transform: translateY(-2px);
}

.option-card.active {
    border-color: var(--primary-purple);
    background: rgba(139, 92, 246, 0.1);
}

.option-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.option-header i {
    font-size: 2rem;
    color: var(--primary-purple);
}

.option-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
}

.option-card p {
    color: var(--text-secondary);
    font-size: 0.875rem;
}

.input-method {
    margin-bottom: 2rem;
}

.upload-area {
    border: 2px dashed var(--border-primary);
    border-radius: 1rem;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-normal);
    background: var(--bg-card);
}

.upload-area:hover,
.upload-area.drag-over {
    border-color: var(--primary-purple);
    background: rgba(139, 92, 246, 0.05);
}

.upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.upload-icon {
    font-size: 3rem;
    color: var(--primary-purple);
}

.upload-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
}

.upload-content p {
    color: var(--text-secondary);
}

.upload-content small {
    color: var(--text-muted);
    font-size: 0.75rem;
}

.process-btn {
    background: linear-gradient(135deg, var(--primary-purple), var(--primary-purple-dark));
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 auto;
    box-shadow: var(--shadow-lg);
}

.process-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl), var(--shadow-glow);
}

.results-section {
    padding: 4rem 2rem;
    background: var(--bg-secondary);
}

.results-container {
    max-width: 1200px;
    margin: 0 auto;
}

.clips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.clip-card {
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
}

.clip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-primary);
}

.clip-header h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
}

.clip-section {
    margin-bottom: 1rem;
}

.clip-section h5 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--primary-purple-light);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.clip-section p {
    color: var(--text-secondary);
    line-height: 1.5;
}

.user-menu {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.user-name {
    color: var(--text-primary);
    font-weight: 500;
}

.logout-btn {
    background: var(--bg-input);
    color: var(--text-secondary);
    border: 1px solid var(--border-primary);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.logout-btn:hover {
    color: var(--text-primary);
    border-color: var(--border-secondary);
}

@media (max-width: 768px) {
    .upload-options {
        flex-direction: column;
        align-items: center;
    }
    
    .option-card {
        max-width: 300px;
    }
    
    .clips-grid {
        grid-template-columns: 1fr;
    }
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

