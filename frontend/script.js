

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

const elements = {
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
    editFeelingModal: document.getElementById('edit-feeling-modal'),
    editFeelingForm: document.getElementById('edit-feeling-form'),
    editFeelingId: document.getElementById('edit-feeling-id'),
    editFeelingText: document.getElementById('edit-feeling-text'),
    editMoodSelector: document.getElementById('edit-mood-selector'),
    editGratitude: document.getElementById('edit-gratitude'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    calmModeModal: document.getElementById('calm-mode-modal')
};

const API_URL = 'https://mind-mirror-backend.onrender.com/api';

let currentUser = null;
let selectedMood = null;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];

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

function setupEventListeners() {
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            showPage(pageName);
        });
    });
    function setupEventListeners() {
   


    elements.cancelEditBtn.addEventListener('click', closeEditModal);
    elements.editFeelingForm.addEventListener('submit', saveEditedFeeling);

  
    elements.editFeelingModal.addEventListener('click', (e) => {
        if (e.target === elements.editFeelingModal) {
            closeEditModal();
        }
    });
}

    forms.login.addEventListener('submit', handleLogin);
    forms.signup.addEventListener('submit', handleSignup);

    buttons.showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('signup');
    });

    buttons.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('login');
    });

    buttons.logout.addEventListener('click', handleLogout);

    elements.moodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectMood(btn.getAttribute('data-mood'));
        });
    });

    buttons.saveFeeling.addEventListener('click', saveFeeling);

    buttons.recordVoice.addEventListener('click', toggleVoiceRecording);
    buttons.recordVideo.addEventListener('click', toggleVideoRecording);

    buttons.calmMode.addEventListener('click', () => {
        elements.calmModeModal.classList.add('active');
    });

    buttons.closeCalmMode.addEventListener('click', () => {
        elements.calmModeModal.classList.remove('active');
    });
}

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
        happy: [
            "It's wonderful to see you're feeling happy! Keep spreading that positivity.",
            "Your happiness is contagious! Remember these moments when things get tough.",
            "Joy is a powerful emotion. Cherish this feeling and let it guide your day."
        ],
        sad: [
            "Take a deep breath; everything will be okay. It's okay to feel sad sometimes.",
            "I'm sorry you're feeling down. Remember that tough times don't last, but strong people do.",
            "Sadness is a part of life. Be gentle with yourself and know that brighter days are ahead."
        ],
        angry: [
            "I understand you're feeling angry. Take a moment to breathe and collect your thoughts.",
            "Anger is a natural emotion. Try channeling it into something productive or take a walk.",
            "Your feelings are valid. Consider what's causing this anger and how you can address it constructively."
        ],
        anxious: [
            "I hear you're feeling anxious. Try focusing on your breathing for a few minutes.",
            "Anxiety can be overwhelming. Remember that you've overcome challenges before and you will again.",
            "Take one moment at a time. You don't have to solve everything at once."
        ],
        excited: [
            "Your excitement is wonderful! Enjoy this feeling and let it motivate you.",
            "It's great to see you so energized! Channel this excitement into something meaningful.",
            "Excitement is a powerful emotion. Use this energy to pursue your goals."
        ],
        neutral: [
            "Sometimes feeling neutral is perfectly fine. It gives you a moment of peace.",
            "A calm state of mind can be refreshing. What would you like to do with this moment?",
            "Neutral feelings can be a good foundation. What emotion would you like to cultivate today?"
        ]
    };

    const moodResponses = responses[mood] || responses.neutral;
    const randomResponse = moodResponses[Math.floor(Math.random() * moodResponses.length)];
    
    elements.aiResponse.textContent = randomResponse;
}

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

async function toggleVoiceRecording() {
    if (isRecording === 'voice') {
        stopRecording();
        buttons.recordVoice.innerHTML = '<i class="fas fa-microphone"></i> Record Voice';
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        buttons.recordVideo.innerHTML = '<i class="fas fa-video"></i> Record Video';
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
    isRecording = false;
}

async function loadFeelingsHistory() {
    try {
        const response = await fetch(`${API_URL}/feelings`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const feelings = await response.json();
            displayFeelingsHistory(feelings);
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
document.querySelectorAll('.edit-feeling').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const feelingId = e.target.getAttribute('data-id');
        openEditModal(feelingId); 
    });
});
    
    if (feelings.length === 0) {
        elements.feelingsHistory.innerHTML = '<p>No feelings recorded yet. Start sharing on your dashboard!</p>';
        return;
    }
    
    feelings.forEach(feeling => {
        const feelingCard = document.createElement('div');
        feelingCard.className = 'feeling-card';
        
        const date = new Date(feeling.date).toLocaleDateString();
        const moodIcon = getMoodIcon(feeling.moodType);
        
        feelingCard.innerHTML = `
            <div class="feeling-header">
                <span class="feeling-date">${date}</span>
                <span class="feeling-mood">${moodIcon} ${feeling.moodType}</span>
            </div>
            <div class="feeling-text">${feeling.feelingText}</div>
            ${feeling.gratitude ? `<div class="feeling-gratitude">Grateful for: ${feeling.gratitude}</div>` : ''}
            <div class="feeling-response">${feeling.aiResponse}</div>
            <div class="feeling-actions">
                <button class="btn btn-small btn-secondary edit-feeling" data-id="${feeling._id}">Edit</button>
                <button class="btn btn-small btn-secondary delete-feeling" data-id="${feeling._id}">Delete</button>
            </div>
        `;
        
        elements.feelingsHistory.appendChild(feelingCard);
    });
    
    document.querySelectorAll('.edit-feeling').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feelingId = e.target.getAttribute('data-id');
            showNotification('Edit functionality to be implemented');
        });
    });
    
    document.querySelectorAll('.delete-feeling').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feelingId = e.target.getAttribute('data-id');
            deleteFeeling(feelingId);
        });
    });
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
            loadFeelingsHistory();
        } else {
            showNotification('Failed to delete feeling');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
    }
}

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
    const ctx = document.getElementById('mood-chart').getContext('2d');
    
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

function showNotification(message) {
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', init);

function openEditModal(feelingId) {
    const feelingCard = document.querySelector(`.edit-feeling[data-id="${feelingId}"]`).closest('.feeling-card');
    const feelingData = {
        _id: feelingId,
        feelingText: feelingCard.querySelector('.feeling-text').textContent,
        moodType: feelingCard.querySelector('.feeling-mood').textContent.trim().split(' ')[1],
        gratitude: feelingCard.querySelector('.feeling-gratitude')?.textContent.replace('Grateful for: ', '') || ''
    };

    elements.editFeelingId.value = feelingData._id;
    elements.editFeelingText.value = feelingData.feelingText;
    elements.editGratitude.value = feelingData.gratitude;

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
        btn.addEventListener('click', () => selectEditMood(mood));
        elements.editMoodSelector.appendChild(btn);
    });

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
            showNotification('Feeling updated successfully!');
            closeEditModal();
            loadFeelingsHistory(); // Refresh the history list
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || 'Failed to update feeling');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
    }
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