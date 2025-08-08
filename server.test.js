import request from "supertest";
import mongoose from "mongoose";

let app;

beforeAll(async () => {
  const module = await import("./server.mjs");
  app = module.default;
});

describe("Backend minimal tests", () => {
  // Health check
  it("GET / should return backend status", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Backend is running/i);
  });

  // Google API 
  it("GET /api/nearbyStores should return nearby guitar stores", async () => {
    const lat = 37.7749;
    const lng = -122.4194;

    const res = await request(app)
      .get("/api/nearbyStores")
      .query({ lat, lng });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Save store to MongoDB
  it("POST /api/stores should save a store", async () => {
    const storeData = {
      placeId: "test-place-id",
      name: "Test Guitar Store",
      address: "123 Test St",
      phone: "123-456-7890",
      website: "https://test.com",
      latitude: 37.7749,
      longitude: -122.4194,
    };

    const res = await request(app).post("/api/stores").send(storeData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("placeId", "test-place-id");
  });

  // Get saved stores from MongoDB
  it("GET /api/stores should return saved stores", async () => {
    const res = await request(app).get("/api/stores");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Nearby MongoDB store search
  it("GET /api/stores/nearby should return nearby saved stores", async () => {
    const lat = 37.7749;
    const lng = -122.4194;

    const res = await request(app)
      .get("/api/stores/nearby")
      .query({ lat, lng });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
