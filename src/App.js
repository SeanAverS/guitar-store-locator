import React from "react";
const Maps = React.lazy(() => import("./components/Maps.js"));

const App = () => {
  return (
    <div>
      <h1>Guitar Store Locator</h1>
      <Maps />
       <footer className="footer-container">
        <p className="footer-text">
          Coded by <a href="https://seanavers.github.io/portfolio/">Sean Suguitan</a>
        </p>
      </footer>
    </div>
  );
};

export default App;
