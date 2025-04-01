// /frontend/app.js

// Load climate data and render charts
function loadClimateData() {
    const state = document.getElementById('stateDropdown').value;
    if (!state) {
      alert("Please select a state.");
      return;
    }
    console.log('Selected state:', state);
    fetch(`/api/climate/${state}`)
      .then(response => response.json())
      .then(data => {
        console.log('Data received:', data);
        renderCharts(data);
      })
      .catch(error => console.error('Error loading climate data:', error));
  }
  
  
  function renderCharts(data) {
    // Destroy existing charts if they exist
    if (window.tempChart && typeof window.tempChart.destroy === 'function') {
      window.tempChart.destroy();
    }
    if (window.precChart && typeof window.precChart.destroy === 'function') {
      window.precChart.destroy();
    }
  
    const years = data.years;
    const temperatureTrend = data.temperatureTrend;
    const precipitationTrend = data.precipitationTrend;
  
    // Render Temperature Trend Chart
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    window.tempChart = new Chart(tempCtx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Average Temperature (°C)',
          data: temperatureTrend,
          borderColor: 'red',
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Temperature Trend for ${data.state}`
          }
        }
      }
    });
  
    // Render Precipitation Trend Chart
    const precCtx = document.getElementById('precChart').getContext('2d');
    window.precChart = new Chart(precCtx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Total Annual Precipitation (mm)',
          data: precipitationTrend,
          borderColor: 'blue',
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Precipitation Trend for ${data.state}`
          }
        }
      }
    });
  
    // Attach click event listeners to canvases to open the modal
    attachExpandEvent('tempChart', window.tempChart);
    attachExpandEvent('precChart', window.precChart);
  }
  
  // Attach click event listener with chart type from data attribute
function attachExpandEvent(canvasId, chartInstance) {
    const canvas = document.getElementById(canvasId);
    canvas.style.cursor = "pointer";
    const chartType = canvas.getAttribute("data-chart-type");
    canvas.onclick = function () {
      expandChart(chartInstance, chartType);
    };
  }
  
  // Function to open modal and render the expanded chart
  function expandChart(chartInstance, chartType) {
    const modal = document.getElementById('chartModal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Remove any previous background classes
    modalContent.classList.remove('modal-temp-bg', 'modal-prec-bg');
    // Add the appropriate background class based on chart type
    if (chartType === "tempChart") {
      modalContent.classList.add('modal-temp-bg');
    } else if (chartType === "precChart") {
      modalContent.classList.add('modal-prec-bg');
    }
    
    const modalCanvas = document.getElementById('expandedChart');
    const ctx = modalCanvas.getContext('2d');
  
    // Destroy any existing expanded chart instance
    if (window.expandedChart && typeof window.expandedChart.destroy === 'function') {
      window.expandedChart.destroy();
    }
  
    // Manually copy the configuration from the original chart
    const newConfig = {
      type: chartInstance.config.type,
      data: chartInstance.config.data,
      options: {
        ...chartInstance.config.options,
        responsive: true,
        plugins: {
          ...(chartInstance.config.options.plugins || {}),
          title: {
            ...(chartInstance.config.options.plugins && chartInstance.config.options.plugins.title ? chartInstance.config.options.plugins.title : {}),
            font: { size: 24 }
          }
        }
      }
    };
  
    // Create the new expanded chart
    window.expandedChart = new Chart(ctx, newConfig);
    
    // Show the modal
    modal.style.display = "block";
  }
  
  // Close modal on click of close button
  document.querySelector('.close').onclick = function () {
    document.getElementById('chartModal').style.display = "none";
    if (window.expandedChart && typeof window.expandedChart.destroy === 'function') {
      window.expandedChart.destroy();
    }
  };
  
  // Also close modal if clicking outside modal content
  window.onclick = function (event) {
    const modal = document.getElementById('chartModal');
    if (event.target == modal) {
      modal.style.display = "none";
      if (window.expandedChart && typeof window.expandedChart.destroy === 'function') {
        window.expandedChart.destroy();
      }
    }
  };
  
  // Expose loadClimateData to global scope if needed
  window.loadClimateData = loadClimateData;
  