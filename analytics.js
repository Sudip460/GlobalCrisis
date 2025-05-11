// Analytics Dashboard Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all charts
    initCharts();
    
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
        });
    });
    
    // Initialize heatmap when heatmap section is shown
    document.querySelector('[data-view="heatmap"]').addEventListener('click', () => {
        if (!window.heatmapMap) {
            initHeatmap();
        }
    });
    
    // Export button functionality removed as per user request
});

// Show specific section
function showSection(sectionId) {
    document.querySelectorAll('.analytics-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionId}-section`).classList.add('active');
}

// Initialize all charts
function initCharts() {
    // Type Distribution Chart
    new Chart(
        document.getElementById('typeChart'),
        {
            type: 'doughnut',
            data: {
                labels: ['Conflict', 'Disaster', 'Health', 'Economic'],
                datasets: [{
                    data: [35, 25, 20, 20],
                    backgroundColor: [
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(248, 150, 30, 0.7)',
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(114, 9, 183, 0.7)'
                    ],
                    borderWidth: 0
                }]
            },
            options: getChartOptions('Crisis Type Distribution')
        }
    );
    
    // Severity Chart
    new Chart(
        document.getElementById('severityChart'),
        {
            type: 'pie',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low'],
                datasets: [{
                    data: [15, 25, 35, 25],
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
    
    // Trends Chart
    window.trendsChart = new Chart(
        document.getElementById('trendsChart'),
        {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Global Crisis Index',
                    data: [65, 59, 80, 81, 76, 72],
                    fill: true,
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    tension: 0.3
                }]
            },
            options: getChartOptions('Global Crisis Trend', true)
        }
    );
    
    // Conflict Trend Chart
    new Chart(
        document.getElementById('conflictTrendChart'),
        {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Conflict Index',
                    data: [45, 50, 65, 70, 68, 62],
                    fill: true,
                    backgroundColor: 'rgba(247, 37, 133, 0.1)',
                    borderColor: 'rgba(247, 37, 133, 1)',
                    tension: 0.3
                }]
            },
            options: getChartOptions('Conflict Trend')
        }
    );
    
    // Disaster Trend Chart
    new Chart(
        document.getElementById('disasterTrendChart'),
        {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Disaster Index',
                    data: [30, 35, 40, 38, 45, 50],
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

// Initialize heatmap
function initHeatmap() {
    // Create map
    window.heatmapMap = L.map('heatmap-container').setView([20, 0], 2);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 8,
        minZoom: 2
    }).addTo(window.heatmapMap);
    
    // Heatmap data (mock data)
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
    
    // Create heatmap layer
    L.heatLayer(heatmapData, {
        radius: 25,
        blur: 15,
        maxZoom: 7,
        max: 1.0,
        gradient: {0.4: 'blue', 0.6: 'lime', 0.8: 'red'}
    }).addTo(window.heatmapMap);
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

// Export data
function exportData() {
    // In a real app, this would export the data
    alert('Export functionality would be implemented here');
    console.log('Exporting analytics data...');
}
