import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React, { Suspense } from "react";
import Maps from "./Maps";

// Create individual mock functions
const mockUseJsApiLoader = jest.fn();
const mockUseTrackLocation = jest.fn();
const mockUseNearbyStores = jest.fn();
const mockUseMarkers = jest.fn();

// Mocks
jest.mock("@react-google-maps/api", () => ({
  useJsApiLoader: (...args) => mockUseJsApiLoader(...args),
  GoogleMap: ({ children }) => <div>{children}</div>,
  Marker: () => null,
  InfoWindow: ({ children }) => <div>{children}</div>,
}));

jest.mock("../hooks/useTrackLocation.js", () => ({
  __esModule: true,
  default: (...args) => mockUseTrackLocation(...args),
}));

jest.mock("../hooks/useNearbyStores.js", () => ({
  __esModule: true,
  default: (...args) => mockUseNearbyStores(...args),
}));

jest.mock("../hooks/useMarkers.js", () => ({
  __esModule: true,
  default: (...args) => mockUseMarkers(...args),
}));

jest.mock("../components/MapContainer.js", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="map-container">{children}</div>,
}));

jest.mock("../components/InfoWindowCard.js", () => ({
  __esModule: true,
  default: ({ marker }) => (
    <div data-testid="infowindow-card">{marker?.name}</div>
  ),
}));

// Reusable helper to wrap Maps in Suspense
const renderWithSuspense = (ui) =>
  render(<Suspense fallback={<div>Loading...</div>}>{ui}</Suspense>);

describe("Maps component", () => {
  const mockLocation = { lat: 40.7128, lng: -74.006 };
  beforeEach(() => {
    jest.clearAllMocks();

    // Default "happy path"
    mockUseJsApiLoader.mockReturnValue({
      isLoaded: true,
      loadError: null,
    });

    mockUseTrackLocation.mockReturnValue({
      currentLocation: mockLocation,
      locationError: null,
    });

    mockUseNearbyStores.mockReturnValue({
      stores: [],
      storesFetched: false,
      fetchNearbyStores: jest.fn(),
      debouncedFetchNearbyStores: jest.fn(),
      error: null,
    });

    mockUseMarkers.mockReturnValue({
      loadMarkers: jest.fn(),
    });
  });

  test("should not render anything when the Google Maps API is not loaded", () => {
    mockUseJsApiLoader.mockReturnValue({
      isLoaded: false,
      loadError: null,
    });

    const { container } = renderWithSuspense(<Maps />);
    expect(container).toBeEmptyDOMElement();
  });

  test("should not render anything when the Google Maps API fails to load", () => {
    mockUseJsApiLoader.mockReturnValue({
      isLoaded: false,
      loadError: new Error("API failed to load"),
    });

    const { container } = renderWithSuspense(<Maps />);
    expect(container).toBeEmptyDOMElement();
  });

  test("should render the MapContainer when the API is loaded", async () => {
    renderWithSuspense(<Maps />);
    await waitFor(() => {
      expect(screen.getByTestId("map-container")).toBeInTheDocument();
    });
  });

  test("should display a message when no stores are found near the user's location", async () => {
    mockUseNearbyStores.mockReturnValue({
      stores: [],
      storesFetched: true,
      fetchNearbyStores: jest.fn(),
      debouncedFetchNearbyStores: jest.fn(),
      error: null,
    });

    renderWithSuspense(<Maps />);
    await waitFor(() => {
      expect(screen.getByText(/no stores found/i)).toBeInTheDocument();
    });
  });

  test("should display an error message if fetching nearby stores fails", async () => {
    mockUseNearbyStores.mockReturnValue({
      stores: [],
      storesFetched: true,
      fetchNearbyStores: jest.fn(),
      debouncedFetchNearbyStores: jest.fn(),
      error: "Network error",
    });

    renderWithSuspense(<Maps />);
    await waitFor(() => {
      expect(screen.getByText(/error fetching stores/i)).toBeInTheDocument();
    });
  });
});
