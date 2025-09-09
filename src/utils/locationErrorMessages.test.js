import { getLocationErrorMessage } from "./locationErrorMessages";

describe("getLocationErrorMessage", () => {
  test("should return 'Location access denied' for the denied code", () => {
    const errorMessage = getLocationErrorMessage(1); 
    expect(errorMessage).toBe(
      "Location access denied. Please enable your location in the browser."
    );
  });

  test("should return 'Position unavailable' for the unavailable code", () => {
    const errorMessage = getLocationErrorMessage(2); 
    expect(errorMessage).toBe(
      "Your location information is unavailable. Please check device settings."
    );
  });

  test("should return 'Timed out' for the timeout code", () => {
    const errorMessage = getLocationErrorMessage(3); 
    expect(errorMessage).toBe(
      "Timed out while trying to retrieve your location. Please try again."
    );
  });

  test("should return a generic message for any other code", () => {
    const errorMessage = getLocationErrorMessage(999); 
    expect(errorMessage).toBe(
      "An unknown error occurred while trying to get your location."
    );
  });
});