/**
 * Chart Manager Module
 * Handles chart creation, updates, and data visualization
 * @module ChartManager
 */

class ChartManager {
  /**
   * Create a chart manager
   * @param {string} canvasId - ID of canvas element for chart
   */
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.chart = null;
    this.maxDataPoints = 50; // Maximum points to display for performance
    this.detectionData = [];
  }

  /**
   * Initialize the chart
   * @returns {Chart} Chart.js instance
   */
  setupChart() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      throw new Error(`Canvas element with ID '${this.canvasId}' not found`);
    }

    const ctx = canvas.getContext('2d');

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
            tension: 0.4,
            fill: true
          },
          {
            label: 'Vehicles',
            data: [],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Animals',
            data: [],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Sports Equipment',
            data: [],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Furniture',
            data: [],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'POS/ATM Systems',
            data: [],
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Other Objects',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 0 // Disable animation for better performance
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0
            }
          },
          x: {
            display: true,
            ticks: {
              maxRotation: 45,
              minRotation: 0
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });

    return this.chart;
  }

  /**
   * Add detection data point
   * @param {number} timestamp - Video timestamp in seconds
   * @param {Object} counts - Object with people, vehicles, objects counts
   */
  addDataPoint(timestamp, counts) {
    this.detectionData.push({
      timestamp: timestamp,
      people: counts.people || 0,
      vehicles: counts.vehicles || 0,
      animals: counts.animals || 0,
      sports: counts.sports || 0,
      furniture: counts.furniture || 0,
      paymentSystems: counts.paymentSystems || 0,
      objects: counts.objects || 0
    });

    // Limit stored data for memory management
    if (this.detectionData.length > 1000) {
      this.detectionData = this.detectionData.slice(-500);
    }
  }

  /**
   * Update chart with current detection data
   */
  updateChart() {
    if (!this.chart) {
      console.warn('Chart not initialized');
      return;
    }

    if (this.detectionData.length === 0) {
      return;
    }

    // Sample data for performance if too many points
    const sampledData = this.sampleData(this.detectionData, this.maxDataPoints);

    // Prepare data for chart
    const labels = sampledData.map((d) => this.formatTime(d.timestamp));
    const peopleData = sampledData.map((d) => d.people);
    const vehicleData = sampledData.map((d) => d.vehicles);
    const animalData = sampledData.map((d) => d.animals);
    const sportsData = sampledData.map((d) => d.sports);
    const furnitureData = sampledData.map((d) => d.furniture);
    const paymentSystemData = sampledData.map((d) => d.paymentSystems);
    const objectData = sampledData.map((d) => d.objects);

    // Update chart data
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = peopleData;
    this.chart.data.datasets[1].data = vehicleData;
    this.chart.data.datasets[2].data = animalData;
    this.chart.data.datasets[3].data = sportsData;
    this.chart.data.datasets[4].data = furnitureData;
    this.chart.data.datasets[5].data = paymentSystemData;
    this.chart.data.datasets[6].data = objectData;

    // Update without animation for performance
    this.chart.update('none');
  }

  /**
   * Sample data to reduce number of points
   * @param {Array} data - Original data array
   * @param {number} maxPoints - Maximum points to return
   * @returns {Array} Sampled data
   */
  sampleData(data, maxPoints) {
    if (data.length <= maxPoints) {
      return data;
    }

    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  }

  /**
   * Format timestamp to MM:SS
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Clear all chart data
   */
  clearData() {
    this.detectionData = [];
    if (this.chart) {
      this.chart.data.labels = [];
      this.chart.data.datasets[0].data = [];
      this.chart.data.datasets[1].data = [];
      this.chart.data.datasets[2].data = [];
      this.chart.data.datasets[3].data = [];
      this.chart.data.datasets[4].data = [];
      this.chart.data.datasets[5].data = [];
      this.chart.update('none');
    }
  }

  /**
   * Get chart statistics
   * @returns {Object} Statistics about detection data
   */
  getStatistics() {
    if (this.detectionData.length === 0) {
      return {
        totalFrames: 0,
        avgPeople: 0,
        avgVehicles: 0,
        avgAnimals: 0,
        avgSports: 0,
        avgFurniture: 0,
        avgObjects: 0,
        maxPeople: 0,
        maxVehicles: 0,
        maxAnimals: 0,
        maxSports: 0,
        maxFurniture: 0,
        maxObjects: 0
      };
    }

    const totals = this.detectionData.reduce(
      (acc, data) => {
        acc.people += data.people;
        acc.vehicles += data.vehicles;
        acc.animals += data.animals;
        acc.sports += data.sports;
        acc.furniture += data.furniture;
        acc.objects += data.objects;
        acc.maxPeople = Math.max(acc.maxPeople, data.people);
        acc.maxVehicles = Math.max(acc.maxVehicles, data.vehicles);
        acc.maxAnimals = Math.max(acc.maxAnimals, data.animals);
        acc.maxSports = Math.max(acc.maxSports, data.sports);
        acc.maxFurniture = Math.max(acc.maxFurniture, data.furniture);
        acc.maxObjects = Math.max(acc.maxObjects, data.objects);
        return acc;
      },
      {
        people: 0,
        vehicles: 0,
        animals: 0,
        sports: 0,
        furniture: 0,
        objects: 0,
        maxPeople: 0,
        maxVehicles: 0,
        maxAnimals: 0,
        maxSports: 0,
        maxFurniture: 0,
        maxObjects: 0
      }
    );

    const count = this.detectionData.length;

    return {
      totalFrames: count,
      avgPeople: (totals.people / count).toFixed(2),
      avgVehicles: (totals.vehicles / count).toFixed(2),
      avgAnimals: (totals.animals / count).toFixed(2),
      avgSports: (totals.sports / count).toFixed(2),
      avgFurniture: (totals.furniture / count).toFixed(2),
      avgObjects: (totals.objects / count).toFixed(2),
      maxPeople: totals.maxPeople,
      maxVehicles: totals.maxVehicles,
      maxAnimals: totals.maxAnimals,
      maxSports: totals.maxSports,
      maxFurniture: totals.maxFurniture,
      maxObjects: totals.maxObjects
    };
  }

  /**
   * Export chart data
   * @returns {Array} Detection data array
   */
  exportData() {
    return this.detectionData.map((d) => ({ ...d }));
  }

  /**
   * Set maximum data points to display
   * @param {number} max - Maximum points
   */
  setMaxDataPoints(max) {
    if (max > 0 && max <= 200) {
      this.maxDataPoints = max;
    }
  }

  /**
   * Destroy the chart and clean up
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.detectionData = [];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartManager;
}
