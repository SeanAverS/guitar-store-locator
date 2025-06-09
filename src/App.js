import React from "react";
const Maps = React.lazy(() => import("./components/Maps.js"));   

const App = () => {
  return (
    <div>
      <h1>Guitar Store Locator</h1>
      <p>Locate guitar stores near you</p>
        <Maps />
    </div>
  );
};

export default App;
