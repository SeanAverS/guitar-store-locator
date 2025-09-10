/**
 * Delay function until x amount of time passes
 * Used in useNearbyStores.js and Maps.js to prevent too many store fetches
 * @param {Function} func - The function to debounce.
 * @param {number} wait - X number of milliseonds before function call
 * @returns {Function} A debounced version of the function.
 */
export function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
