document.addEventListener("DOMContentLoaded", function() {
    // Listen for state selection changes from a dropdown
    var stateDropdown = document.getElementById("stateDropdown");
    stateDropdown.addEventListener("change", function() {
      var selectedState = stateDropdown.value;
      fetchStateData(selectedState);
    });
  
    // Optionally, load data for a default state on page load:
    // fetchStateData("Chhattisgarh");
  
    // Function to fetch state-specific climate data from your API
    function fetchStateData(state) {
      fetch(`/api/climate/${state}`)
        .then(response => response.json())
        .then(data => {
          renderCharts(data);
        })
        .catch(err => {
          console.error("Error fetching state data:", err);
        });
    }
  
    // Function to render charts and update the dynamic Agricultural Impact section
    function renderCharts(data) {
      var years = data.years;
      var tempData = data.temperatureTrend;
      var precData = data.precipitationTrend;
  
      // Create Temperature Chart
      var tempCtx = document.getElementById("tempChart").getContext("2d");
      if (window.tempChart && typeof window.tempChart.destroy === "function") {
        window.tempChart.destroy();
      }
      window.tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [{
            label: 'Temperature (°C)',
            data: tempData,
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
              text: 'Temperature Trend for ' + data.state
            }
          }
        }
      });
  
      // Create Precipitation Chart
      var precCtx = document.getElementById("precChart").getContext("2d");
      if (window.precChart && typeof window.precChart.destroy === "function") {
        window.precChart.destroy();
      }
      window.precChart = new Chart(precCtx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [{
            label: 'Precipitation (mm)',
            data: precData,
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
              text: 'Precipitation Trend for ' + data.state
            }
          }
        }
      });
  
      // Attach expand-on-click events to both charts
      attachExpandEvent("tempChart", window.tempChart);
      attachExpandEvent("precChart", window.precChart);
  
      // Update the Agricultural Impact & Adaptation section dynamically
      updateAgriculturalImpact(data);
    }
  
    // Function to attach a click event to a chart canvas to expand it in a modal
    function attachExpandEvent(canvasId, chartInstance) {
      var canvas = document.getElementById(canvasId);
      canvas.style.cursor = "pointer";
      canvas.addEventListener("click", function() {
        expandChart(chartInstance);
      });
    }
  
    // Function to open a modal with an expanded version of the chart
    function expandChart(chartInstance) {
      var modal = document.getElementById("chartModal");
      var modalCanvas = document.getElementById("expandedChart");
      var ctx = modalCanvas.getContext("2d");
  
      if (window.expandedChart && typeof window.expandedChart.destroy === "function") {
        window.expandedChart.destroy();
      }
  
      // Clone the existing chart configuration
      var config = JSON.parse(JSON.stringify(chartInstance.config));
      config.options = config.options || {};
      config.options.responsive = true;
      config.options.plugins = config.options.plugins || {};
      config.options.plugins.title = config.options.plugins.title || {};
      config.options.plugins.title.font = { size: 24 };
  
      window.expandedChart = new Chart(ctx, config);
      modal.style.display = "block";
    }
  
    // Close the modal when the close button is clicked
    document.querySelector(".close").addEventListener("click", function() {
      var modal = document.getElementById("chartModal");
      modal.style.display = "none";
      if (window.expandedChart && typeof window.expandedChart.destroy === "function") {
        window.expandedChart.destroy();
      }
    });
  
    // Close the modal if the user clicks outside the modal content
    window.addEventListener("click", function(event) {
      var modal = document.getElementById("chartModal");
      if (event.target === modal) {
        modal.style.display = "none";
        if (window.expandedChart && typeof window.expandedChart.destroy === "function") {
          window.expandedChart.destroy();
        }
      }
    });
  
    // Function to update the Agricultural Impact & Adaptation section dynamically
    function updateAgriculturalImpact(data) {
      var impactSection = document.getElementById("agriculturalImpact");
      var avgTemp = data.temperatureTrend.reduce((a, b) => a + b, 0) / data.temperatureTrend.length;
      var avgPrec = data.precipitationTrend.reduce((a, b) => a + b, 0) / data.precipitationTrend.length;
  
      var impactText = `<h2>Agricultural Impact & Adaptation</h2>
                        <p>For <strong>${data.state}</strong>, our dynamic analysis indicates an average temperature of <strong>${avgTemp.toFixed(1)}°C</strong> and an average annual precipitation of <strong>${avgPrec.toFixed(0)} mm</strong> over the analyzed period.</p>`;
  
      // Dynamic messaging for temperature
      if (avgTemp >= 30) {
        impactText += `<p>High temperatures in this region are likely stressing crops, potentially leading to reduced yields if not properly managed. It is crucial for farmers to consider heat-tolerant crop varieties and modern irrigation techniques to counteract these effects.</p>`;
      } else if (avgTemp < 25) {
        impactText += `<p>The relatively cooler temperatures create a favorable environment for many crops, although vigilance remains essential. Continuous monitoring is recommended to detect even moderate shifts that could influence overall productivity.</p>`;
      } else {
        impactText += `<p>The temperature trends here are moderate, generally supporting crop growth. However, proactive monitoring is advised to quickly respond to any sudden changes that might impact agricultural productivity.</p>`;
      }
  
      // Dynamic messaging for precipitation
      if (avgPrec < 800) {
        impactText += `<p>Lower precipitation levels indicate potential water stress during critical growing periods. Farmers may benefit from water conservation measures and supplemental irrigation to maintain stable production.</p>`;
      } else if (avgPrec > 1500) {
        impactText += `<p>Excessive rainfall can lead to challenges such as flooding and waterlogging, potentially harming crops and soil structure. It is advisable to implement effective drainage systems and flood management strategies.</p>`;
      } else {
        impactText += `<p>While the overall precipitation appears adequate, its variability and occasional extreme events necessitate localized adaptation strategies. Tailored water management and flexible farming practices can help mitigate these challenges.</p>`;
      }
  
      impactText += `<div class="case-studies">
                       <a href="case-studies.html" class="cta-button">Lessons from the field</a>
                     </div>`;
  
      impactSection.innerHTML = impactText;
    }

    document.addEventListener("DOMContentLoaded", function() {
        // Existing code to fetch and render other charts...
        
        // Function to fetch temperature data
        function fetchTemperatureData() {
          fetch('/api/temperature')
            .then(response => response.json())
            .then(data => {
              renderTemperatureChart(data);
            })
            .catch(err => console.error("Error fetching temperature data:", err));
        }
        
        // Function to render the temperature chart on the Analysis page
        function renderTemperatureChart(data) {
          var ctx = document.getElementById("nationalTempChart").getContext("2d");
          if (window.nationalTempChart && typeof window.nationalTempChart.destroy === "function") {
            window.nationalTempChart.destroy();
          }
          window.nationalTempChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: data.years,
              datasets: [{
                label: 'National Temperature (°C)',
                data: data.temperatureTrend,
                borderColor: 'orange',
                fill: false,
                tension: 0.1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: 'Historical Temperature Trends (1901-2017)'
                }
              }
            }
          });
        }
        
        // Call this function on page load
        fetchTemperatureData();
        
        // Existing renderCharts() and updateAgriculturalImpact() functions for other charts...
      });
      
  });
  