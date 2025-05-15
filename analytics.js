// Analytics Dashboard Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Show loading states
    document.querySelectorAll('.chart-container').forEach(container => {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'chart-loading';
        loadingEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading data...';
        container.prepend(loadingEl);
    });

    // Check if we have data from the home page
    if (window.globalCrisisData && window.globalCrisisData.allCrises.length > 0) {
        initChartsWithData(window.globalCrisisData);
    } else {
        // If no data, fetch it (for when analytics is loaded directly)
        fetchDataForAnalytics();
    }
    
    // Set up navigation
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', () => {
            const view = button.dataset.view;
            showSection(view);
            
            // Update active state
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');

            // Initialize heatmap if needed
            if (view === 'heatmap' && !window.heatmapMap) {
                initHeatmap();
            }
        });
    });
    
    // Time filter event listeners
    document.getElementById('overview-time-filter').addEventListener('change', function() {
        updateChartsWithTimeFilter(this.value);
    });
    
    document.getElementById('trend-time-range').addEventListener('change', function() {
        updateTrendCharts(this.value);
    });
    
    // Heatmap metric selector
    document.getElementById('heatmap-metric').addEventListener('change', function() {
        if (window.heatmapMap) {
            window.heatmapMap.remove();
            window.heatmapMap = null;
        }
        initHeatmap(this.value);
    });
});

async function fetchDataForAnalytics() {
    try {
        const response = await fetch('https://newsapi.org/v2/everything?q=conflict OR disaster OR crisis OR emergency OR health OR business&language=en&sortBy=publishedAt&apiKey=7be7fb1edcfe41528767920906921cea');
        const data = await response.json();

        if (data.status === 'ok') {
            window.globalCrisisData = processApiData(data.articles);
            initChartsWithData(window.globalCrisisData);
        } else {
            showError('Failed to load data from API');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        showError('Failed to connect to data service');
    }
}

function processApiData(articles) {
    const stats = {
        critical: 0,
        displaced: 0,
        countries: new Set(),
        types: {},
        severities: {},
        locations: [],
        monthlyTrends: {}
    };
    
    const allCrises = articles.map(article => {
        // Determine type
        let type = 'other';
        const lowerTitle = article.title.toLowerCase();
        const lowerDesc = article.description?.toLowerCase() || '';
        
        if (lowerTitle.includes('conflict') || lowerDesc.includes('conflict') || 
            lowerTitle.includes('war') || lowerDesc.includes('war')) {
            type = 'conflict';
        } else if (lowerTitle.includes('disaster') || lowerDesc.includes('disaster') || 
                 lowerTitle.includes('earthquake') || lowerDesc.includes('earthquake') ||
                 lowerTitle.includes('flood') || lowerDesc.includes('flood')) {
            type = 'disaster';
        } else if (lowerTitle.includes('health') || lowerDesc.includes('health') ||
                 lowerTitle.includes('virus') || lowerDesc.includes('virus') ||
                 lowerTitle.includes('pandemic') || lowerDesc.includes('pandemic')) {
            type = 'health';
        } else if (lowerTitle.includes('business') || lowerDesc.includes('business') ||
                 lowerTitle.includes('economy') || lowerDesc.includes('economy')) {
            type = 'business';
        }
        
        // Determine severity
        const severity = lowerDesc.includes('emergency') ? 'Critical' : 
                        (type === 'conflict' ? 'High' : 'Medium');
        
        // Update stats
        if (severity === 'Critical') stats.critical++;
        stats.countries.add(article.source?.name || 'Global');
        stats.types[type] = (stats.types[type] || 0) + 1;
        stats.severities[severity] = (stats.severities[severity] || 0) + 1;
        
        // Add to monthly trends
        const date = new Date(article.publishedAt || new Date());
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        if (!stats.monthlyTrends[monthYear]) {
            stats.monthlyTrends[monthYear] = 0;
        }
        stats.monthlyTrends[monthYear]++;
        
        return {
            id: article.url,
            title: article.title,
            type: type,
            severity: severity,
            location: article.source?.name || 'Global',
            description: article.description || 'Latest crisis report',
            image: article.urlToImage || 'https://images.unsplash.com/photo-1589652717521-10c0d09aafd3?w=800',
            date: article.publishedAt || new Date().toISOString(),
            url: article.url,
            casualties: 0,
            displaced: 0
        };
    });
    
    return { allCrises, stats };
}

function initChartsWithData(data) {
    // Hide loading indicators
    document.querySelectorAll('.chart-loading').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Update stats cards
    document.querySelector('.stat-card.critical .stat-value').textContent = data.stats.critical;
    document.querySelector('.stat-card.displaced .stat-value').textContent = 
        (data.stats.displaced / 1000000).toFixed(1) + 'M';
    document.querySelector('.stat-card.countries .stat-value').textContent = data.stats.countries.size;
    
    // Initialize charts
    initTypeChart(data);
    initSeverityChart(data);
    initTrendsChart(data);
    initConflictTrendChart(data);
    initDisasterTrendChart(data);
    
    // Initialize heatmap if on that section
    if (document.getElementById('heatmap-section').classList.contains('active')) {
        initHeatmap();
    }
}

function initTypeChart(data) {
    const typeLabels = Object.keys(data.stats.types);
    const typeData = Object.values(data.stats.types);
    
    new Chart(
        document.getElementById('typeChart'),
        {
            type: 'doughnut',
            data: {
                labels: typeLabels,
                datasets: [{
                    data: typeData,
                    backgroundColor: [
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(248, 150, 30, 0.7)',
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(114, 9, 183, 0.7)',
                        'rgba(67, 97, 238, 0.7)'
                    ],
                    borderWidth: 0
                }]
            },
            options: getChartOptions('Crisis Type Distribution')
        }
    );
}

function initSeverityChart(data) {
    const severityLabels = Object.keys(data.stats.severities);
    const severityData = Object.values(data.stats.severities);
    
    new Chart(
        document.getElementById('severityChart'),
        {
            type: 'pie',
            data: {
                labels: severityLabels,
                datasets: [{
                    data: severityData,
                    backgroundColor: [
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(248, 150, 30, 0.7)',
                        'rgba(67, 97, 238, 0.7)',
                        'rgba(76, 201, 240, 0.7)'
                    ],
                    borderWidth: 0
                }]
            },
            options: getChartOptions('Severity Distribution')
        }
    );
}

function initTrendsChart(data) {
    const trendLabels = Object.keys(data.stats.monthlyTrends);
    const trendData = Object.values(data.stats.monthlyTrends);
    
    window.trendsChart = new Chart(
        document.getElementById('trendsChart'),
        {
            type: 'line',
            data: {
                labels: trendLabels,
                datasets: [{
                    label: 'Global Crisis Index',
                    data: trendData,
                    fill: true,
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    tension: 0.3
                }]
            },
            options: getChartOptions('Global Crisis Trend', true)
        }
    );
}

function initConflictTrendChart(data) {
    const conflictData = filterAndGroupByMonth(data.allCrises, 'conflict');
    
    new Chart(
        document.getElementById('conflictTrendChart'),
        {
            type: 'line',
            data: {
                labels: Object.keys(conflictData),
                datasets: [{
                    label: 'Conflict Index',
                    data: Object.values(conflictData),
                    fill: true,
                    backgroundColor: 'rgba(247, 37, 133, 0.1)',
                    borderColor: 'rgba(247, 37, 133, 1)',
                    tension: 0.3
                }]
            },
            options: getChartOptions('Conflict Trend')
        }
    );
}

function initDisasterTrendChart(data) {
    const disasterData = filterAndGroupByMonth(data.allCrises, 'disaster');
    
    new Chart(
        document.getElementById('disasterTrendChart'),
        {
            type: 'line',
            data: {
                labels: Object.keys(disasterData),
                datasets: [{
                    label: 'Disaster Index',
                    data: Object.values(disasterData),
                    fill: true,
                    backgroundColor: 'rgba(248, 150, 30, 0.1)',
                    borderColor: 'rgba(248, 150, 30, 1)',
                    tension: 0.3
                }]
            },
            options: getChartOptions('Disaster Trend')
        }
    );
}

function filterAndGroupByMonth(crises, type) {
    const monthlyData = {};
    
    crises
        .filter(crisis => crisis.type === type)
        .forEach(crisis => {
            const date = new Date(crisis.date);
            const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = 0;
            }
            
            monthlyData[monthYear]++;
        });
    
    return monthlyData;
}

function initHeatmap(metric = 'intensity') {
    if (!window.globalCrisisData) return;
    
    // Create map
    window.heatmapMap = L.map('heatmap-container').setView([20, 0], 2);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 8,
        minZoom: 2
    }).addTo(window.heatmapMap);
    
    // Prepare heatmap data (using mock coordinates since NewsAPI doesn't provide them)
    const heatmapData = [
        [50.45, 30.52, 0.8],  // Kyiv, Ukraine
        [33.51, 36.30, 0.6],  // Damascus, Syria
        [15.35, 44.21, 0.7],  // Sana'a, Yemen
        [12.86, 30.22, 0.5],  // Khartoum, Sudan
        [16.80, 96.15, 0.4],  // Yangon, Myanmar
        [33.22, 43.68, 0.3],  // Fallujah, Iraq
        [34.52, 69.18, 0.5],  // Kabul, Afghanistan
        [31.95, 35.93, 0.4]   // Amman, Jordan
    ];
    
    // Adjust intensity based on selected metric
    if (metric === 'casualties') {
        heatmapData.forEach(point => point[2] = point[2] * 0.8);
    } else if (metric === 'displaced') {
        heatmapData.forEach(point => point[2] = point[2] * 0.6);
    }
    
    // Create heatmap layer
    L.heatLayer(heatmapData, {
        radius: 25,
        blur: 15,
        maxZoom: 7,
        max: 1.0,
        gradient: {0.4: 'blue', 0.6: 'lime', 0.8: 'red'}
    }).addTo(window.heatmapMap);
    
    // Update hotspot count
    document.querySelector('.stat-card.hotspots .stat-value').textContent = heatmapData.length;
}

function updateChartsWithTimeFilter(timeRange) {
    if (!window.globalCrisisData) return;
    
    const filteredData = filterDataByTime(window.globalCrisisData.allCrises, timeRange);
    const filteredStats = calculateStatsForFilteredData(filteredData);
    
    // Update type chart
    const typeChart = Chart.getChart('typeChart');
    if (typeChart) {
        typeChart.data.labels = Object.keys(filteredStats.types);
        typeChart.data.datasets[0].data = Object.values(filteredStats.types);
        typeChart.update();
    }
    
    // Update severity chart
    const severityChart = Chart.getChart('severityChart');
    if (severityChart) {
        severityChart.data.labels = Object.keys(filteredStats.severities);
        severityChart.data.datasets[0].data = Object.values(filteredStats.severities);
        severityChart.update();
    }
    
    // Update stats cards
    document.querySelector('.stat-card.critical .stat-value').textContent = filteredStats.critical;
    document.querySelector('.stat-card.displaced .stat-value').textContent = 
        (filteredStats.displaced / 1000000).toFixed(1) + 'M';
    document.querySelector('.stat-card.countries .stat-value').textContent = filteredStats.countries.size;
}

function updateTrendCharts(timeRange) {
    if (!window.globalCrisisData) return;
    
    const filteredData = filterDataByTime(window.globalCrisisData.allCrises, timeRange);
    const monthlyTrends = groupDataByMonth(filteredData);
    const conflictTrends = filterAndGroupByMonth(filteredData, 'conflict');
    const disasterTrends = filterAndGroupByMonth(filteredData, 'disaster');
    
    // Update trends chart
    const trendsChart = Chart.getChart('trendsChart');
    if (trendsChart) {
        trendsChart.data.labels = Object.keys(monthlyTrends);
        trendsChart.data.datasets[0].data = Object.values(monthlyTrends);
        trendsChart.update();
    }
    
    // Update conflict trend chart
    const conflictChart = Chart.getChart('conflictTrendChart');
    if (conflictChart) {
        conflictChart.data.labels = Object.keys(conflictTrends);
        conflictChart.data.datasets[0].data = Object.values(conflictTrends);
        conflictChart.update();
    }
    
    // Update disaster trend chart
    const disasterChart = Chart.getChart('disasterTrendChart');
    if (disasterChart) {
        disasterChart.data.labels = Object.keys(disasterTrends);
        disasterChart.data.datasets[0].data = Object.values(disasterTrends);
        disasterChart.update();
    }
}

function filterDataByTime(data, timeRange) {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch(timeRange) {
        case '7d':
            cutoffDate.setDate(now.getDate() - 7);
            break;
        case '30d':
            cutoffDate.setDate(now.getDate() - 30);
            break;
        case '90d':
            cutoffDate.setDate(now.getDate() - 90);
            break;
        case '1y':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            return data;
    }
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
}

function calculateStatsForFilteredData(data) {
    const stats = {
        critical: 0,
        displaced: 0,
        countries: new Set(),
        types: {},
        severities: {},
        locations: []
    };
    
    data.forEach(item => {
        if (item.severity === 'Critical') stats.critical++;
        if (item.displaced) stats.displaced += item.displaced;
        stats.countries.add(item.location);
        
        stats.types[item.type] = (stats.types[item.type] || 0) + 1;
        stats.severities[item.severity] = (stats.severities[item.severity] || 0) + 1;
    });
    
    return stats;
}

function groupDataByMonth(data) {
    const monthlyData = {};
    
    data.forEach(item => {
        const date = new Date(item.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
        }
        
        monthlyData[monthYear]++;
    });
    
    return monthlyData;
}

function showSection(sectionId) {
    document.querySelectorAll('.analytics-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionId}-section`).classList.add('active');
}

function showError(message) {
    document.querySelectorAll('.chart-loading').forEach(el => {
        el.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    });
}

// Chart options generator
function getChartOptions(title, showLegend = false) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: showLegend,
                position: 'top',
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)'
                }
            },
            title: {
                display: !!title,
                text: title,
                color: 'rgba(255, 255, 255, 0.9)',
                font: {
                    size: 14
                }
            }
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            },
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            }
        }
    };
}