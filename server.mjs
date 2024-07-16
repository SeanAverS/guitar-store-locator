import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get('/api/nearbyStores', async (req, res) => {
  const { lat, lng, limit } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key is not set' });
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=store&key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google API error: ${data.status} - ${data.error_message}`);
    }

    let results = data.results;
    if (limit) {
      results = results.slice(0, parseInt(limit, 10));
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching nearby stores:', error);
    res.status(500).json({ error: 'Error fetching nearby stores', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
