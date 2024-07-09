import React from 'react';
import Maps from './components/Maps.js';

const App = () => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  return (
    <div>
      <h1>Guitar Store Locator</h1>
      <Maps apiKey={apiKey} />
    </div>
  );
};

export default App;
