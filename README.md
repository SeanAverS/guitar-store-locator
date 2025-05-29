## Find Guitar Stores Near You 

This app locates nearby guitar stores using your location and Google Maps 

---

## Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/seanavers/guitar-store-locator.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd guitar-store-locator
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Create your `.env` file in the root of your project:**
   then add your Google Maps API key and Map ID:

    ```
    REACT_APP_Maps_API_KEY=your_key_here
    REACT_APP_MAP_ID=your_map_id_here
    ```
---

## Deployment 
This setup uses `gh-pages` for the frontend and Render for the backend

## Local Deployment 
Navigate to `guitar-store-locator` directory in your terminal

1.   **Frontend:** 
        ```bash
        npm start
        ```
2.   **Backend:** (in a seperate terminal) 
        ```bash
        node server.mjs
        ```
## Cloud Deployment 

1. **Frontend Deployment (Github Pages):**
   - **Configure** `package.json`: Add a `homepage` property to `package.json` that points to your GitHub Pages URL  (e.g., `https://your-github-username.github.io/your-repo-name`).
     
   - **Install** `gh-pages` if you haven't already: 
     ```bash
        npm install --save-dev gh-pages
     ```
   - **Add Deploy Script:** located in `scripts` section of `package.json`
     ```bash
        "scripts": {
        "predeploy": "npm run build",
        "deploy": "gh-pages -d build",
        "start": "react-scripts start",
        "build": "react-scripts build",
         ...
        }
    - **Run Deployment from your project root:** 
      ```bash
        npm run deploy
      ```
      This builds the React App and pushes it to the `gh-pages` branch
2. **Backend Deployment (Render)**: 
- **Create a New Web Service On Render:**
     - Go to your Render Dashboard.
     - Click "New" -> "Web Service".
     - Connect your GitHub repository containing the backend code.
- **Configure Build and Start Commands:**
     - "Build Command" should be `npm install` or empty and "Start Command" should be `node server.mjs`
- **Set Environment Variables:**
     - In the Dashboard add `REACT_APP_Maps_API_KEY`
- **CORS Configuration:**
     - Modify `server.mjs` to allow requests from your Github Pages frontend
     - Add a CORS middleware (e.g using `cors` npm package) to your Express app that allows requests from `https://your-github-username.github.io.`
- **Deploy:**
     - Render automatically deploys backend
     - Note the public URL provided  (`e.g., https://your-backend-name.onrender.com`).