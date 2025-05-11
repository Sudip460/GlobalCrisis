// DOM Elements
const crisisFeed = document.getElementById('crisis-feed');
const refreshBtn = document.getElementById('refresh-btn');
const alertBadge = document.getElementById('alert-badge');
const timeFilter = document.getElementById('time-filter');
const liveAlertText = document.getElementById('live-alert-text');
const navButtons = document.querySelectorAll('.nav-btn');

// API Configuration
const NEWS_API_KEY = '7be7fb1edcfe41528767920906921cea'; 

// Global variables for data and filters
let allCrisesData = [];
let currentFilter = 'all';
let currentTimeFilter = 'all';
let alertInterval = null;
let currentAlert = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Set up event listeners
    refreshBtn.addEventListener('click', loadData);
    alertBadge.addEventListener('click', showAlerts);
    timeFilter.addEventListener('change', () => {
        currentTimeFilter = timeFilter.value;
        filterByTime();
    });
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.crisisType;
            filterByType(currentFilter);
        });
    });

    // Add event listener for live alert refresh button
    const refreshAlertBtn = document.getElementById('refresh-alert-btn');
    if (refreshAlertBtn) {
        refreshAlertBtn.addEventListener('click', async () => {
            if (alertInterval) {
                clearInterval(alertInterval);
                alertInterval = null;
            }
            refreshAlertBtn.disabled = true;
            refreshAlertBtn.querySelector('i').classList.add('fa-spin');
            try {
                await loadData();
            } catch (error) {
                console.error('Error refreshing live alerts:', error);
            } finally {
                refreshAlertBtn.disabled = false;
                refreshAlertBtn.querySelector('i').classList.remove('fa-spin');
            }
            // Restart interval
            alertInterval = setInterval(showNextCriticalAlert, 2000);
        });
    }
});

// Main data loader
async function loadData() {
    refreshBtn.querySelector('i').classList.add('fa-spin');
    
    try {
        const news = await fetchNewsAPI();
        // Assuming disasters data is available or empty array if not
        const disasters = []; // Placeholder for disasters data source
        
        allCrisesData = [...disasters, ...news].map(item => {
            // Determine type dynamically for news articles
            let type = 'other';
            if (item.title && item.description) {
                const lowerTitle = item.title.toLowerCase();
                const lowerDesc = item.description.toLowerCase();
                if (lowerTitle.includes('conflict') || lowerDesc.includes('conflict') || 
                    lowerTitle.includes('war') || lowerDesc.includes('war')) {
                    type = 'conflict';
                } else if (lowerTitle.includes('disaster') || lowerDesc.includes('disaster') || 
                           lowerTitle.includes('earthquake') || lowerDesc.includes('earthquake') ||
                           lowerTitle.includes('flood') || lowerDesc.includes('flood')) {
                    type = 'disaster';
                } else if (lowerTitle.includes('health') || lowerDesc.includes('health') ||
                           lowerTitle.includes('virus') || lowerDesc.includes('virus') ||
                           lowerTitle.includes('pandemic') || lowerDesc.includes('pandemic') ||
                           lowerTitle.includes('disease') || lowerDesc.includes('disease') ||
                           lowerTitle.includes('covid') || lowerDesc.includes('covid')) {
                    type = 'health';
                } else if (lowerTitle.includes('business') || lowerDesc.includes('business') ||
                           lowerTitle.includes('economy') || lowerDesc.includes('economy') ||
                           lowerTitle.includes('market') || lowerDesc.includes('market') ||
                           lowerTitle.includes('finance') || lowerDesc.includes('finance') ||
                           lowerTitle.includes('stock') || lowerDesc.includes('stock')) {
                    type = 'business';
                } else if (lowerTitle.includes('crisis') || lowerDesc.includes('crisis')) {
                    type = 'crisis';
                } else if (lowerTitle.includes('emergency') || lowerDesc.includes('emergency')) {
                    type = 'emergency';
                }
            } else if (item.type) {
                type = item.type.toLowerCase();
            }
            
            return {
                ...item,
                type: type.toLowerCase(),
                severity: item.severity || 'Low',
                casualties: item.casualties || 0,
                displaced: item.displaced || 0,
                url: item.url || '#'
            };
        });
        
        filterByTime(); // Apply filters and render
        
        updateLiveAlerts(allCrisesData);
        
    } catch (error) {
        console.error("Data load error:", error);
        crisisFeed.innerHTML = '<div class="error-message">⚠️ Failed to load data. Please try again.</div>';
    } finally {
        refreshBtn.querySelector('i').classList.remove('fa-spin');
    }
}

// Fetch recent news using NewsAPI
async function fetchNewsAPI() {
    const url = `https://newsapi.org/v2/everything?q=conflict OR disaster OR crisis OR emergency OR health OR business&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ok') {
            return data.articles.map(article => ({
                id: article.url, // Use the URL as a unique ID
                title: article.title,
                type: 'News Report',
                severity: article.description?.toLowerCase().includes('emergency') ? 'Critical' : 'High',
                location: article.source.name || 'Global',
                description: article.description || 'Latest crisis report',
                image: article.urlToImage || getRandomNewsImage(),
                date: article.publishedAt || new Date().toISOString(),
                url: article.url,
                casualties: 0, // NewsAPI doesn't provide these
                displaced: 0   // NewsAPI doesn't provide these
            }));
        } else {
            console.error('NewsAPI error:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Failed to fetch news from NewsAPI:', error);
        return [];
    }
}

// Helper functions
function getRandomNewsImage() {
    const images = [
        'https://images.unsplash.com/photo-1589652717521-10c0d09aafd3?w=800',
        'https://images.unsplash.com/photo-1507676186452-d11cb49d0474?w=800',
        'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?w=800'
    ];
    return images[Math.floor(Math.random() * images.length)];
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

function updateLiveAlerts(crises) {
    const criticalAlerts = crises.filter(crisis => crisis.severity.toLowerCase() === 'critical');
    
    if (alertInterval) {
        clearInterval(alertInterval);
        alertInterval = null;
    }
    
    if (criticalAlerts.length > 0) {
        currentAlert = 0;
        liveAlertText.innerHTML = `<span>${criticalAlerts[currentAlert].title} - ${criticalAlerts[currentAlert].location}</span>`;
        alertBadge.querySelector('.alert-count').textContent = criticalAlerts.length;
        alertBadge.style.display = 'flex';  // Show when alerts exist
        
        alertInterval = setInterval(showNextCriticalAlert, 2000);
    } else {
        liveAlertText.innerHTML = '<span>No critical alerts currently</span>';
        alertBadge.style.display = 'none';  // Hide when no alerts
    }

    function showNextCriticalAlert() {
        currentAlert = (currentAlert + 1) % criticalAlerts.length;
        liveAlertText.innerHTML = `<span>${criticalAlerts[currentAlert].title} - ${criticalAlerts[currentAlert].location}</span>`;
    }
}

// Filter by time
function filterByTime() {
    let filteredData = allCrisesData;
    const now = new Date();
    
    if (currentTimeFilter === '24h') {
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.date);
            return (now - itemDate) <= 24 * 60 * 60 * 1000;
        });
    } else if (currentTimeFilter === '7d') {
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.date);
            return (now - itemDate) <= 7 * 24 * 60 * 60 * 1000;
        });
    } else if (currentTimeFilter === '30d') {
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.date);
            return (now - itemDate) <= 30 * 24 * 60 * 60 * 1000;
        });
    }
    
    filterByType(currentFilter, filteredData);
}

// Filter by type
function filterByType(type, data = allCrisesData) {
    let filteredData = data;
    
    if (type !== 'all') {
        filteredData = data.filter(crisis => crisis.type === type);
    }
    
    renderCrisisFeed(filteredData);
}

// Show alerts (placeholder)
function showAlerts() {
    console.log('Showing alerts');
    // In a real app, this would open a modal with alerts
}