// Storage key constants
const STORAGE_KEYS = {
    WUKONG: 'wukong_ratings',
    SEKIRO: 'sekiro_ratings'
};

let comparisonRadarChart = null;
let comparisonBarChart = null;

// Counter class
class RatingsCounter {
    constructor() {
        this.count = 0;
        this.init();
    }

    init() {
        // Get existing data count from localStorage
        const wukongData = JSON.parse(localStorage.getItem(STORAGE_KEYS.WUKONG) || '[]');
        const sekiroData = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEKIRO) || '[]');
        this.count = Math.floor((wukongData.length + sekiroData.length) / 2);
        this.updateDisplay();
    }

    updateDisplay() {
        document.getElementById('totalCount').textContent = this.count;
    }

    increment() {
        this.count++;
        this.updateDisplay();
    }

    reset() {
        this.count = 0;
        this.updateDisplay();
    }
}

// Calculate average ratings
function calculateAverageRatings(ratings) {
    const sum = {
        aesthetic: 0,
        philosophical: 0,
        cultural: 0,
        emotional: 0,
        crosscultural: 0
    };
    
    ratings.forEach(rating => {
        for (let key in sum) {
            sum[key] += rating[key];
        }
    });

    const averages = {};
    const count = ratings.length;
    for (let key in sum) {
        averages[key] = count > 0 ? (sum[key] / count).toFixed(1) : 0;
    }

    return averages;
}

// Create comparison charts
function createComparisonCharts(wukongData, sekiroData) {
    // Get all historical data
    const allWukongRatings = JSON.parse(localStorage.getItem(STORAGE_KEYS.WUKONG) || '[]');
    const allSekiroRatings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEKIRO) || '[]');

    // Calculate averages
    const wukongAverages = calculateAverageRatings(allWukongRatings);
    const sekiroAverages = calculateAverageRatings(allSekiroRatings);

    // Create radar chart
    const radarCtx = document.getElementById('comparisonRadarChart').getContext('2d');
    if (comparisonRadarChart) {
        comparisonRadarChart.destroy();
    }

    comparisonRadarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: ['Aesthetic Score', 'Philosophical Alignment', 'Cultural Awareness', 'Emotional Resonance', 'Cross-cultural Adaptability'],
            datasets: [
                {
                    label: 'Black Myth: Wukong (Average)',
                    data: Object.values(wukongAverages),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                },
                {
                    label: 'Sekiro: Shadows Die Twice (Average)',
                    data: Object.values(sekiroAverages),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 10,
                    min: 0,
                    ticks: {
                        stepSize: 2
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Statistical Data (Based on ${allWukongRatings.length} Ratings)`,
                    padding: 20
                }
            }
        }
    });

    // Create bar chart
    const barCtx = document.getElementById('comparisonBarChart').getContext('2d');
    if (comparisonBarChart) {
        comparisonBarChart.destroy();
    }

    const categories = ['Aesthetic Score', 'Philosophical Alignment', 'Cultural Awareness', 'Emotional Resonance', 'Cross-cultural Adaptability'];
    
    comparisonBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Black Myth: Wukong (Average)',
                    data: Object.values(wukongAverages),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Sekiro: Shadows Die Twice (Average)',
                    data: Object.values(sekiroAverages),
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2
                    }
                }
            }
        }
    });

    // Update statistics display
    updateStatsDisplay(wukongAverages, sekiroAverages, allWukongRatings.length);
}

// Update statistics display
function updateStatsDisplay(wukongAverages, sekiroAverages, totalCount) {
    const statsContent = document.getElementById('statsContent');
    const dimensions = {
        aesthetic: 'Aesthetic Score',
        philosophical: 'Philosophical Alignment',
        cultural: 'Cultural Awareness',
        emotional: 'Emotional Resonance',
        crosscultural: 'Cross-cultural Adaptability'
    };

    let html = `
        <div class="stats-header">
            <h3>Statistical Results (Based on ${totalCount} Ratings)</h3>
        </div>
        <div class="stats-grid">
    `;

    for (const [key, name] of Object.entries(dimensions)) {
        const difference = (wukongAverages[key] - sekiroAverages[key]).toFixed(1);
        const differenceClass = difference > 0 ? 'positive' : (difference < 0 ? 'negative' : 'neutral');
        
        html += `
            <div class="stat-item">
                <h4>${name}</h4>
                <p>Black Myth Average: ${wukongAverages[key]}</p>
                <p>Sekiro Average: ${sekiroAverages[key]}</p>
                <p class="${differenceClass}">Average Difference: ${difference}</p>
            </div>
        `;
    }
    html += '</div>';
    statsContent.innerHTML = html;
}

// Initialize counter instance
let ratingsCounter;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    ratingsCounter = new RatingsCounter();

    // Listen for submit button clicks
    document.getElementById('submit-comparison').addEventListener('click', function() {
        // Get rating data
        const wukongRatings = {
            aesthetic: parseInt(document.getElementById('wukong-aesthetic').value),
            philosophical: parseInt(document.getElementById('wukong-philosophical').value),
            cultural: parseInt(document.getElementById('wukong-cultural').value),
            emotional: parseInt(document.getElementById('wukong-emotional').value),
            crosscultural: parseInt(document.getElementById('wukong-crosscultural').value)
        };

        const sekiroRatings = {
            aesthetic: parseInt(document.getElementById('sekiro-aesthetic').value),
            philosophical: parseInt(document.getElementById('sekiro-philosophical').value),
            cultural: parseInt(document.getElementById('sekiro-cultural').value),
            emotional: parseInt(document.getElementById('sekiro-emotional').value),
            crosscultural: parseInt(document.getElementById('sekiro-crosscultural').value)
        };

        // Save data to localStorage
        saveRatings(wukongRatings, STORAGE_KEYS.WUKONG);
        saveRatings(sekiroRatings, STORAGE_KEYS.SEKIRO);

        // Update counter
        ratingsCounter.increment();

        // Show results
        document.getElementById('comparison-result').style.display = 'block';

        // Create comparison charts
        createComparisonCharts(wukongRatings, sekiroRatings);
    });

    // 添加重置按钮事件监听
    document.getElementById('reset-data').addEventListener('click', function() {
        // 显示确认对话框
        if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
            // 清除 localStorage 数据
            localStorage.removeItem(STORAGE_KEYS.WUKONG);
            localStorage.removeItem(STORAGE_KEYS.SEKIRO);
            
            // 重置计数器
            ratingsCounter.reset();
            
            // 清除图表
            if (comparisonRadarChart) {
                comparisonRadarChart.destroy();
            }
            if (comparisonBarChart) {
                comparisonBarChart.destroy();
            }
            
            // 隐藏结果区域
            document.getElementById('comparison-result').style.display = 'none';
            
            // 重置所有滑块到默认值
            document.querySelectorAll('input[type="range"]').forEach(slider => {
                slider.value = 5;
                slider.nextElementSibling.textContent = '5';
            });
            
            // 显示提示消息
            alert('All data has been reset successfully.');
        }
    });

    // 初始化所有滑杆的事件监听
    document.querySelectorAll('.slider').forEach(slider => {
        // 为每个滑杆添加 input 事件监听器
        slider.addEventListener('input', function() {
            // 更新显示的分数（滑杆旁边的数字）
            this.nextElementSibling.textContent = this.value;
        });
    });
});

// Save ratings data
function saveRatings(ratings, storageKey) {
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existingData.push({
        ...ratings,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(storageKey, JSON.stringify(existingData));
}

// Get ratings data
function getRatings(storageKey) {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
}

// Listen for localStorage changes
window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEYS.WUKONG || e.key === STORAGE_KEYS.SEKIRO) {
        ratingsCounter.init();
    }
});