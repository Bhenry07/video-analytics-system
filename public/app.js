class VideoAnalytics {
    constructor() {
        this.player = null;
        this.model = null;
        this.canvas = null;
        this.ctx = null;
        this.isAnalyzing = false;
        this.detectionData = [];
        this.detectionInterval = null;
        this.chart = null;
        this.config = {
            detectPeople: true,
            detectVehicles: true,
            detectObjects: true,
            confidenceThreshold: 0.5,
            detectionFPS: 5
        };
        
        this.vehicleClasses = ['car', 'truck', 'bus', 'motorcycle', 'bicycle'];
        this.personClass = ['person'];
        
        this.init();
    }

    async init() {
        this.setupUI();
        await this.loadModel();
        this.setupVideoPlayer();
        this.setupChart();
        this.loadVideos();
    }

    async loadModel() {
        const statusText = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        
        try {
            statusText.textContent = 'Loading AI Model...';
            this.model = await cocoSsd.load();
            statusText.textContent = 'Model Ready ✓';
            statusDot.classList.remove('loading');
            console.log('COCO-SSD model loaded successfully');
        } catch (error) {
            statusText.textContent = 'Model Failed to Load ✗';
            statusDot.style.background = '#ef4444';
            console.error('Failed to load model:', error);
        }
    }

    setupVideoPlayer() {
        this.player = videojs('videoPlayer', {
            controls: true,
            fluid: false,
            preload: 'auto'
        });

        this.canvas = document.getElementById('detectionCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.player.on('loadedmetadata', () => {
            const video = this.player.el().querySelector('video');
            this.canvas.width = video.videoWidth;
            this.canvas.height = video.videoHeight;
            
            document.getElementById('startAnalysis').disabled = false;
        });

        this.player.on('play', () => {
            if (this.isAnalyzing) {
                this.startDetectionLoop();
            }
        });

        this.player.on('pause', () => {
            this.stopDetectionLoop();
        });
    }

    setupUI() {
        // Upload functionality
        document.getElementById('uploadBtn').addEventListener('click', () => this.uploadVideo());
        
        // Analysis controls
        document.getElementById('startAnalysis').addEventListener('click', () => this.startAnalysis());
        document.getElementById('stopAnalysis').addEventListener('click', () => this.stopAnalysis());
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        
        // Configuration
        document.getElementById('detectPeople').addEventListener('change', (e) => {
            this.config.detectPeople = e.target.checked;
        });
        
        document.getElementById('detectVehicles').addEventListener('change', (e) => {
            this.config.detectVehicles = e.target.checked;
        });
        
        document.getElementById('detectObjects').addEventListener('change', (e) => {
            this.config.detectObjects = e.target.checked;
        });
        
        document.getElementById('confidenceThreshold').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('confidenceValue').textContent = value;
            this.config.confidenceThreshold = value / 100;
        });
        
        document.getElementById('detectionFPS').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('fpsValue').textContent = value;
            this.config.detectionFPS = parseInt(value);
            
            if (this.isAnalyzing) {
                this.stopDetectionLoop();
                this.startDetectionLoop();
            }
        });
    }

    async uploadVideo() {
        const fileInput = document.getElementById('videoUpload');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a video file');
            return;
        }

        const formData = new FormData();
        formData.append('video', file);

        const progressBar = document.getElementById('uploadProgress');
        const progressFill = progressBar.querySelector('.progress-fill');
        progressBar.classList.remove('hidden');

        try {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressFill.style.width = percentComplete + '%';
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    console.log('Upload successful:', response);
                    this.loadVideos();
                    this.loadVideo(response.path);
                    fileInput.value = '';
                    setTimeout(() => {
                        progressBar.classList.add('hidden');
                        progressFill.style.width = '0%';
                    }, 1000);
                } else {
                    alert('Upload failed');
                }
            });

            xhr.open('POST', '/api/upload');
            xhr.send(formData);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
            progressBar.classList.add('hidden');
        }
    }

    async loadVideos() {
        try {
            const response = await fetch('/api/videos');
            const videos = await response.json();
            
            const videosList = document.getElementById('videosList');
            videosList.innerHTML = '';
            
            if (videos.length === 0) {
                videosList.innerHTML = '<p style="color: #9ca3af; font-size: 0.85em;">No videos uploaded yet</p>';
                return;
            }
            
            videos.forEach(video => {
                const item = document.createElement('div');
                item.className = 'video-item';
                item.innerHTML = `
                    <span class="video-item-name" title="${video.filename}">${video.filename}</span>
                    <button class="video-item-delete" onclick="analytics.deleteVideo('${video.filename}', event)">🗑️</button>
                `;
                
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('video-item-delete')) {
                        this.loadVideo(video.path);
                        document.querySelectorAll('.video-item').forEach(el => el.classList.remove('active'));
                        item.classList.add('active');
                    }
                });
                
                videosList.appendChild(item);
            });
        } catch (error) {
            console.error('Failed to load videos:', error);
        }
    }

    async deleteVideo(filename, event) {
        event.stopPropagation();
        
        if (!confirm(`Delete ${filename}?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/videos/${filename}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.loadVideos();
            } else {
                alert('Failed to delete video');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete video');
        }
    }

    loadVideo(path) {
        this.player.src({ type: 'video/mp4', src: path });
        this.player.load();
        this.resetAnalysis();
    }

    startAnalysis() {
        if (!this.model) {
            alert('AI model not loaded yet');
            return;
        }

        this.isAnalyzing = true;
        this.detectionData = [];
        document.getElementById('startAnalysis').classList.add('hidden');
        document.getElementById('stopAnalysis').classList.remove('hidden');
        document.getElementById('exportData').disabled = false;
        
        if (!this.player.paused()) {
            this.startDetectionLoop();
        }
        
        this.player.play();
    }

    stopAnalysis() {
        this.isAnalyzing = false;
        this.stopDetectionLoop();
        document.getElementById('startAnalysis').classList.remove('hidden');
        document.getElementById('stopAnalysis').classList.add('hidden');
    }

    resetAnalysis() {
        this.stopAnalysis();
        this.detectionData = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateStats(0, 0, 0);
        this.updateChart();
        document.getElementById('detectionLog').innerHTML = '';
        document.getElementById('exportData').disabled = true;
    }

    startDetectionLoop() {
        const interval = 1000 / this.config.detectionFPS;
        this.detectionInterval = setInterval(() => this.detectFrame(), interval);
    }

    stopDetectionLoop() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }

    async detectFrame() {
        if (!this.isAnalyzing || this.player.paused()) {
            return;
        }

        const video = this.player.el().querySelector('video');
        const startTime = performance.now();
        
        try {
            const predictions = await this.model.detect(video);
            const endTime = performance.now();
            const fps = Math.round(1000 / (endTime - startTime));
            
            const filteredPredictions = this.filterPredictions(predictions);
            this.drawDetections(filteredPredictions);
            
            const currentTime = this.player.currentTime();
            this.recordDetections(currentTime, filteredPredictions);
            
            const people = filteredPredictions.filter(p => this.personClass.includes(p.class)).length;
            const vehicles = filteredPredictions.filter(p => this.vehicleClasses.includes(p.class)).length;
            const total = filteredPredictions.length;
            
            this.updateStats(people, vehicles, total, fps);
            this.updateChart();
            this.updateLog(currentTime, filteredPredictions);
            
        } catch (error) {
            console.error('Detection error:', error);
        }
    }

    filterPredictions(predictions) {
        return predictions.filter(pred => {
            if (pred.score < this.config.confidenceThreshold) {
                return false;
            }
            
            const isPerson = this.personClass.includes(pred.class);
            const isVehicle = this.vehicleClasses.includes(pred.class);
            
            if (isPerson && !this.config.detectPeople) return false;
            if (isVehicle && !this.config.detectVehicles) return false;
            if (!isPerson && !isVehicle && !this.config.detectObjects) return false;
            
            return true;
        });
    }

    drawDetections(predictions) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        predictions.forEach(pred => {
            const [x, y, width, height] = pred.bbox;
            
            // Determine color based on class
            let color = '#00FF00';
            if (this.personClass.includes(pred.class)) {
                color = '#10b981';
            } else if (this.vehicleClasses.includes(pred.class)) {
                color = '#ef4444';
            } else {
                color = '#f59e0b';
            }
            
            // Draw bounding box
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, width, height);
            
            // Draw label background
            const label = `${pred.class} ${Math.round(pred.score * 100)}%`;
            this.ctx.font = '16px Arial';
            const textMetrics = this.ctx.measureText(label);
            const textHeight = 20;
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y - textHeight - 4, textMetrics.width + 10, textHeight + 4);
            
            // Draw label text
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(label, x + 5, y - 8);
        });
    }

    recordDetections(timestamp, predictions) {
        this.detectionData.push({
            timestamp: timestamp,
            predictions: predictions.map(p => ({
                class: p.class,
                score: p.score,
                bbox: p.bbox
            }))
        });
    }

    updateStats(people, vehicles, total, fps = 0) {
        document.getElementById('peopleCount').textContent = people;
        document.getElementById('vehicleCount').textContent = vehicles;
        document.getElementById('objectCount').textContent = total;
        document.getElementById('processingFPS').textContent = fps;
    }

    setupChart() {
        const ctx = document.getElementById('timelineChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'People',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Vehicles',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Other Objects',
                        data: [],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        display: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    updateChart() {
        if (!this.chart || this.detectionData.length === 0) return;
        
        const maxPoints = 50;
        const step = Math.max(1, Math.floor(this.detectionData.length / maxPoints));
        const sampledData = this.detectionData.filter((_, i) => i % step === 0);
        
        const labels = sampledData.map(d => this.formatTime(d.timestamp));
        const peopleData = sampledData.map(d => 
            d.predictions.filter(p => this.personClass.includes(p.class)).length
        );
        const vehicleData = sampledData.map(d => 
            d.predictions.filter(p => this.vehicleClasses.includes(p.class)).length
        );
        const otherData = sampledData.map(d => 
            d.predictions.filter(p => 
                !this.personClass.includes(p.class) && 
                !this.vehicleClasses.includes(p.class)
            ).length
        );
        
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = peopleData;
        this.chart.data.datasets[1].data = vehicleData;
        this.chart.data.datasets[2].data = otherData;
        this.chart.update('none');
    }

    updateLog(timestamp, predictions) {
        const log = document.getElementById('detectionLog');
        
        if (predictions.length > 0) {
            const entry = document.createElement('div');
            const isPerson = predictions.some(p => this.personClass.includes(p.class));
            const isVehicle = predictions.some(p => this.vehicleClasses.includes(p.class));
            
            let entryClass = 'object';
            if (isPerson) entryClass = 'person';
            else if (isVehicle) entryClass = 'vehicle';
            
            entry.className = `log-entry ${entryClass}`;
            
            const summary = predictions.reduce((acc, p) => {
                acc[p.class] = (acc[p.class] || 0) + 1;
                return acc;
            }, {});
            
            const summaryText = Object.entries(summary)
                .map(([cls, count]) => `${count}x ${cls}`)
                .join(', ');
            
            entry.innerHTML = `
                <span class="time">[${this.formatTime(timestamp)}]</span> 
                <span class="detection">${summaryText}</span>
            `;
            
            log.insertBefore(entry, log.firstChild);
            
            // Keep only last 100 entries
            while (log.children.length > 100) {
                log.removeChild(log.lastChild);
            }
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    exportData() {
        if (this.detectionData.length === 0) {
            alert('No detection data to export');
            return;
        }

        const summary = {
            totalFrames: this.detectionData.length,
            videoDuration: this.player.duration(),
            detectionSettings: this.config,
            detections: this.detectionData
        };

        const dataStr = JSON.stringify(summary, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-analytics-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the application
let analytics;
document.addEventListener('DOMContentLoaded', () => {
    analytics = new VideoAnalytics();
});
