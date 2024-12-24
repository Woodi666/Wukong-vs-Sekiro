// 在文件开头添加调试函数
function debug(message, data = null) {
    const timestamp = new Date().toISOString();
    if (data) {
        console.log(`[${timestamp}] ${message}:`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

class Counter {
    constructor(db) {
        this.db = db;
        this.count = 0;
        debug('Counter constructor called');
        this.loadCount();
    }

    async loadCount() {
        debug('Loading count...');
        try {
            const doc = await this.db.collection('counters').doc('totalResponses').get();
            debug('Counter document:', doc.exists ? doc.data() : 'not exists');
            
            if (doc.exists) {
                this.count = doc.data().count;
            } else {
                debug('Creating new counter document');
                await this.db.collection('counters').doc('totalResponses').set({
                    count: 0
                });
            }
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading counter:', error);
            this.count = 0;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const totalCountElement = document.getElementById('totalCount');
        debug('Updating display, count:', this.count);
        debug('Total count element:', totalCountElement);
        
        if (totalCountElement) {
            totalCountElement.textContent = this.count;
            debug('Display updated successfully');
        } else {
            console.error('Could not find totalCount element');
        }
    }

    async increment() {
        this.count++;
        debug('Incrementing count to:', this.count);
        this.updateDisplay();
        try {
            await this.db.collection('counters').doc('totalResponses').set({
                count: this.count
            });
            debug('Counter updated in Firestore');
        } catch (error) {
            console.error('Error updating counter:', error);
        }
    }
}

class GameRating {
    constructor() {
        debug('GameRating constructor called');
        
        // 确保 Firebase 已加载
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase is not loaded!');
        }
        
        // 确保 Chart.js 已加载
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js is not loaded!');
        }

        // 初始化 Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyA-IyfP_fWFjS4CgaBgaE7xawZlGQx_0d4",
            authDomain: "blackmythvssekiro.firebaseapp.com",
            projectId: "blackmythvssekiro",
            storageBucket: "blackmythvssekiro.appspot.com",
            messagingSenderId: "535071038075",
            appId: "1:535071038075:web:a2ae68b62dd4eefc0860de",
            measurementId: "G-1KXGTY058H"
        };

        // 检查是否已经初始化
        if (!firebase.apps.length) {
            debug('Initializing Firebase');
            firebase.initializeApp(firebaseConfig);
        } else {
            debug('Firebase already initialized');
        }

        this.db = firebase.firestore();
        debug('Firestore initialized');
        
        // 初始化计数器
        this.counter = new Counter(this.db);
        debug('Counter initialized');
        
        this.radarChart = null;
        this.barChart = null;
        this.init();
    }

    async init() {
        debug('Initializing GameRating...');
        try {
            // 初始化事件监听器
            this.initEventListeners();
            debug('Event listeners initialized');
            
            // 初始化图表
            await this.updateVisualizations();
            debug('Initial visualizations complete');
            
        } catch (error) {
            console.error('Error initializing GameRating:', error);
        }
    }

    initEventListeners() {
        debug('Setting up event listeners');
        
        // 监听提交按钮
        const submitButton = document.getElementById('submit-comparison');
        if (submitButton) {
            submitButton.addEventListener('click', async () => {
                debug('Submit button clicked');
                await this.handleSubmit();
            });
            debug('Submit button listener attached');
        } else {
            console.error('Submit button not found in DOM');
        }

        // 监听滑块变化
        const sliders = document.querySelectorAll('.slider');
        debug('Found sliders:', sliders.length);
        
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const scoreDisplay = e.target.nextElementSibling;
                if (scoreDisplay) {
                    scoreDisplay.textContent = e.target.value;
                    debug(`Slider ${e.target.id} value changed to ${e.target.value}`);
                }
            });
        });
    }

    async handleSubmit() {
        debug('Processing submission...');
        try {
            const scores = this.collectScores();
            debug('Collected scores:', scores);
            
            await this.saveScores(scores);
            debug('Scores saved to Firebase');
            
            if (this.counter) {  // 添加检查
                await this.counter.increment();
                debug('Counter incremented');
            } else {
                console.error('Counter not initialized');
            }
            
            await this.updateVisualizations();
            debug('Visualizations updated');
            
        } catch (error) {
            console.error('Error handling submit:', error);
        }
    }

    collectScores() {
        debug('Collecting scores...');
        const dimensions = ['aesthetic', 'philosophical', 'cultural', 'emotional', 'crosscultural'];
        const scores = {
            wukongScores: {},
            sekiroScores: {}
        };

        dimensions.forEach(dim => {
            const wukongValue = document.getElementById(`wukong-${dim}`);
            const sekiroValue = document.getElementById(`sekiro-${dim}`);
            
            scores.wukongScores[dim] = wukongValue ? parseInt(wukongValue.value) || 5 : 5;
            scores.sekiroScores[dim] = sekiroValue ? parseInt(sekiroValue.value) || 5 : 5;
        });

        debug('Collected scores:', scores);
        return scores;
    }

    async saveScores(scores) {
        debug('Saving scores to Firebase...');
        try {
            const docRef = await this.db.collection('ratings').add({
                timestamp: new Date(),
                ...scores
            });
            debug('Scores saved with ID:', docRef.id);
        } catch (error) {
            console.error('Error saving scores:', error);
            throw error;
        }
    }

    async updateVisualizations() {
        debug('Starting visualization update');
        
        const chartContainers = {
            radar: document.getElementById('comparisonRadar'),
            bar: document.getElementById('averageComparison'),
            stats: document.getElementById('detailedStats')
        };

        debug('Canvas elements check:', chartContainers);

        if (!chartContainers.radar || !chartContainers.bar || !chartContainers.stats) {
            console.error('Required DOM elements not found');
            return;
        }

        try {
            const averages = await this.calculateAverages();
            debug('Retrieved averages for visualization:', averages);
            
            if (!averages) {
                debug('No averages available, skipping visualization update');
                return;
            }

            // 更新雷达图
            this.updateRadarChart(chartContainers.radar, averages);
            debug('Radar chart updated');
            
            // 更新柱状图
            this.updateBarChart(chartContainers.bar, averages);
            debug('Bar chart updated');
            
            // 更新统计信息
            this.updateStats(averages);
            debug('Statistics updated');
            
        } catch (error) {
            console.error('Error updating visualizations:', error);
        }
    }

    updateRadarChart(canvas, averages) {
        if (!canvas) return;

        const data = {
            labels: ['动作美学', '哲学契合度', '文化认知提升', '情感共鸣', '跨文化适应性'],
            datasets: [
                {
                    label: 'Black Myth: Wukong',
                    data: [
                        averages.wukong.aesthetic,
                        averages.wukong.philosophical,
                        averages.wukong.cultural,
                        averages.wukong.emotional,
                        averages.wukong.crosscultural
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(255, 99, 132)'
                },
                {
                    label: 'Sekiro',
                    data: [
                        averages.sekiro.aesthetic,
                        averages.sekiro.philosophical,
                        averages.sekiro.cultural,
                        averages.sekiro.emotional,
                        averages.sekiro.crosscultural
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)'
                }
            ]
        };

        if (this.radarChart) {
            this.radarChart.destroy();
        }

        this.radarChart = new Chart(canvas, {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 2
                        }
                    }
                }
            }
        });
    }

    updateBarChart(canvas, averages) {
        if (!canvas) return;

        const wukongAvg = Object.values({
            aesthetic: averages.wukong.aesthetic,
            philosophical: averages.wukong.philosophical,
            cultural: averages.wukong.cultural,
            emotional: averages.wukong.emotional,
            crosscultural: averages.wukong.crosscultural
        }).reduce((a, b) => a + b) / 5;

        const sekiroAvg = Object.values({
            aesthetic: averages.sekiro.aesthetic,
            philosophical: averages.sekiro.philosophical,
            cultural: averages.sekiro.cultural,
            emotional: averages.sekiro.emotional,
            crosscultural: averages.sekiro.crosscultural
        }).reduce((a, b) => a + b) / 5;

        const data = {
            labels: ['总体评分'],
            datasets: [
                {
                    label: 'Black Myth: Wukong',
                    data: [wukongAvg],
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                },
                {
                    label: 'Sekiro',
                    data: [sekiroAvg],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }
            ]
        };

        if (this.barChart) {
            this.barChart.destroy();
        }

        this.barChart = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10
                    }
                }
            }
        });
    }

    async calculateAverages() {
        debug('Starting to calculate averages');
        try {
            const snapshot = await this.db.collection('ratings').get();
            const ratings = snapshot.docs.map(doc => doc.data());
            debug('Retrieved ratings:', ratings);

            if (ratings.length === 0) return null;

            const stats = {
                wukong: {},
                sekiro: {}
            };

            // 初始化统计对象
            ['aesthetic', 'philosophical', 'cultural', 'emotional', 'crosscultural'].forEach(key => {
                stats.wukong[key] = {
                    sum: 0,
                    max: 0,
                    min: 10,
                    count: 0
                };
                stats.sekiro[key] = {
                    sum: 0,
                    max: 0,
                    min: 10,
                    count: 0
                };
            });

            // 计算总和、最大值和最小值
            ratings.forEach(rating => {
                if (rating.wukongScores) {
                    Object.entries(rating.wukongScores).forEach(([key, value]) => {
                        if (stats.wukong[key]) {
                            stats.wukong[key].sum += value;
                            stats.wukong[key].max = Math.max(stats.wukong[key].max, value);
                            stats.wukong[key].min = Math.min(stats.wukong[key].min, value);
                            stats.wukong[key].count++;
                        }
                    });
                }
                if (rating.sekiroScores) {
                    Object.entries(rating.sekiroScores).forEach(([key, value]) => {
                        if (stats.sekiro[key]) {
                            stats.sekiro[key].sum += value;
                            stats.sekiro[key].max = Math.max(stats.sekiro[key].max, value);
                            stats.sekiro[key].min = Math.min(stats.sekiro[key].min, value);
                            stats.sekiro[key].count++;
                        }
                    });
                }
            });

            // 计算平均值并整理数据格式
            const result = {
                wukong: {},
                sekiro: {}
            };

            Object.entries(stats.wukong).forEach(([key, data]) => {
                result.wukong[key] = data.sum / data.count;
                result.wukong[key + '_max'] = data.max;
                result.wukong[key + '_min'] = data.min;
            });

            Object.entries(stats.sekiro).forEach(([key, data]) => {
                result.sekiro[key] = data.sum / data.count;
                result.sekiro[key + '_max'] = data.max;
                result.sekiro[key + '_min'] = data.min;
            });

            debug('Calculated averages:', result);
            return result;

        } catch (error) {
            console.error('Error calculating averages:', error);
            return null;
        }
    }

    async calculateDetailedStats() {
        try {
            const snapshot = await this.db.collection('ratings').get();
            const ratings = snapshot.docs.map(doc => doc.data());
            
            const dimensions = ['aesthetic', 'philosophical', 'cultural', 'emotional', 'crosscultural'];
            const stats = {
                wukong: {},
                sekiro: {}
            };

            // 初始化统计对象
            dimensions.forEach(dim => {
                stats.wukong[dim] = {
                    avg: 0,
                    max: 0,
                    min: 10
                };
                stats.sekiro[dim] = {
                    avg: 0,
                    max: 0,
                    min: 10
                };
            });

            // 计算统计数据
            ratings.forEach(rating => {
                dimensions.forEach(dim => {
                    if (rating.wukongScores && rating.wukongScores[dim]) {
                        const score = rating.wukongScores[dim];
                        stats.wukong[dim].max = Math.max(stats.wukong[dim].max, score);
                        stats.wukong[dim].min = Math.min(stats.wukong[dim].min, score);
                        stats.wukong[dim].avg = (stats.wukong[dim].avg || 0) + score;
                    }
                    if (rating.sekiroScores && rating.sekiroScores[dim]) {
                        const score = rating.sekiroScores[dim];
                        stats.sekiro[dim].max = Math.max(stats.sekiro[dim].max, score);
                        stats.sekiro[dim].min = Math.min(stats.sekiro[dim].min, score);
                        stats.sekiro[dim].avg = (stats.sekiro[dim].avg || 0) + score;
                    }
                });
            });

            // 计算平均值
            const count = ratings.length || 1;
            dimensions.forEach(dim => {
                stats.wukong[dim].avg = stats.wukong[dim].avg / count;
                stats.sekiro[dim].avg = stats.sekiro[dim].avg / count;
            });

            return stats;
        } catch (error) {
            console.error('Error calculating detailed stats:', error);
            return null;
        }
    }

    updateStats(averages) {
        const statsContainer = document.getElementById('detailedStats');
        if (!statsContainer) return;

        const dimensionNames = {
            aesthetic: '动作美学',
            philosophical: '哲学契合度',
            cultural: '文化认知提升',
            emotional: '情感共鸣',
            crosscultural: '跨文化适应性'
        };

        let html = `
            <div class="stats-container">
                <h3>详细统计数据</h3>
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>评分维度</th>
                            <th colspan="3">Black Myth: Wukong</th>
                            <th colspan="3">Sekiro</th>
                        </tr>
                        <tr>
                            <th></th>
                            <th>平均分</th>
                            <th>最高分</th>
                            <th>最低分</th>
                            <th>平均分</th>
                            <th>最高分</th>
                            <th>最低分</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        Object.entries(dimensionNames).forEach(([key, name]) => {
            html += `
                <tr>
                    <td>${name}</td>
                    <td>${averages.wukong[key].toFixed(1)}</td>
                    <td>${averages.wukong[key + '_max'] || '-'}</td>
                    <td>${averages.wukong[key + '_min'] || '-'}</td>
                    <td>${averages.sekiro[key].toFixed(1)}</td>
                    <td>${averages.sekiro[key + '_max'] || '-'}</td>
                    <td>${averages.sekiro[key + '_min'] || '-'}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        statsContainer.innerHTML = html;
    }
}

// 当 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    debug('DOM Content Loaded, initializing GameRating');
    try {
        window.gameRating = new GameRating();
        debug('GameRating instance created successfully');
    } catch (error) {
        console.error('Error creating GameRating instance:', error);
    }
});