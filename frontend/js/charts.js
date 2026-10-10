const charts = {
    instances: {},

    _getColor(priority) {
        switch(priority?.toUpperCase()) {
            case 'CRITIQUE': return '#ef4444';
            case 'HAUTE': return '#f97316';
            case 'MOYENNE': return '#eab308';
            case 'FAIBLE': return '#10b981';
            default: return '#3b82f6';
        }
    },

    createRadarChart(canvasId, playerData, targetData, labels, pName, tName) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }

        this.instances[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels || ['Scoring', 'Playmaking', 'Rebounding', 'Defense', '3PT', 'Efficiency'],
                datasets: [{
                    label: pName || 'Vous',
                    data: playerData || [50, 50, 50, 50, 50, 50],
                    backgroundColor: 'rgba(249, 115, 22, 0.2)',
                    borderColor: '#f97316',
                    pointBackgroundColor: '#f97316',
                    borderWidth: 2
                }, {
                    label: tName || 'Cible',
                    data: targetData || [80, 80, 80, 80, 80, 80],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3b82f6',
                    pointBackgroundColor: '#3b82f6',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } },
                        ticks: { display: false, min: 0, max: 100 }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#f1f5f9' } }
                }
            }
        });
    },

    createGapChart(canvasId, gapData) {
        if (!gapData || gapData.length === 0) return;
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }

        const labels = gapData.map(d => d.category);
        const data = gapData.map(d => d.gap);
        const colors = gapData.map(d => this._getColor(d.priority));

        this.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Écart',
                    data: data,
                    backgroundColor: colors,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { display: false }, ticks: { color: '#f1f5f9', font: { family: 'Outfit' } } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    createTrajectoryChart(canvasId, data) {
        if (!data || data.length === 0) return;
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }

        const labels = data.map((_, i) => `S${i+1}`);
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    borderColor: '#f97316',
                    borderWidth: 2,
                    pointRadius: 2,
                    pointBackgroundColor: '#f97316',
                    fill: false,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                layout: { padding: 5 }
            }
        });
    },

    createGaugeChart(canvasId, score) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }

        let color = '#ef4444';
        if (score > 40) color = '#f97316';
        if (score > 70) color = '#10b981';
        if (score > 90) color = '#3b82f6';

        this.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [score, 100 - score],
                    backgroundColor: [color, 'rgba(255,255,255,0.05)'],
                    borderWidth: 0,
                    circumference: 270,
                    rotation: 225,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            },
            plugins: [{
                id: 'textCenter',
                beforeDraw: function(chart) {
                    var width = chart.width,
                        height = chart.height,
                        ctx = chart.ctx;
                    ctx.restore();
                    var fontSize = (height / 100).toFixed(2);
                    ctx.font = "bold " + fontSize + "em Outfit";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#f1f5f9";
                    var text = Math.round(score),
                        textX = Math.round((width - ctx.measureText(text).width) / 2),
                        textY = height / 2 + 10;
                    ctx.fillText(text, textX, textY);
                    
                    ctx.font = "0.4em Inter";
                    ctx.fillStyle = "#94a3b8";
                    var subText = "SCORE",
                        subX = Math.round((width - ctx.measureText(subText).width) / 2),
                        subY = height / 2 + 40;
                    ctx.fillText(subText, subX, subY);
                    
                    ctx.save();
                }
            }]
        });
    }
};
