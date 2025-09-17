/**
 * Handle api requests then validate response
 * @param {string} url The endpoint to fetch data from
 * @returns {Promise<Array>} Return store data in an array
 * @throws {Error} Network response error
 */
export const fetchData = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    console.error(`Data fetched from ${url} is not an array`);
    return [];
  }
  return data;
};