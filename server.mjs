import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import NodeCache from "node-cache";import mongoose from "mongoose"; 

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 5000;
const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const cache = new NodeCache({ stdTTL: 600 });

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// guitar store schema 
const storeSchema = new mongoose.Schema({
  placeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: String,
  phone: String,
  website: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false
    }
  },
}, { timestamps: true });

storeSchema.index({ location: '2dsphere' });

const Store = mongoose.model('Store', storeSchema);

// CORS Middleware 
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json()); // parse 

const fetchStores = async (lat, lng, keyword) => {
  const cacheKey = `google-${lat},${lng},${keyword}`; 
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for Google search: ${cacheKey}`);
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
    console.error("Error fetching nearby stores from Google:", error);
    res
      .status(500)
      .json({ error: "Error fetching nearby stores from Google", details: error.message });
  }
});

// store data MongoDB routing
app.post('/api/stores', async (req, res) => {
  try {
    const { placeId, name, address, phone, website, latitude, longitude } = req.body;

    if (!placeId || !name) {
      return res.status(400).json({ message: 'Place ID and name are required.' });
    }

    const storeData = {
      placeId,
      name,
      address,
      phone,
      website,
    };

    if (latitude !== undefined && longitude !== undefined) {
      storeData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)] 
      };
    }

    const store = await Store.findOneAndUpdate(
      { placeId: placeId }, 
      storeData,            
      {
        new: true,       
        upsert: true,      
        setDefaultsOnInsert: true 
      }
    );

    res.status(201).json(store); 
  } catch (error) {
    console.error('Error saving store to MongoDB:', error);
    if (error.code === 11000) { // MongoDB duplicate key error code
      return res.status(409).json({ message: 'Store with this Place ID already exists.' });
    }
    res.status(500).json({ message: 'Internal server error while saving store to database.', error: error.message });
  }
});

// Get store data from MongoDB
app.get('/api/stores', async (req, res) => {
  try {
    const stores = await Store.find({});// 'stores' collection
    res.status(200).json(stores);
  } catch (error) {
    console.error('Error fetching stores from MongoDB:', error);
    res.status(500).json({ message: 'Internal server error while fetching stores from database.', error: error.message });
  }
});

// custom stores intergration 
app.get('/api/stores/nearby', async (req, res) => {
  const { lat, lng, maxDistance = 5000 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and Longitude query parameters are required.' });
  }

  try {
    const nearbyStores = await Store.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)] 
          },
          $maxDistance: parseInt(maxDistance) 
        }
      }
    });
    res.status(200).json(nearbyStores);
  } catch (error) {
    console.error('Error fetching nearby stores from MongoDB:', error);
    res.status(500).json({ message: 'Internal server error while fetching nearby stores.', error: error.message });
  }
});


app.get("/", (req, res) => { 
  res.send("Backend is running. Use /api/nearbyStores to access Google Places API. Use /api/stores for your database.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});