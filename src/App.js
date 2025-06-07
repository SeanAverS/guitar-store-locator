import React from "react";
const Maps = React.lazy(() => import("./components/Maps.js"));   

const App = () => {
  return (
    <div>
      <h1>Guitar Store Locator</h1>
      <p>Locate and get directions to guitar stores around you</p>
        <Maps />
    </div>
  );
};

export default App;
