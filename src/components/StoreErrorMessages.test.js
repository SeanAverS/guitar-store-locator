import { render, screen } from "@testing-library/react";
import StoreErrorMessages from "./StoreErrorMessages";

describe("StoreErrorMessages", () => {
  test("should display 'No stores found' message when no stores are found", () => {
    const props = {
      storesFetched: true,
      stores: [],
      locationError: null,
      storesError: null,
    };
    render(<StoreErrorMessages {...props} />);
    expect(screen.getByText(/No stores found near your location/i)).toBeInTheDocument();
  });

  test("should display 'Error fetching stores' message when storesError is present", () => {
    const props = {
      storesFetched: false,
      stores: [],
      locationError: null,
      storesError: "Test error message",
    };
    render(<StoreErrorMessages {...props} />);
    expect(screen.getByText(/Error fetching stores:/i)).toBeInTheDocument();
  });

  test("should not render anything when there are no errors and stores are not fetched", () => {
    const props = {
      storesFetched: false,
      stores: [],
      locationError: null,
      storesError: null,
    };
    render(<StoreErrorMessages {...props} />);
    expect(screen.queryByText(/No stores found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error fetching stores/i)).not.toBeInTheDocument();
  });

  test("should not render anything when there are stores present", () => {
    const props = {
      storesFetched: true,
      stores: [{ name: "store1" }],
      locationError: null,
      storesError: null,
    };
    render(<StoreErrorMessages {...props} />);
    expect(screen.queryByText(/No stores found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error fetching stores/i)).not.toBeInTheDocument();
  });
});