import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// The component we are testing
import Maps from './Maps';

// Import hooks to mock them
import useNearbyStores from '../hooks/useNearbyStores';
import { useJsApiLoader } from '@react-google-maps/api'; // Import useJsApiLoader to mock it

// Mock the lazy loaded components (still needed)
jest.mock('./MapContainer', () => ({ children, ...props }) => (
  <div data-testid="mock-map-container" {...props}>
    {children}
  </div>
));
jest.mock('./InfoWindowCard', () => ({ marker, onClose, directionsUrl }) => (
  <div data-testid="mock-info-window-card">
    {marker.name}
    <button onClick={onClose}>Close</button>
  </div>
));

// Mocks for hooks
jest.mock('../hooks/useNearbyStores');

// NEW MOCK: Mock useJsApiLoader to control its loading state
jest.mock('@react-google-maps/api', () => ({
  // Keep the original module functionality for everything else
  ...jest.requireActual('@react-google-maps/api'),
  useJsApiLoader: jest.fn(), // Mock only useJsApiLoader
}));


describe('Maps Component - Initial Load', () => {
  const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // SF fallback coordinates

  let mockFetchNearbyStores;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFetchNearbyStores = jest.fn();

    // Configure useJsApiLoader mock to immediately return loaded state
    useJsApiLoader.mockReturnValue({
      isLoaded: true, // Crucial: Simulate the API being loaded
      loadError: null,
    });


    // Mock useNearbyStores as before
    useNearbyStores.mockReturnValue({
      stores: [],
      storesFetched: false,
      fetchNearbyStores: mockFetchNearbyStores,
      debouncedFetchNearbyStores: jest.fn(),
      loading: false,
      error: null,
    });

    // Mock navigator.geolocation.getCurrentPosition to call the error callback
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((successCallback, errorCallback) => {
          Promise.resolve().then(() => {
            // Pass an error object that includes the code AND the constants
            const mockError = {
              code: 1, // This is the numerical code for PERMISSION_DENIED
              message: "User denied geolocation permission."
            };
            // Manually add the constants to the mock error object for the switch statement to work
            mockError.PERMISSION_DENIED = 1;
            mockError.POSITION_UNAVAILABLE = 2;
            mockError.TIMEOUT = 3;

            errorCallback(mockError);
          });
        }),
        watchPosition: jest.fn(),
        clearWatch: jest.fn(),
      },
      configurable: true,
    });

    // Also mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('handles initial load when geolocation permission is denied', async () => {
    render(<Maps defaultCenter={defaultCenter} />);

    await waitFor(() => {
      expect(mockFetchNearbyStores).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    expect(mockFetchNearbyStores).toHaveBeenCalledWith(defaultCenter);

    expect(screen.getByText(/Location access denied\. Please enable your location in the browser\./i)).toBeInTheDocument();
    expect(screen.getByText(/Displaying stores near San Francisco as a fallback\./i)).toBeInTheDocument();
    expect(screen.queryByText(/No stores found near your location\./i)).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-map-container')).toBeInTheDocument();
  });
});