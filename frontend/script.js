// Global variables
let crisesData = [];
let filteredCrises = [];
let map;
let currentView = 'list';
let markers = [];
let regionPolygons = [];
let infoWindows = [];

// DOM elements
const crisisListElement = document.getElementById('crisis-list');
const filterPanel = document.getElementById('filter-panel');
const filterBtn = document.getElementById('filter-btn');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const applyFiltersBtn = document.getElementById('apply-filters');
const listViewBtn = document.getElementById('list-view-btn');
const mapViewBtn = document.getElementById('map-view-btn');
const analyticsBtn = document.getElementById('analytics-btn');
const mapView = document.getElementById('map-view');
const closeMapBtn = document.getElementById('close-map');
const detailsPanel = document.getElementById('details-panel');
const panelContent = document.getElementById('panel-content');
const closePanelBtn = document.getElementById('close-panel');
const playTimelineBtn = document.getElementById('play-timeline');
const timelineSlider = document.getElementById('timeline-slider');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadCrisesData();
    setupEventListeners();
});

// Fetch crisis data from the backend API
async function loadCrisesData() {
    try {
        showLoading();
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // In a real app, you would fetch from your backend:
        // const response = await fetch('http://localhost:8080/api/crises');
        // crisesData = await response.json();
        
        // Mock data for demonstration
        crisesData = generateMockData();
        filteredCrises = [...crisesData];
        
        renderCrisisList(filteredCrises);
        
        if (currentView === 'map') {
            initMap();
        }
    } catch (error) {
        console.error('Error loading crisis data:', error);
        showError('Failed to load crisis data. Please check your connection and try again.');
    } finally {
        hideLoading();
    }
}

// Render crisis list
function renderCrisisList(crises) {
    crisisListElement.innerHTML = '';
    
    if (crises.length === 0) {
        crisisListElement.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <p>No crises found matching your criteria</p>
                <button id="reset-filters" class="primary-btn">Reset Filters</button>
            </div>
        `;
        document.getElementById('reset-filters').addEventListener('click', resetFilters);
        return;
    }
    
    crises.forEach(crisis => {
        const crisisElement = createCrisisCard(crisis);
        crisisListElement.appendChild(crisisElement);
    });
}

// Create a crisis card element
function createCrisisCard(crisis) {
    const card = document.createElement('div');
    card.className = `crisis-card ${crisis.severity.toLowerCase()}`;
    
    const severityClass = `severity-${crisis.severity.toLowerCase()}`;
    const updatedAt = formatRelativeTime(crisis.updatedAt);
    
    card.innerHTML = `
        <div class="crisis-header">
            <h3 class="crisis-title">${crisis.title}</h3>
            <span class="crisis-type">${crisis.type}</span>
        </div>
        <div class="crisis-meta">
            <span><i class="fas fa-map-marker-alt"></i> ${crisis.location}</span>
            <span><i class="far fa-clock"></i> ${updatedAt}</span>
        </div>
        <p class="crisis-description">${crisis.description}</p>
        <div class="crisis-footer">
            <span class="crisis-severity ${severityClass}">
                <i class="fas fa-${getSeverityIcon(crisis.severity)}"></i> ${crisis.severity}
            </span>
            <button class="view-more-btn" data-id="${crisis.id}">
                Details <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
    
    card.addEventListener('click', () => {
        window.location.href = `crisis-details.html?id=${crisis.id}`;
    });
    
    return card;
}

// Get appropriate icon for severity level
function getSeverityIcon(severity) {
    const icons = {
        'critical': 'exclamation-triangle',
        'high': 'exclamation-circle',
        'medium': 'info-circle',
        'low': 'check-circle'
    };
    return icons[severity.toLowerCase()] || 'info-circle';
}

// Format relative time (e.g., "2 hours ago")
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

// Initialize Google Maps
function initMap() {
    if (typeof google === 'undefined') {
        console.error('Google Maps API not loaded');
        showError('Map functionality unavailable. Please check your connection.');
        return;
    }
    
    // Create the map with custom styling
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        styles: getProfessionalMapStyle(),
        minZoom: 2,
        maxZoom: 8,
        gestureHandling: 'cooperative'
    });

    // Load GeoJSON data for regions
    loadGeoJSONData().then(regions => {
        // Clear existing polygons
        clearMapOverlays();
        
        // Create region polygons with click handlers
        regions.features.forEach(region => {
            const regionPolygon = new google.maps.Polygon({
                paths: region.geometry.coordinates[0].map(coord => ({
                    lat: coord[1],
                    lng: coord[0]
                })),
                strokeColor: '#FFFFFF',
                strokeOpacity: 0.5,
                strokeWeight: 1,
                fillColor: getRegionColor(region.properties.crisisLevel),
                fillOpacity: 0.7,
                map: map
            });

            regionPolygons.push(regionPolygon);
            
            // Add click event to show crisis details
            regionPolygon.addListener('click', (event) => {
                showCrisisDetails(region.properties);
                
                // Highlight the clicked region
                regionPolygons.forEach(poly => {
                    poly.setOptions({
                        strokeWeight: 1,
                        fillOpacity: 0.7
                    });
                });
                
                regionPolygon.setOptions({
                    strokeWeight: 2,
                    fillOpacity: 0.9
                });
            });
        });

        // Add markers for specific crisis points
        addCrisisMarkers();
    });
}

// Clear all map overlays (markers, polygons, etc.)
function clearMapOverlays() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    regionPolygons.forEach(polygon => polygon.setMap(null));
    regionPolygons = [];
    
    infoWindows.forEach(window => window.close());
    infoWindows = [];
}

// Load GeoJSON data (example - you'd use real crisis region data)
async function loadGeoJSONData() {
    try {
        // In production, fetch from your backend:
        // const response = await fetch('/api/crisis-regions');
        // return await response.json();
        
        // Mock GeoJSON data
        return {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {
                        regionId: "ukraine",
                        name: "Ukraine",
                        crisisLevel: "critical",
                        crises: ["Russia-Ukraine War"],
                        lastUpdated: "2023-05-15",
                        casualties: 8500,
                        displaced: 8000000,
                        description: "Ongoing conflict between Russia and Ukraine since February 2022."
                    },
                    geometry: {
                        type: "Polygon",
                        coordinates: [[/* Ukraine coordinates */]]
                    }
                },
                {
                    type: "Feature",
                    properties: {
                        regionId: "syria",
                        name: "Syria",
                        crisisLevel: "high",
                        crises: ["Civil War", "Refugee Crisis"],
                        lastUpdated: "2023-04-20",
                        casualties: 350000,
                        displaced: 12000000,
                        description: "Ongoing civil war and humanitarian crisis since 2011."
                    },
                    geometry: {
                        type: "Polygon",
                        coordinates: [[/* Syria coordinates */]]
                    }
                },
                // More regions...
            ]
        };
    } catch (error) {
        console.error("Error loading GeoJSON data:", error);
        return { type: "FeatureCollection", features: [] };
    }
}

// Get color for region based on crisis level
function getRegionColor(crisisLevel) {
    const colors = {
        'critical': '#e74c3c',
        'high': '#f39c12',
        'medium': '#3498db',
        'low': '#2ecc71'
    };
    return colors[crisisLevel.toLowerCase()] || '#3498db';
}

// Show detailed crisis panel
function showCrisisDetails(regionData) {
    detailsPanel.classList.remove('hidden');
    
    panelContent.innerHTML = `
        <h3>${regionData.name}</h3>
        <div class="crisis-level ${regionData.crisisLevel}">
            ${regionData.crisisLevel.toUpperCase()} CRISIS
        </div>
        
        <div class="crisis-stats">
            <div class="stat-item">
                <div class="stat-value">${regionData.casualties.toLocaleString()}+</div>
                <div class="stat-label">Casualties</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${regionData.displaced.toLocaleString()}+</div>
                <div class="stat-label">Displaced</div>
            </div>
        </div>
        
        <div class="crisis-description">
            <h4>Overview</h4>
            <p>${regionData.description}</p>
        </div>
        
        <div class="crisis-list">
            <h4>Active Crises</h4>
            ${regionData.crises.map(crisis => `
                <div class="crisis-item">
                    <h5>${crisis}</h5>
                    <p>Last updated: ${formatDate(regionData.lastUpdated)}</p>
                </div>
            `).join('')}
        </div>
        
        <button class="primary-btn full-report-btn">
            View Full Report <i class="fas fa-arrow-right"></i>
        </button>
    `;
    
    // Add event listener for the full report button
    panelContent.querySelector('.full-report-btn').addEventListener('click', () => {
        window.location.href = `crisis-details.html?region=${regionData.regionId}`;
    });
}

// Format date (e.g., "May 15, 2023")
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Add markers for crisis points
function addCrisisMarkers() {
    filteredCrises.forEach(crisis => {
        if (crisis.latitude && crisis.longitude) {
            const marker = new google.maps.Marker({
                position: { lat: crisis.latitude, lng: crisis.longitude },
                map: map,
                icon: getMarkerIcon(crisis.severity),
                title: crisis.title
            });
            
            markers.push(marker);
            
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="map-info-window">
                        <h4>${crisis.title}</h4>
                        <p><strong>${crisis.type}</strong> in ${crisis.location}</p>
                        <p class="severity-${crisis.severity.toLowerCase()}">
                            <i class="fas fa-${getSeverityIcon(crisis.severity)}"></i> 
                            ${crisis.severity} severity
                        </p>
                        <a href="crisis-details.html?id=${crisis.id}" class="map-details-link">
                            View details <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                `
            });
            
            infoWindows.push(infoWindow);
            
            marker.addListener('click', () => {
                // Close all other info windows
                infoWindows.forEach(window => window.close());
                infoWindow.open(map, marker);
            });
        }
    });
    
    // Auto-zoom to show all markers if there are any
    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds, { padding: 50 });
    }
}

// Get appropriate marker icon based on severity
function getMarkerIcon(severity) {
    const color = {
        'critical': '#e74c3c',
        'high': '#f39c12',
        'medium': '#3498db',
        'low': '#2ecc71'
    }[severity.toLowerCase()] || '#3498db';
    
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 0.9,
        strokeColor: 'white',
        strokeWeight: 1,
        scale: 8
    };
}

// Custom map styling
function getProfessionalMapStyle() {
    return [
        {
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [{ "visibility": "off" }]
        },
        {
            "featureType": "poi",
            "stylers": [{ "visibility": "off" }]
        },
        {
            "featureType": "road",
            "stylers": [{ "visibility": "simplified" }]
        },
        {
            "featureType": "water",
            "elementType": "labels.text",
            "stylers": [{ "visibility": "off" }]
        },
        {
            "featureType": "landscape",
            "stylers": [{ "color": "#f5f5f5" }]
        },
        {
            "featureType": "administrative.country",
            "elementType": "geometry.stroke",
            "stylers": [
                { "visibility": "on" },
                { "color": "#cccccc" },
                { "weight": 0.5 }
            ]
        }
    ];
}

// Filter crises based on search and filter criteria
function filterCrises() {
    const searchTerm = searchInput.value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;
    const severityFilter = document.getElementById('severity-filter').value;
    const regionFilter = document.getElementById('region-filter').value;
    
    filteredCrises = crisesData.filter(crisis => {
        // Search term
        const matchesSearch = searchTerm === '' || 
            crisis.title.toLowerCase().includes(searchTerm) ||
            crisis.description.toLowerCase().includes(searchTerm) ||
            crisis.location.toLowerCase().includes(searchTerm);
        
        // Type filter
        const matchesType = typeFilter === 'all' || 
            crisis.type.toLowerCase() === typeFilter.toLowerCase();
        
        // Severity filter
        const matchesSeverity = severityFilter === 'all' || 
            crisis.severity.toLowerCase() === severityFilter.toLowerCase();
        
        // Region filter
        const matchesRegion = regionFilter === 'all' || 
            crisis.region.toLowerCase() === regionFilter.toLowerCase();
        
        return matchesSearch && matchesType && matchesSeverity && matchesRegion;
    });
    
    renderCrisisList(filteredCrises);
    
    if (currentView === 'map' && map) {
        clearMapOverlays();
        initMap();
    }
}

// Reset all filters
function resetFilters() {
    searchInput.value = '';
    document.getElementById('type-filter').value = 'all';
    document.getElementById('severity-filter').value = 'all';
    document.getElementById('region-filter').value = 'all';
    filterCrises();
}

// Show loading spinner
function showLoading() {
    crisisListElement.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading crisis data...</p>
        </div>
    `;
}

// Show error message
function showError(message) {
    crisisListElement.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button id="retry-btn" class="primary-btn">Retry</button>
        </div>
    `;
    
    document.getElementById('retry-btn').addEventListener('click', loadCrisesData);
}

// Set up event listeners
function setupEventListeners() {
    // Filter button
    filterBtn.addEventListener('click', () => {
        filterPanel.classList.toggle('hidden');
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        loadCrisesData();
        // Add rotation animation
        refreshBtn.querySelector('i').style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshBtn.querySelector('i').style.transform = 'rotate(0deg)';
        }, 500);
    });
    
    // Search functionality
    searchBtn.addEventListener('click', filterCrises);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filterCrises();
        }
    });
    
    // Apply filters button
    applyFiltersBtn.addEventListener('click', () => {
        filterCrises();
        filterPanel.classList.add('hidden');
    });
    
    // View buttons
    listViewBtn.addEventListener('click', () => {
        currentView = 'list';
        updateView();
    });
    
    mapViewBtn.addEventListener('click', () => {
        currentView = 'map';
        updateView();
    });
    
    analyticsBtn.addEventListener('click', () => {
        currentView = 'analytics';
        updateView();
        showComingSoon('Analytics dashboard coming soon');
    });
    
    // Close map button
    closeMapBtn.addEventListener('click', () => {
        currentView = 'list';
        updateView();
    });
    
    // Close details panel button
    closePanelBtn.addEventListener('click', () => {
        detailsPanel.classList.add('hidden');
        
        // Reset region highlighting
        regionPolygons.forEach(poly => {
            poly.setOptions({
                strokeWeight: 1,
                fillOpacity: 0.7
            });
        });
    });
    
    // Timeline controls
    playTimelineBtn.addEventListener('click', () => {
        showComingSoon('Timeline playback coming soon');
    });
    
    timelineSlider.addEventListener('input', () => {
        // Timeline functionality would be implemented here
    });
}

// Update the current view
function updateView() {
    if (currentView === 'list') {
        crisisListElement.classList.remove('hidden');
        mapView.classList.add('hidden');
        listViewBtn.classList.add('active');
        mapViewBtn.classList.remove('active');
        analyticsBtn.classList.remove('active');
    } else if (currentView === 'map') {
        crisisListElement.classList.add('hidden');
        mapView.classList.remove('hidden');
        listViewBtn.classList.remove('active');
        mapViewBtn.classList.add('active');
        analyticsBtn.classList.remove('active');
        initMap();
    } else if (currentView === 'analytics') {
        crisisListElement.classList.add('hidden');
        mapView.classList.add('hidden');
        listViewBtn.classList.remove('active');
        mapViewBtn.classList.remove('active');
        analyticsBtn.classList.add('active');
    }
}

// Show coming soon message
function showComingSoon(message) {
    crisisListElement.innerHTML = `
        <div class="no-results">
            <i class="fas fa-tools"></i>
            <p>${message}</p>
            <button id="back-to-list" class="primary-btn">Back to List</button>
        </div>
    `;
    
    document.getElementById('back-to-list').addEventListener('click', () => {
        currentView = 'list';
        updateView();
    });
}

// Generate mock data for demonstration
function generateMockData() {
    const types = ['Natural Disaster', 'Conflict', 'Health Emergency', 'Economic Crisis'];
    const severities = ['Critical', 'High', 'Medium', 'Low'];
    const regions = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
    const locations = [
        'Nairobi, Kenya', 'Kabul, Afghanistan', 'Port-au-Prince, Haiti', 
        'Kyiv, Ukraine', 'Manila, Philippines', 'Caracas, Venezuela',
        'Sanaa, Yemen', 'Mogadishu, Somalia', 'Dhaka, Bangladesh'
    ];
    
    const mockData = [];
    const now = new Date();
    
    for (let i = 1; i <= 12; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        
        // Generate random date within last 30 days
        const date = new Date(now);
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        mockData.push({
            id: `crisis-${i}`,
            title: `${type} in ${location.split(',')[0]}`,
            type,
            severity,
            region: region.toLowerCase(),
            location,
            description: `A ${type.toLowerCase()} has been reported in ${location}. ` +
                `Local authorities are responding to the situation. ` +
                `International aid may be required depending on severity.`,
            latitude: -20 + Math.random() * 70,
            longitude: -180 + Math.random() * 360,
            updatedAt: date.toISOString(),
            casualties: Math.floor(Math.random() * 1000),
            displaced: Math.floor(Math.random() * 100000)
        });
    }
    
    return mockData;
}