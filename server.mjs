import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import NodeCache from "node-cache";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const cache = new NodeCache({ stdTTL: 600 });

app.use(cors());

const fetchStores = async (lat, lng, keyword) => {
  const cacheKey = `${lat},${lng},${keyword}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=${keyword}&key=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Google API returned status ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== "OK") {
    console.error("Google Maps API Error:", data);
    throw new Error(`Google API error: ${data.status} - ${data.error_message}`);
  }

  cache.set(cacheKey, data.results);
  return data.results;
};

app.get("/api/nearbyStores", async (req, res) => {
  const { lat, lng, limit } = req.query;
  if (!lat || !lng || !apiKey) {
    return res.status(400).json({ error: "Invalid parameters or API key" });
  }
  try {
    const guitarStores = await fetchStores(lat, lng, "guitar");

    const results = limit
      ? guitarStores.slice(0, parseInt(limit, 10))
      : guitarStores;

    res.json(results);
  } catch (error) {
    console.error("Error fetching nearby stores:", error);
    res
      .status(500)
      .json({ error: "Error fetching nearby stores", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
