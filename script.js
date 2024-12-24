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

    async init() {
        try {
            const snapshot = await db.collection('ratings').get();
            this.count = snapshot.size;
            this.updateDisplay();
        } catch (error) {
            console.error("Error initializing counter:", error);
            this.count = 0;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        document.getElementById('totalCount').textContent = this.count;
    }

    increment() {
        this.count++;
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
async function createComparisonCharts() {
    // 获取所有评分数据
    const allRatings = await getRatings();
    
    // 分离悟空和只狼的数据
    const wukongData = allRatings.map(r => r.wukong);
    const sekiroData = allRatings.map(r => r.sekiro);
    
    // 计算平均值
    const wukongAverages = calculateAverageRatings(wukongData);
    const sekiroAverages = calculateAverageRatings(sekiroData);

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
                    text: `Statistical Data (Based on ${wukongData.length} Ratings)`,
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
    updateStatsDisplay(wukongAverages, sekiroAverages, wukongData.length);
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

// 添加计数器类
class Counter {
    constructor() {
        this.count = 0;
        this.loadCount();
    }

    async loadCount() {
        try {
            const doc = await db.collection('counters').doc('totalResponses').get();
            if (doc.exists) {
                this.count = doc.data().count;
            } else {
                // 如果文档不存在，创建它
                await db.collection('counters').doc('totalResponses').set({
                    count: 0
                });
            }
            this.updateDisplay();
        } catch (error) {
            console.error("Error loading counter:", error);
            this.count = 0;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        document.getElementById('totalCount').textContent = this.count;
    }

    async increment() {
        this.count++;
        this.updateDisplay();
        try {
            await db.collection('counters').doc('totalResponses').set({
                count: this.count
            });
        } catch (error) {
            console.error("Error updating counter:", error);
        }
    }
}

// 初始化计数器
let counter;

document.addEventListener('DOMContentLoaded', function() {
    console.log("Testing Firebase connection...");
    
    try {
        // 检查 Firebase 和 db 是否可用
        if (typeof firebase !== 'undefined' && firebase.apps.length && typeof db !== 'undefined') {
            console.log("Firebase is initialized!");
            
            // 初始化计数器
            counter = new Counter();
            
            // 测试数据库连接
            db.collection('test').add({
                test: 'Hello Firebase',
                timestamp: new Date()
            })
            .then(() => {
                console.log("Successfully connected to Firestore!");
            })
            .catch((error) => {
                console.error("Error connecting to Firestore:", error);
            });
        }
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});

// Submit button click handler
document.getElementById('submit-comparison').addEventListener('click', async function() {
    console.log("Submit button clicked");
    
    try {
        const result = await db.collection('ratings').add({
            timestamp: new Date()
        });
        console.log("Document successfully written!", result);
        if (counter) {
            await counter.increment();
        }
    } catch (error) {
        console.error("Error adding document: ", error);
    }
});

// Save ratings data
async function saveRatings(wukongRatings, sekiroRatings) {
    try {
        await db.collection('ratings').add({
            wukong: wukongRatings,
            sekiro: sekiroRatings,
            timestamp: new Date()
        });
        return true;
    } catch (error) {
        console.error("Error saving data: ", error);
        return false;
    }
}

// Get ratings data
async function getRatings() {
    try {
        const snapshot = await db.collection('ratings').get();
        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error getting data: ", error);
        return [];
    }
}

// Listen for localStorage changes
window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEYS.WUKONG || e.key === STORAGE_KEYS.SEKIRO) {
        ratingsCounter.init();
    }
});