/* eslint-disable jsx-a11y/aria-role */
import React from "react";
import { render, screen } from "@testing-library/react";
import Maps from "./components/Maps.js";
import { useJsApiLoader } from "@react-google-maps/api";

jest.mock("@react-google-maps/api", () => ({
  useJsApiLoader: jest.fn(() => ({ isLoaded: true, loadError: null })),
  GoogleMap: ({ children, mapContainerClassName, center, zoom }) => (
    <div
      role="map"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      className={mapContainerClassName}
    >
      {children}
    </div>
  ),
  Marker: ({ position }) => (
    <div role="marker" data-position={JSON.stringify(position)} />
  ),
  InfoWindow: ({ children, position }) => (
    <div role="infowindow" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
}));

describe("Maps Component", () => {
  beforeAll(() => {
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success, error) => {
        success({
          // Mock location
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
        });
      }),
    };
  });

  afterAll(() => {
    delete global.navigator.geolocation;
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("renders loading messages while maps are loading", () => {
    useJsApiLoader.mockReturnValue({ isLoaded: false, loadError: null });

    render(<Maps />);
  });

  test("renders error message if there is a loadError", () => {
    useJsApiLoader.mockReturnValue({
      isLoaded: false,
      loadError: new Error("Load Error"),
    });

    render(<Maps />);
  });

  test("renders the map when isLoaded is true and there is no loadError", async () => {
    useJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null });

    render(<Maps />);
    const mapElement = await screen.findByRole("map");
    expect(mapElement).toBeInTheDocument();
  });

  test("calls geolocation API to get user location", () => {
    useJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null });

    render(<Maps />);
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });
});
