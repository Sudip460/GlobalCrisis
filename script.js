// DOM Elements
const crisisFeed = document.getElementById('crisis-feed');
const refreshBtn = document.getElementById('refresh-btn');
const alertBadge = document.getElementById('alert-badge');
const timeFilter = document.getElementById('time-filter');
const liveAlertText = document.getElementById('live-alert-text');
const navButtons = document.querySelectorAll('.nav-btn');

// Sample Crisis Data
const crisisData = [
    {
        id: 'crisis-1',
        title: 'Escalating Conflict in Sudan',
        type: 'Conflict',
        severity: 'Critical',
        location: 'Khartoum, Sudan',
        description: 'Heavy fighting reported between military factions with over 120 civilian casualties in the past 24 hours. Humanitarian access severely restricted.',
        image: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        date: '2023-06-15T14:32:00Z',
        casualties: 120,
        displaced: 15000
    },
    {
        id: 'crisis-2',
        title: 'Earthquake Hits Turkey-Syria Border',
        type: 'Natural Disaster',
        severity: 'High',
        location: 'Gaziantep, Turkey',
        description: '6.4 magnitude earthquake strikes southern Turkey near Syrian border, causing significant damage to infrastructure.',
        image: 'https://images.unsplash.com/photo-1676481040505-9d8a1b1d0e4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        date: '2023-06-14T08:15:00Z',
        casualties: 42,
        displaced: 8000
    },
    {
        id: 'crisis-3',
        title: 'Cholera Outbreak in Malawi',
        type: 'Health',
        severity: 'Medium',
        location: 'Lilongwe, Malawi',
        description: 'Health authorities report over 1,200 cholera cases in the capital region with limited medical supplies available.',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        date: '2023-06-13T19:45:00Z',
        casualties: 18,
        displaced: 0
    }
];

// Sample Alerts
const liveAlerts = [
    "Heavy fighting reported in Sudan - 120+ casualties",
    "Earthquake hits Turkey-Syria border region - 6.4 magnitude",
    "Tropical cyclone approaching Bangladesh coast - Evacuations underway"
];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    renderCrisisFeed();
    rotateLiveAlerts();
    
    // Set up event listeners
    refreshBtn.addEventListener('click', refreshData);
    alertBadge.addEventListener('click', showAlerts);
    timeFilter.addEventListener('change', filterByTime);
    navButtons.forEach(button => {
        button.addEventListener('click', () => filterByType(button.dataset.crisisType));
    });
});

// Render crisis feed
function renderCrisisFeed() {
    crisisFeed.innerHTML = crisisData.map(crisis => `
        <div class="crisis-card" onclick="window.location.href='details.html?id=${crisis.id}'">
            <div class="crisis-image" style="background-image: url('${crisis.image}')">
                <span class="crisis-badge ${crisis.severity.toLowerCase()}">${crisis.severity}</span>
            </div>
            <div class="crisis-content">
                <h3 class="crisis-title">${crisis.title}</h3>
                <div class="crisis-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${crisis.location}</span>
                    <span><i class="far fa-clock"></i> ${formatRelativeTime(crisis.date)}</span>
                </div>
                <p class="crisis-desc">${crisis.description}</p>
                <button class="view-details-btn">
                    View Details <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Format relative time
function formatRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    
    return 'Just now';
}

// Rotate live alerts
function rotateLiveAlerts() {
    let currentAlert = 0;
    setInterval(() => {
        liveAlertText.innerHTML = `<span>${liveAlerts[currentAlert]}</span>`;
        currentAlert = (currentAlert + 1) % liveAlerts.length;
    }, 5000);
}

// Refresh data
function refreshData() {
    // Simulate refresh
    refreshBtn.querySelector('i').classList.add('fa-spin');
    setTimeout(() => {
        refreshBtn.querySelector('i').classList.remove('fa-spin');
        // In a real app, you would fetch new data here
        console.log('Data refreshed');
    }, 1000);
}

// Show alerts
function showAlerts() {
    // In a real app, this would open a modal with alerts
    console.log('Showing alerts');
}

// Filter by time
function filterByTime() {
    const value = timeFilter.value;
    console.log(`Filtering by: ${value}`);
    // In a real app, you would filter the crisis data
}

// Filter by type
function filterByType(type) {
    navButtons.forEach(button => button.classList.remove('active'));
    event.target.classList.add('active');
    console.log(`Filtering by type: ${type}`);
    // In a real app, you would filter the crisis data
}