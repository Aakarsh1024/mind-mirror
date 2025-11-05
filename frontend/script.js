// DOM Elements
const pages = {
    login: document.getElementById('login-page'),
    signup: document.getElementById('signup-page'),
    dashboard: document.getElementById('dashboard-page'),
    history: document.getElementById('history-page'),
    profile: document.getElementById('profile-page')
};

const forms = {
    login: document.getElementById('login-form'),
    signup: document.getElementById('signup-form')
};

const buttons = {
    showSignup: document.getElementById('show-signup'),
    showLogin: document.getElementById('show-login'),
    logout: document.getElementById('logout-btn'),
    saveFeeling: document.getElementById('save-feeling-btn'),
    recordVoice: document.getElementById('record-voice-btn'),
    recordVideo: document.getElementById('record-video-btn'),
    calmMode: document.getElementById('calm-mode-btn'),
    closeCalmMode: document.getElementById('close-calm-mode')
};

// Consolidated all elements into one object for clarity
const elements = {
    // Edit Modal Elements
    editFeelingModal: document.getElementById('edit-feeling-modal'),
    editFeelingForm: document.getElementById('edit-feeling-form'),
    editFeelingId: document.getElementById('edit-feeling-id'),
    editFeelingText: document.getElementById('edit-feeling-text'),
    editMoodSelector: document.getElementById('edit-mood-selector'),
    editGratitude: document.getElementById('edit-gratitude'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),

    // Recording Preview Elements
    videoPreviewModal: document.getElementById('video-preview-modal'),
    audioPreviewModal: document.getElementById('audio-preview-modal'),
    liveVideoPreview: document.getElementById('live-video-preview'),
    stopVideoPreviewBtn: document.getElementById('stop-video-preview-btn'),
    stopAudioPreviewBtn: document.getElementById('stop-audio-preview-btn'),

    // History Filter Elements
    dateFilter: document.getElementById('date-filter'),
    clearFilterBtn: document.getElementById('clear-filter-btn'),

    // General App Elements
    navLinks: document.querySelectorAll('.nav-link'),
    moodButtons: document.querySelectorAll('.mood-btn'),
    feelingText: document.getElementById('feeling-text'),
    gratitudeInput: document.getElementById('gratitude-input'),
    aiResponse: document.getElementById('ai-response'),
    dailyQuote: document.getElementById('daily-quote'),
    feelingsHistory: document.getElementById('feelings-history'),
    profileUsername: document.getElementById('profile-username'),
    profileEmail: document.getElementById('profile-email'),
    profileDate: document.getElementById('profile-date'),
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message'),
    calmModeModal: document.getElementById('calm-mode-modal')
};

// API Base URL
const API_URL = 'https://mind-mirror-backend.onrender.com/api';

// State
let currentUser = null;
let selectedMood = null;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let allFeelings = []; // Global array for all feelings, used for filtering

// Daily Quotes
const dailyQuotes = [
    "The only way out is through. - Robert Frost",
    "You are braver than you believe, stronger than you seem, and smarter than you think. - A.A. Milne",
    "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
    "Your limitation—it's only your imagination.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Don't stop when you're tired. Stop when you're done.",
    "Wake up with determination. Go to bed with satisfaction."
];

// Initialize App
function init() {
    const token = localStorage.getItem('token');
    if (token) {
        fetchUserProfile(token);
    } else {
        showPage('login');
    }

    setupEventListeners();
    loadDailyQuote();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            showPage(pageName);
        });
    });

    // Edit Modal Listeners
    elements.cancelEditBtn.addEventListener('click', closeEditModal);
    elements.editFeelingForm.addEventListener('submit', saveEditedFeeling);
    elements.editFeelingModal.addEventListener('click', (e) => {
        if (e.target === elements.editFeelingModal) {
            closeEditModal();
        }
    });

    // Auth forms
    forms.login.addEventListener('submit', handleLogin);
    forms.signup.addEventListener('submit', handleSignup);

    // Auth switches
    buttons.showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('signup');
    });

    buttons.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('login');
    });

    // Logout
    buttons.logout.addEventListener('click', handleLogout);

    // Mood selection
    elements.moodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectMood(btn.getAttribute('data-mood'));
        });
    });

    // Save feeling
    buttons.saveFeeling.addEventListener('click', saveFeeling);

    // Media recording
    buttons.recordVoice.addEventListener('click', toggleVoiceRecording);
    buttons.recordVideo.addEventListener('click', toggleVideoRecording);

    // Recording preview stop buttons
    elements.stopVideoPreviewBtn.addEventListener('click', () => {
        stopRecording();
        elements.videoPreviewModal.classList.remove('active');
        buttons.recordVideo.innerHTML = '<i class="fas fa-video"></i> Record Video';
    });
    elements.stopAudioPreviewBtn.addEventListener('click', () => {
        stopRecording();
        elements.audioPreviewModal.classList.remove('active');
        buttons.recordVoice.innerHTML = '<i class="fas fa-microphone"></i> Record Voice';
    });

    // Calm mode
    buttons.calmMode.addEventListener('click', () => {
        elements.calmModeModal.classList.add('active');
    });

    buttons.closeCalmMode.addEventListener('click', () => {
        elements.calmModeModal.classList.remove('active');
    });

    // History Filter Listeners
    elements.dateFilter.addEventListener('change', filterFeelingsByDate);
    elements.clearFilterBtn.addEventListener('click', () => {
        elements.dateFilter.value = '';
        displayFeelingsHistory(allFeelings); // Display all feelings again
    });
}

// Page Navigation
function showPage(pageName) {
    Object.values(pages).forEach(page => {
        page.classList.remove('active');
    });

    if (pages[pageName]) {
        pages[pageName].classList.add('active');
    }

    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });

    if (pageName === 'history' && currentUser) {
        loadFeelingsHistory();
    } else if (pageName === 'dashboard' && currentUser) {
        loadMoodChart();
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data;
            showNotification('Login successful!');
            showPage('dashboard');
            updateProfileUI();
            loadMoodChart();
        } else {
            showNotification(data.message || 'Login failed');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data;
            showNotification('Registration successful!');
            showPage('dashboard');
            updateProfileUI();
            loadMoodChart();
        } else {
            showNotification(data.message || 'Registration failed');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    showPage('login');
    showNotification('Logged out successfully');
}

async function fetchUserProfile(token) {
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            showPage('dashboard');
            updateProfileUI();
            loadMoodChart();
        } else {
            localStorage.removeItem('token');
            showPage('login');
        }
    } catch (error) {
        localStorage.removeItem('token');
        showPage('login');
        console.error(error);
    }
}

function updateProfileUI() {
    if (currentUser) {
        elements.profileUsername.textContent = currentUser.username;
        elements.profileEmail.textContent = currentUser.email;
        elements.profileDate.textContent = new Date(currentUser.date).toLocaleDateString();
    }
}

// Mood Selection & AI Response
function selectMood(mood) {
    selectedMood = mood;
    
    elements.moodButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-mood') === mood) {
            btn.classList.add('selected');
        }
    });
    
    generateAIResponse(mood);
}

function generateAIResponse(mood) {
    const responses = {
        happy: ["It's wonderful to see you're feeling happy!", "Your happiness is contagious!", "Joy is a powerful emotion."],
        sad: ["Take a deep breath; everything will be okay.", "I'm sorry you're feeling down.", "Sadness is a part of life."],
        angry: ["I understand you're feeling angry.", "Anger is a natural emotion.", "Your feelings are valid."],
        anxious: ["I hear you're feeling anxious.", "Anxiety can be overwhelming.", "Take one moment at a time."],
        excited: ["Your excitement is wonderful!", "It's great to see you so energized!", "Excitement is a powerful emotion."],
        neutral: ["Sometimes feeling neutral is perfectly fine.", "A calm state of mind can be refreshing.", "Neutral feelings can be a good foundation."]
    };
    const moodResponses = responses[mood] || responses.neutral;
    const randomResponse = moodResponses[Math.floor(Math.random() * moodResponses.length)];
    elements.aiResponse.textContent = randomResponse;
}

// Save Feeling
async function saveFeeling() {
    if (!selectedMood) {
        showNotification('Please select your mood');
        return;
    }

    const feelingText = elements.feelingText.value.trim();
    if (!feelingText) {
        showNotification('Please share your feelings');
        return;
    }

    const gratitude = elements.gratitudeInput.value.trim();

    try {
        const formData = new FormData();
        formData.append('feelingText', feelingText);
        formData.append('moodType', selectedMood);
        if (gratitude) {
            formData.append('gratitude', gratitude);
        }

        if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'media/webm' });
            formData.append(isRecording === 'voice' ? 'voice' : 'video', blob);
        }

        const response = await fetch(`${API_URL}/feelings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Feeling saved successfully!');
            elements.aiResponse.textContent = data.aiResponse;
            elements.feelingText.value = '';
            elements.gratitudeInput.value = '';
            selectedMood = null;
            elements.moodButtons.forEach(btn => btn.classList.remove('selected'));
            recordedChunks = [];
            loadMoodChart();
        } else {
            showNotification(data.message || 'Failed to save feeling');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
    }
}

// Recording Functions
async function toggleVoiceRecording() {
    if (isRecording === 'voice') {
        stopRecording();
        elements.audioPreviewModal.classList.remove('active');
        buttons.recordVoice.innerHTML = '<i class="fas fa-microphone"></i> Record Voice';
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            elements.audioPreviewModal.classList.add('active');
            startRecording(stream, 'voice');
            buttons.recordVoice.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
        } catch (error) {
            showNotification('Could not access microphone');
            console.error(error);
        }
    }
}

async function toggleVideoRecording() {
    if (isRecording === 'video') {
        stopRecording();
        elements.liveVideoPreview.srcObject = null; // Stop the video stream
        elements.videoPreviewModal.classList.remove('active');
        buttons.recordVideo.innerHTML = '<i class="fas fa-video"></i> Record Video';
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            elements.liveVideoPreview.srcObject = stream; // Show live video
            elements.videoPreviewModal.classList.add('active');
            startRecording(stream, 'video');
            buttons.recordVideo.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
        } catch (error) {
            showNotification('Could not access camera');
            console.error(error);
        }
    }
}

function startRecording(stream, type) {
    isRecording = type;
    recordedChunks = [];
    
    const options = {
        mimeType: type === 'video' ? 'video/webm' : 'audio/webm'
    };
    
    try {
        mediaRecorder = new MediaRecorder(stream, options);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
    } catch (error) {
        showNotification('Recording not supported in this browser');
        console.error(error);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    // Stop all tracks on the stream to turn off the camera/mic
    if (elements.liveVideoPreview.srcObject) {
        elements.liveVideoPreview.srcObject.getTracks().forEach(track => track.stop());
        elements.liveVideoPreview.srcObject = null;
    }
    isRecording = false;
}

// History Functions
async function loadFeelingsHistory() {
    try {
        const response = await fetch(`${API_URL}/feelings`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const feelings = await response.json();
            allFeelings = feelings; // Store all feelings globally
            displayFeelingsHistory(allFeelings); // Display all initially
        } else {
            showNotification('Failed to load feelings history');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
    }
}

function displayFeelingsHistory(feelings) {
    elements.feelingsHistory.innerHTML = '';
    
    if (feelings.length === 0) {
        elements.feelingsHistory.innerHTML = '<p>No feelings recorded yet. Start sharing on your dashboard!</p>';
        return;
    }
    
    feelings.forEach(feeling => {
        const feelingCard = document.createElement('div');
        feelingCard.className = 'feeling-card';
        
        const date = new Date(feeling.date).toLocaleDateString();
        const moodIcon = getMoodIcon(feeling.moodType);
        
        // Construct media HTML for playback
        let mediaHTML = '';
        if (feeling.voiceLink) {
            mediaHTML += `<audio controls src="${API_URL.replace('/api', '')}${feeling.voiceLink}" type="audio/webm"></audio>`;
        }
        if (feeling.videoLink) {
            mediaHTML += `<video controls src="${API_URL.replace('/api', '')}${feeling.videoLink}" type="video/webm" width="100%" style="border-radius: 8px; margin-top: 1rem;"></video>`;
        }
        
        feelingCard.innerHTML = `
            <div class="feeling-header">
                <span class="feeling-date">${date}</span>
                <span class="feeling-mood">${moodIcon} ${feeling.moodType}</span>
            </div>
            <div class="feeling-text">${feeling.feelingText}</div>
            ${feeling.gratitude ? `<div class="feeling-gratitude">Grateful for: ${feeling.gratitude}</div>` : ''}
            <div class="feeling-response">${feeling.aiResponse}</div>
            ${mediaHTML}
            <div class="feeling-actions">
                <button class="btn btn-small btn-secondary edit-feeling" data-id="${feeling._id}">Edit</button>
                <button class="btn btn-small btn-secondary delete-feeling" data-id="${feeling._id}">Delete</button>
            </div>
        `;
        
        elements.feelingsHistory.appendChild(feelingCard);
    });
    
    // Add event listeners to the newly created buttons
    document.querySelectorAll('.edit-feeling').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feelingId = e.target.getAttribute('data-id');
            // Find the full feeling object from our original global array
            const feelingData = allFeelings.find(f => f._id === feelingId);
            if (feelingData) {
                openEditModal(feelingData); // Pass the entire data object
            }
        });
    });
    
    document.querySelectorAll('.delete-feeling').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feelingId = e.target.getAttribute('data-id');
            deleteFeeling(feelingId);
        });
    });
}

function filterFeelingsByDate() {
    const selectedDate = elements.dateFilter.value;
    if (!selectedDate) {
        displayFeelingsHistory(allFeelings);
        return;
    }

    const filteredFeelings = allFeelings.filter(feeling => {
        // Convert feeling date to YYYY-MM-DD format to match input
        const feelingDate = new Date(feeling.date).toISOString().split('T')[0];
        return feelingDate === selectedDate;
    });

    displayFeelingsHistory(filteredFeelings);
}

// Edit Functions
function openEditModal(feelingData) {
    // Populate the form using the passed data object
    elements.editFeelingId.value = feelingData._id;
    elements.editFeelingText.value = feelingData.feelingText;
    elements.editGratitude.value = feelingData.gratitude || '';

    // Populate mood selector
    elements.editMoodSelector.innerHTML = ''; 
    const moods = ['happy', 'sad', 'angry', 'anxious', 'excited', 'neutral'];
    moods.forEach(mood => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mood-btn';
        btn.dataset.mood = mood;
        btn.innerHTML = `<i class="fas ${getMoodIconClass(mood)}"></i><span>${mood}</span>`;
        if (mood === feelingData.moodType) {
            btn.classList.add('selected');
        }
        // Add a new event listener for mood selection within the modal
        btn.addEventListener('click', () => selectEditMood(mood));
        elements.editMoodSelector.appendChild(btn);
    });

    // Show the modal
    elements.editFeelingModal.classList.add('active');
}

function closeEditModal() {
    elements.editFeelingModal.classList.remove('active');
    elements.editFeelingForm.reset();
}

function selectEditMood(mood) {
    document.querySelectorAll('#edit-mood-selector .mood-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.mood === mood) {
            btn.classList.add('selected');
        }
    });
}

async function saveEditedFeeling(e) {
    e.preventDefault();
    
    const feelingId = elements.editFeelingId.value;
    const feelingText = elements.editFeelingText.value;
    const gratitude = elements.editGratitude.value;
    const moodType = document.querySelector('#edit-mood-selector .mood-btn.selected')?.dataset.mood;

    if (!moodType) {
        showNotification('Please select a mood');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/feelings/${feelingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ feelingText, moodType, gratitude })
        });

        if (response.ok) {
            const updatedData = await response.json();
            showNotification('Feeling updated successfully!');
            closeEditModal();
            
            // Call the function to update the page directly without a full reload
            updateFeelingInHistory(updatedData);

        } else {
            const errorData = await response.json();
            showNotification(errorData.message || 'Failed to update feeling');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
    }
}

function updateFeelingInHistory(updatedData) {
    // Find the feeling card on the page that matches the updated ID
    const feelingCard = document.querySelector(`.edit-feeling[data-id="${updatedData._id}"]`).closest('.feeling-card');

    if (feelingCard) {
        // Update the text content directly
        feelingCard.querySelector('.feeling-text').textContent = updatedData.feelingText;
        
        // Update the gratitude section
        const gratitudeElement = feelingCard.querySelector('.feeling-gratitude');
        if (updatedData.gratitude) {
            if (gratitudeElement) {
                gratitudeElement.textContent = `Grateful for: ${updatedData.gratitude}`;
            } else {
                // If it didn't exist before, create it
                const newGratitudeDiv = document.createElement('div');
                newGratitudeDiv.className = 'feeling-gratitude';
                newGratitudeDiv.textContent = `Grateful for: ${updatedData.gratitude}`;
                feelingCard.insertBefore(newGratitudeDiv, feelingCard.querySelector('.feeling-response'));
            }
        } else if (gratitudeElement) {
            // If gratitude was removed, delete the element
            gratitudeElement.remove();
        }

        // Update the mood
        const moodIcon = getMoodIcon(updatedData.moodType);
        feelingCard.querySelector('.feeling-mood').innerHTML = `${moodIcon} ${updatedData.moodType}`;

        // Update the AI response
        feelingCard.querySelector('.feeling-response').textContent = updatedData.aiResponse;
    }
}

async function deleteFeeling(feelingId) {
    if (!confirm('Are you sure you want to delete this feeling?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/feelings/${feelingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showNotification('Feeling deleted successfully');
            loadFeelingsHistory(); // Reload the entire history to reflect the deletion
        } else {
            showNotification('Failed to delete feeling');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
    }
}

// Chart & Other UI Functions
let moodChart = null;

async function loadMoodChart() {
    try {
        const response = await fetch(`${API_URL}/feelings/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            displayMoodChart(stats);
        } else {
            showNotification('Failed to load mood statistics');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
    }
}

function displayMoodChart(stats) {
    const ctx = document.getElementById('mood-chart')?.getContext('2d');
    if (!ctx) return; // Exit if chart element is not on the page

    if (moodChart) {
        moodChart.destroy();
    }
    
    const moodCounts = {};
    stats.moodCounts.forEach(item => {
        moodCounts[item._id] = item.count;
    });
    
    const labels = Object.keys(moodCounts);
    const data = Object.values(moodCounts);
    
    moodChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FFD166', 
                    '#118AB2', 
                    '#EF476F', 
                    '#073B4C', 
                    '#06D6A0', 
                    '#F4F1DE'  
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 15
                    }
                }
            }
        }
    });
}

function loadDailyQuote() {
    const today = new Date().toDateString();
    const savedQuoteDate = localStorage.getItem('quoteDate');
    
    if (savedQuoteDate === today) {
        elements.dailyQuote.textContent = localStorage.getItem('dailyQuote');
    } else {
        const randomQuote = dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)];
        elements.dailyQuote.textContent = randomQuote;
        localStorage.setItem('dailyQuote', randomQuote);
        localStorage.setItem('quoteDate', today);
    }
}

// Helper Functions
function getMoodIcon(mood) {
    const icons = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        anxious: '😰',
        excited: '🤗',
        neutral: '😐'
    };
    return icons[mood] || '😐';
}

function getMoodIconClass(mood) {
    const icons = {
        happy: 'fa-smile',
        sad: 'fa-sad-tear',
        angry: 'fa-angry',
        anxious: 'fa-worried',
        excited: 'fa-laugh-beam',
        neutral: 'fa-meh'
    };
    return icons[mood] || 'fa-meh';
}

function showNotification(message) {
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}


document.addEventListener('DOMContentLoaded', init);