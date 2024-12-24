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

// Initialize counter instance
let ratingsCounter;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // 测试 Firebase 连接
    console.log("Testing Firebase connection...");
    
    try {
        // 检查 Firebase 是否已经初始化
        if (!firebase.apps.length) {
            const firebaseConfig = {
                apiKey: "AIzaSyA-IyfP_fWFjS4CgaBgaE7xawZlGQx_0d4",
                authDomain: "blackmythvssekiro.firebaseapp.com",
                projectId: "blackmythvssekiro",
                storageBucket: "blackmythvssekiro.firebasestorage.app",
                messagingSenderId: "535071038075",
                appId: "1:535071038075:web:a2ae68b62dd4eefc0860de",
                measurementId: "G-1KXGTY058H"
               
            };
            
            firebase.initializeApp(firebaseConfig);
        }

        const db = firebase.firestore();

        // 检查 Firebase 和 db 是否可用
        if (typeof firebase !== 'undefined' && firebase.apps.length && typeof db !== 'undefined') {
            console.log("Firebase is initialized!");
            
            // 测试数据库连接
            db.collection('test').add({
                test: 'Hello Firebase',
                timestamp: new Date()
            })
            .then(() => {
                console.log("Successfully connected to Firestore!");
                // 初始化应用
                initializeApp();
            })
            .catch((error) => {
                console.error("Error connecting to Firestore:", error);
            });
        } else {
            console.error("Firebase or db is not initialized!");
        }
    } catch (error) {
        console.error("Error during Firebase check:", error);
    }
});

// 将主要的应用初始化逻辑移到这个函数中
function initializeApp() {
    // 创建计数器实例
    ratingsCounter = new RatingsCounter();
    
    // 添加提交按钮事件监听器
    document.getElementById('submit-comparison').addEventListener('click', async function() {
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

        // 保存数据到 Firebase
        const success = await saveRatings(wukongRatings, sekiroRatings);
        
        if (success) {
            // 更新计数器
            ratingsCounter.increment();
            
            // 显示结果区域
            document.getElementById('comparison-result').style.display = 'block';
            
            // 创建对比图表
            createComparisonCharts();
            
            // 显示成功消息
            alert('Thank you for your submission!');
        } else {
            alert('Error saving data. Please try again.');
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
}

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