// /backend/app.js
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the frontend folder
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Coordinates for states and union territories
const stateCoordinates = {
  // States
  "Andhra Pradesh": { latitude: 15.9129, longitude: 79.74 },
  "Arunachal Pradesh": { latitude: 28.2180, longitude: 94.7278 },
  "Assam": { latitude: 26.2006, longitude: 92.9376 },
  "Bihar": { latitude: 25.0961, longitude: 85.3131 },
  "Chhattisgarh": { latitude: 21.2787, longitude: 81.8661 },
  "Goa": { latitude: 15.2993, longitude: 74.1240 },
  "Gujarat": { latitude: 22.2587, longitude: 71.1924 },
  "Haryana": { latitude: 29.0588, longitude: 76.0856 },
  "Himachal Pradesh": { latitude: 31.1048, longitude: 77.1734 },
  "Jharkhand": { latitude: 23.6102, longitude: 85.2799 },
  "Karnataka": { latitude: 15.3173, longitude: 75.7139 },
  "Kerala": { latitude: 10.8505, longitude: 76.2711 },
  "Madhya Pradesh": { latitude: 22.9734, longitude: 78.6569 },
  "Maharashtra": { latitude: 19.7515, longitude: 75.7139 },
  "Manipur": { latitude: 24.6637, longitude: 93.9063 },
  "Meghalaya": { latitude: 25.4670, longitude: 91.3662 },
  "Mizoram": { latitude: 23.1645, longitude: 92.9376 },
  "Nagaland": { latitude: 26.1584, longitude: 94.5624 },
  "Odisha": { latitude: 20.9517, longitude: 85.0985 },
  "Punjab": { latitude: 30.7333, longitude: 76.7794 },
  "Rajasthan": { latitude: 27.0238, longitude: 74.2179 },
  "Sikkim": { latitude: 27.5330, longitude: 88.5122 },
  "Tamil Nadu": { latitude: 11.1271, longitude: 78.6569 },
  "Telangana": { latitude: 18.1124, longitude: 79.0193 },
  "Tripura": { latitude: 23.9408, longitude: 91.9882 },
  "Uttar Pradesh": { latitude: 26.8467, longitude: 80.9462 },
  "Uttarakhand": { latitude: 30.0668, longitude: 79.0193 },
  "West Bengal": { latitude: 22.9868, longitude: 87.8550 },
  
  // Union Territories
  "Andaman and Nicobar Islands": { latitude: 11.67, longitude: 92.75 },
  "Chandigarh": { latitude: 30.74, longitude: 76.79 },
  "Dadra and Nagar Haveli and Daman and Diu": { latitude: 20.42, longitude: 72.96 },
  "Lakshadweep": { latitude: 10.57, longitude: 72.64 },
  "Delhi": { latitude: 28.6139, longitude: 77.2090 },
  "Puducherry": { latitude: 11.9416, longitude: 79.8083 },
  "Jammu and Kashmir": { latitude: 34.08, longitude: 74.79 },
  "Ladakh": { latitude: 34.15, longitude: 77.57 }
};

// Async function to fetch fallback data using Open-Meteo API for a specific year
async function fetchFallbackData(state, year) {
  const { latitude, longitude } = stateCoordinates[state];
  const start_date = `${year}-01-01`;
  const end_date = `${year}-12-31`;
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${start_date}&end_date=${end_date}&daily=temperature_2m_mean,precipitation_sum&timezone=Asia%2FKolkata`;
  const response = await axios.get(url);
  const data = response.data;
  
  if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
    throw new Error("No fallback data available");
  }
  
  const dailyTemps = data.daily.temperature_2m_mean;
  const dailyPrecip = data.daily.precipitation_sum;
  
  const avgTemp = dailyTemps.reduce((a, b) => a + b, 0) / dailyTemps.length;
  const totalPrecip = dailyPrecip.reduce((a, b) => a + b, 0);
  
  return {
    temperature: parseFloat(avgTemp.toFixed(2)),
    precipitation: parseFloat(totalPrecip.toFixed(2))
  };
}

// API endpoint to get climate data for a state/region
app.get('/api/climate/:state', async (req, res) => {
  const state = req.params.state;
  
  // Ensure state exists in our coordinate mapping
  if (!stateCoordinates[state]) {
    return res.status(400).json({ error: "Unknown state or region" });
  }
  
  let dataByYear = {};  // Object to store data for each year
  
  // Path to Excel file (e.g., data/Delhi.xlsx)
  const filePath = path.join(__dirname, '../data', `${state}.xlsx`);
  
  // Read and parse the Excel file if it exists
  if (fs.existsSync(filePath)) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(sheet);
      
      // Loop through each row and read the YEAR and ANNUAL precipitation data.
      // Our Excel sheet columns are: SUBDIVISION, YEAR, JAN, FEB, ..., DEC, ANNUAL, Jan-Feb, Mar-May, Jun-Sep, Oct-Dec
      jsonData.forEach(row => {
        const year = row['YEAR'];
        // Ensure the year is within the desired range
        if (year >= 2005 && year <= 2020) {
          dataByYear[year] = {
            // Use the official precipitation data from the "ANNUAL" column.
            // Temperature is not provided in these sheets, so we leave it undefined.
            precipitation: Number(row['ANNUAL']),
            temperature: undefined
          };
        }
      });
    } catch (err) {
      console.error(`Error reading Excel file for ${state}:`, err);
    }
  } else {
    console.warn(`Excel file not found for ${state}. Using fallback data for all years.`);
  }
  
  // For each year from 2005 to 2020, ensure we have both temperature and precipitation data.
  // For precipitation: use Excel data if available, otherwise fallback.
  // For temperature: always fetch fallback data if it's missing.
  for (let year = 2005; year <= 2020; year++) {
    if (!dataByYear[year]) {
      try {
        const fallback = await fetchFallbackData(state, year);
        dataByYear[year] = fallback;
      } catch (err) {
        console.error(`Error fetching fallback data for ${state} in ${year}:`, err);
      }
    } else {
      // If temperature is missing, fetch fallback data for temperature.
      if (dataByYear[year].temperature === undefined) {
        try {
          const fallback = await fetchFallbackData(state, year);
          dataByYear[year].temperature = fallback.temperature;
          // Optionally, if precipitation is missing or seems off, you can update it as well.
          if (!dataByYear[year].precipitation) {
            dataByYear[year].precipitation = fallback.precipitation;
          }
        } catch (err) {
          console.error(`Error fetching fallback temperature for ${state} in ${year}:`, err);
        }
      }
    }
  }
  
  // Construct arrays for response
  const yearsArray = [];
  const temperatureTrend = [];
  const precipitationTrend = [];
  
  for (let year = 2005; year <= 2020; year++) {
    if (dataByYear[year]) {
      yearsArray.push(year.toString());
      temperatureTrend.push(dataByYear[year].temperature);
      precipitationTrend.push(dataByYear[year].precipitation);
    }
  }
  
  res.json({
    state: state,
    years: yearsArray,
    temperatureTrend: temperatureTrend,
    precipitationTrend: precipitationTrend
  });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/timeline', async (req, res) => {
  const decadeParam = req.query.decade;
  const decade = parseInt(decadeParam);
  if (isNaN(decade) || decade < 1905 || decade > 2020) {
    return res.status(400).json({ error: "Invalid decade parameter" });
  }

  // Prepare arrays to aggregate data for the selected decade (from decade to decade+9)
  let aggregatedPrecip = [];
  let aggregatedTemp = [];
  
  // Path to the Excel data folder
  const dataFolder = path.join(__dirname, '../data');
  let files = [];
  try {
    files = fs.readdirSync(dataFolder).filter(file => file.endsWith('.xlsx'));
  } catch (err) {
    console.error("Error reading data folder:", err);
    return res.status(500).json({ error: "Data folder read error" });
  }

  // Loop through each Excel file and aggregate data for rows within the selected decade
  for (const file of files) {
    try {
      const workbook = xlsx.readFile(path.join(dataFolder, file));
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(sheet);
      
      jsonData.forEach(row => {
        const year = parseInt(row['YEAR']);
        // Select rows where year is between decade and decade+9 (inclusive)
        if (year >= decade && year < decade + 10) {
          // Use the "ANNUAL" column for precipitation
          const precip = Number(row['ANNUAL']);
          if (!isNaN(precip)) {
            aggregatedPrecip.push(precip);
          }
          // If temperature data exists (or you might add fallback logic), add it if available
          if (row['Temperature']) {
            const temp = Number(row['Temperature']);
            if (!isNaN(temp)) {
              aggregatedTemp.push(temp);
            }
          }
        }
      });
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
    }
  }

  // Calculate averages if data exists; otherwise, return null for that metric
  const avgPrecipitation = aggregatedPrecip.length > 0 ?
    aggregatedPrecip.reduce((a, b) => a + b, 0) / aggregatedPrecip.length : null;
  const avgTemperature = aggregatedTemp.length > 0 ?
    aggregatedTemp.reduce((a, b) => a + b, 0) / aggregatedTemp.length : null;

  res.json({
    decade: decade,
    avgPrecipitation: avgPrecipitation,
    avgTemperature: avgTemperature
  });
});


// New News API Endpoint: /api/news
app.get('/api/news', async (req, res) => {
  // Replace 'your_api_key_here' with your actual API key or load it from an environment variable
  const apiKey = process.env.NEWS_API_KEY || 'your_api_key_here';
  // Query for news related to "climate change" in India.
  // You can adjust query parameters as needed.
  const url = `https://newsapi.org/v2/everything?q=climate+change+India&language=en&sortBy=publishedAt&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    // You might filter or map the response if needed
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Error fetching news" });
  }
});

// Endpoint to fetch aggregated temperature data for a selected decade using the "Average" column
app.get('/api/timeline-temperature', (req, res) => {
  const decadeParam = req.query.decade;
  const decade = parseInt(decadeParam);
  if (isNaN(decade)) {
    return res.status(400).json({ error: "Invalid decade parameter" });
  }
  
  const tempFilePath = path.join(__dirname, '../data', 'temperature.xlsx');
  try {
    if (fs.existsSync(tempFilePath)) {
      const workbook = xlsx.readFile(tempFilePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(sheet);
      
      // Filter rows for the given decade (from decade to decade+9)
      const decadeData = jsonData.filter(row => {
        const year = parseInt(row['YEAR']);
        return year >= decade && year < (decade + 10);
      });
      
      if (decadeData.length === 0) {
        return res.json({ decade: decade, avgTemperature: null });
      }
      
      // Use the "Average" column for temperature values.
      // If the "Average" column is not present, you could fallback to "TEMPERATURE".
      const avgTemp = decadeData.reduce((sum, row) => {
        const tempValue = row['Average'] !== undefined 
                          ? Number(row['Average']) 
                          : Number(row['TEMPERATURE']);
        return sum + tempValue;
      }, 0) / decadeData.length;
      
      return res.json({
        decade: decade,
        avgTemperature: avgTemp
      });
    } else {
      return res.status(404).json({ error: 'Temperature data file not found.' });
    }
  } catch (err) {
    console.error("Error reading temperature file:", err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
