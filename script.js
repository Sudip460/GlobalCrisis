// DOM Elements
const crisisFeed = document.getElementById('crisis-feed');
const refreshBtn = document.getElementById('refresh-btn');
const alertBadge = document.getElementById('alert-badge');
const timeFilter = document.getElementById('time-filter');
const liveAlertText = document.getElementById('live-alert-text');
const navButtons = document.querySelectorAll('.nav-btn');

// API Configuration
const API_KEYS = {
    CURRENTS_API: 'PSDBZLYJip4hSnvuXcqbJYqkL3_wJl50_21anNvZgq8C5yLv'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Set up event listeners
    refreshBtn.addEventListener('click', loadData);
    alertBadge.addEventListener('click', showAlerts);
    timeFilter.addEventListener('change', filterByTime);
    navButtons.forEach(button => {
        button.addEventListener('click', () => filterByType(button.dataset.crisisType));
    });
});

// Main data loader
async function loadData() {
    refreshBtn.querySelector('i').classList.add('fa-spin');
    
    try {
        const [disasters, news] = await Promise.all([
            fetchDisasters(),
            fetchCurrentsNews()
        ]);
        
        // Combine and format data to match your original structure
        const allCrises = [...disasters, ...news].map(item => ({
            id: item.id,
            title: item.title,
            type: item.type,
            severity: item.severity,
            location: item.location,
            description: item.description,
            image: item.image,
            date: item.date,
            url: item.url || '#',
            casualties: item.casualties || 0,
            displaced: item.displaced || 0
        }));
        
        renderCrisisFeed(allCrises);
        updateLiveAlerts(allCrises);
        
    } catch (error) {
        console.error("Data load error:", error);
        crisisFeed.innerHTML = '<div class="error-message">⚠️ Failed to load data. Please try again.</div>';
    } finally {
        refreshBtn.querySelector('i').classList.remove('fa-spin');
    }
}

// NASA EONET - Natural Disasters
async function fetchDisasters() {
    const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?days=30&limit=5');
    const data = await response.json();
    
    return data.events.map(event => {
        const category = event.categories[0]?.title || 'Natural Disaster';
        return {
            id: event.id,
            title: event.title,
            type: category,
            severity: getSeverity(event.categories[0]?.id),
            location: getEventLocation(event),
            description: event.description || `${category} occurring in ${getEventLocation(event)}`,
            image: getDisasterImage(event.categories[0]?.id),
            date: event.geometry[0]?.date || new Date().toISOString(),
            url: `https://eonet.gsfc.nasa.gov/api/v3/events/${event.id}`,
            casualties: estimateCasualties(event.categories[0]?.id),
            displaced: estimateDisplaced(event.categories[0]?.id)
        };
    });
}

// CurrentsAPI Implementation
async function fetchCurrentsNews() {
    const response = await fetch(
        `https://api.currentsapi.services/v1/search?keywords=conflict OR disaster OR crisis&language=en&apiKey=${API_KEYS.CURRENTS_API}`
    );
    const data = await response.json();
    
    return data.news?.map(article => ({
        id: article.id,
        title: article.title,
        type: 'News Report',
        severity: article.description.toLowerCase().includes('emergency') ? 'Critical' : 'High',
        location: article.country?.[0] || 'Global',
        description: article.description || 'Latest crisis report',
        image: article.image || getRandomNewsImage(),
        date: article.published || new Date().toISOString(),
        url: article.url,
        casualties: 0, // News API doesn't provide these
        displaced: 0   // News API doesn't provide these
    })) || [];
}

// Helper functions
function getSeverity(categoryId) {
    const criticalCategories = ['severeStorms', 'wildfires', 'volcanoes', 'earthquakes'];
    return criticalCategories.includes(categoryId) ? 'Critical' : 'High';
}

function getEventLocation(event) {
    if (event.geometry?.[0]?.coordinates) {
        return `${event.geometry[0].coordinates[1].toFixed(2)}°N, ${event.geometry[0].coordinates[0].toFixed(2)}°E`;
    }
    return 'Global';
}

function getDisasterImage(categoryId) {
    const images = {
        wildfires: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800',
        severeStorms: 'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=800',
        earthquakes: 'https://images.unsplash.com/photo-1542228262-3d663b306a53?w=800',
        floods: 'https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=800',
        volcanoes: 'https://images.unsplash.com/photo-1619266465172-02a857c3556d?w=800',
        default: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800'
    };
    return images[categoryId] || images.default;
}

function getRandomNewsImage() {
    const images = [
        'https://images.unsplash.com/photo-1589652717521-10c0d09aafd3?w=800',
        'https://images.unsplash.com/photo-1507676186452-d11cb49d0474?w=800',
        'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?w=800'
    ];
    return images[Math.floor(Math.random() * images.length)];
}

function estimateCasualties(categoryId) {
    // Simple estimation based on disaster type
    const estimates = {
        wildfires: 5,
        severeStorms: 20,
        earthquakes: 50,
        floods: 30,
        volcanoes: 10,
        default: 0
    };
    return estimates[categoryId] || estimates.default;
}

function estimateDisplaced(categoryId) {
    // Simple estimation based on disaster type
    const estimates = {
        wildfires: 1000,
        severeStorms: 5000,
        earthquakes: 10000,
        floods: 8000,
        volcanoes: 2000,
        default: 0
    };
    return estimates[categoryId] || estimates.default;
}

// Format relative time (keep your existing implementation)
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

// Render crisis feed (maintaining your original format)
function renderCrisisFeed(data) {
    crisisFeed.innerHTML = data.map(item => `
        <div class="crisis-card" onclick="window.location.href='${item.url}'">
            <div class="crisis-image" style="background-image: url('${item.image}')">
                <span class="crisis-badge ${item.severity.toLowerCase()}">${item.severity}</span>
            </div>
            <div class="crisis-content">
                <h3 class="crisis-title">${item.title}</h3>
                <div class="crisis-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${item.location}</span>
                    <span><i class="far fa-clock"></i> ${formatRelativeTime(item.date)}</span>
                </div>
                <p class="crisis-desc">${item.description}</p>
                <button class="view-details-btn">
                    View Details <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Live alerts system
function updateLiveAlerts(crises) {
    const criticalAlerts = crises.filter(crisis => crisis.severity === 'Critical');
    let currentAlert = 0;
    
    if (criticalAlerts.length > 0) {
        // Initial alert
        liveAlertText.innerHTML = `<span>${criticalAlerts[currentAlert].title} - ${criticalAlerts[currentAlert].location}</span>`;
        
        // Rotate alerts
        setInterval(() => {
            currentAlert = (currentAlert + 1) % criticalAlerts.length;
            liveAlertText.innerHTML = `<span>${criticalAlerts[currentAlert].title} - ${criticalAlerts[currentAlert].location}</span>`;
        }, 5000);
    } else {
        liveAlertText.innerHTML = '<span>No critical alerts currently</span>';
    }
    
    // Update alert badge
    alertBadge.querySelector('.alert-count').textContent = criticalAlerts.length;
}

// Filter by time (placeholder)
function filterByTime() {
    const value = timeFilter.value;
    console.log(`Filtering by: ${value}`);
    // In a real app, you would filter the crisis data
}

// Filter by type (placeholder)
function filterByType(type) {
    navButtons.forEach(button => button.classList.remove('active'));
    event.target.classList.add('active');
    console.log(`Filtering by type: ${type}`);
    // In a real app, you would filter the crisis data
}

// Show alerts (placeholder)
function showAlerts() {
    console.log('Showing alerts');
    // In a real app, this would open a modal with alerts
}