document.addEventListener("DOMContentLoaded", function() {
    const decadeSlider = document.getElementById("decadeSlider");
    const selectedDecadeSpan = document.getElementById("selectedDecade");
    const loadTimelineBtn = document.getElementById("loadTimelineBtn");
    let timelineRainChart, timelineTempChart;
  
    // Update the displayed decade range as the slider moves.
    decadeSlider.addEventListener("input", function() {
      const decade = parseInt(decadeSlider.value);
      selectedDecadeSpan.textContent = `${decade}‑${decade + 9}`;
    });
  
    // When the "Load Timeline Data" button is clicked, load data for both rainfall and temperature.
    loadTimelineBtn.addEventListener("click", loadTimelineData);
  
    function loadTimelineData() {
      const decade = decadeSlider.value;
      
      // Fetch rainfall timeline data
      fetch(`/api/timeline?decade=${decade}`)
        .then(response => response.json())
        .then(rainData => {
          renderRainTimelineChart(rainData);
        })
        .catch(err => {
          console.error("Error fetching rainfall timeline data:", err);
        });
        
      // Fetch temperature timeline data
      fetch(`/api/timeline-temperature?decade=${decade}`)
        .then(response => response.json())
        .then(tempData => {
          renderTempTimelineChart(tempData);
        })
        .catch(err => {
          console.error("Error fetching temperature timeline data:", err);
        });
    }
  
    // Function to render the rainfall timeline chart
    function renderRainTimelineChart(data) {
        // Display the average rainfall above the chart
        document.getElementById("rainValue").textContent =
          `Average Rainfall: ${data.avgPrecipitation?.toFixed(2)} mm`;
      
        const ctx = document.getElementById("timelineRainChart").getContext("2d");
        if (timelineRainChart && typeof timelineRainChart.destroy === "function") {
          timelineRainChart.destroy();
        }
        timelineRainChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Avg Precipitation (mm)'],
            datasets: [{
              label: `Decade ${data.decade}‑${parseInt(data.decade) + 9}`,
              data: [data.avgPrecipitation],
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `Rainfall Averages for Decade ${data.decade}‑${parseInt(data.decade) + 9}`
              }
            }
          }
        });
      }
      
  
    // Function to render the temperature timeline chart
    function renderTempTimelineChart(data) {
        // Display the average temperature above the chart
        document.getElementById("tempValue").textContent =
          `Average Temperature: ${data.avgTemperature?.toFixed(2)} °C`;
      
        const ctx = document.getElementById("timelineTempChart").getContext("2d");
        if (timelineTempChart && typeof timelineTempChart.destroy === "function") {
          timelineTempChart.destroy();
        }
        timelineTempChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Avg Temperature (°C)'],
            datasets: [{
              label: `Decade ${data.decade}‑${parseInt(data.decade) + 9}`,
              data: [data.avgTemperature],
              backgroundColor: 'rgba(255, 159, 64, 0.7)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `Temperature Averages for Decade ${data.decade}‑${parseInt(data.decade) + 9}`
              }
            }
          }
        });
      }
      
  });