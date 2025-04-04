document.addEventListener("DOMContentLoaded", function() {
    const stateDropdown = document.getElementById("cropStateDropdown");
    const getCropBtn = document.getElementById("getCropBtn");
    const cropOutput = document.getElementById("cropOutput");
  
    getCropBtn.addEventListener("click", function() {
      const selectedState = stateDropdown.value;
      if (!selectedState) {
        alert("Please select a state or union territory.");
        return;
      }
  
      fetch(`/api/crop-recommendation?state=${selectedState}`)
        .then(response => response.json())
        .then(data => {
          renderCropRecommendation(data);
        })
        .catch(err => {
          console.error("Error fetching crop recommendation:", err);
          cropOutput.innerHTML = "<p>Error fetching crop recommendation. Please try again later.</p>";
        });
    });
  
    function renderCropRecommendation(data) {
      cropOutput.innerHTML = `
        <h3>Recommended Crop for ${data.state}</h3>
        <p><strong>Average Temperature:</strong> ${data.avgTemperature ? data.avgTemperature.toFixed(1) + " °C" : "Data not available"}</p>
        <p><strong>Average Precipitation:</strong> ${data.avgPrecipitation ? data.avgPrecipitation.toFixed(0) + " mm" : "Data not available"}</p>
        <p><strong>Recommended Crop:</strong> ${data.recommendedCrop}</p>
        <p><strong>Explanation:</strong> ${data.explanation}</p>
      `;
    }
  });
  