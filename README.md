# English Dictionary Application

A full-stack, single-page dictionary web application built with vanilla JavaScript, Node.js, Express, and MongoDB.

## Features
- **Live Search**: Look up words instantly via a RESTful API.
- **Detailed Meanings**: View definitions grouped by part of speech, complete with example sentences.
- **Pronunciation Audio**: Hear UK and US pronunciations with interactive audio buttons.
- **Synonyms & Antonyms**: Explore related vocabulary.
- **Interactive Tags**: Click any synonym, antonym, or related word to instantly search for it.
- **Robust Error Handling**: Graceful fallback UI for missing words, network failures, or empty searches.
- **Accessible & Responsive**: Fully responsive across mobile, tablet, and desktop. Screen reader and keyboard friendly.

## Technologies Used
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+), DOM API
- **Backend**: Node.js, Express.js (v5)
- **Database**: MongoDB, Mongoose (v9)

## Architecture
The application uses a strict separation of concerns on both the frontend and backend.

### Frontend Structure
- `api.js`: Solely responsible for `fetch()` calls to the backend API. Parses responses and normalizes errors. Does not touch the DOM.
- `search.js`: Contains business logic and the central search pipeline (`runSearch`). Coordinates loading, success, and error states, but delegates actual DOM changes to `ui.js`.
- `ui.js`: Exclusively handles DOM manipulation, rendering data into the HTML structure, and managing CSS states.
- `app.js`: Initializes global event listeners (like audio playback and tag clicking) and bootstraps the modules on DOM load.

### Backend Structure
- `server.js`: Entry point. Connects to MongoDB and starts the Express server.
- `app.js`: Express configuration. Registers middleware, CORS, routing, and global error handlers.
- `routes/wordRoutes.js`: Defines the API endpoints (e.g., `GET /api/words/:word`).
- `controllers/wordController.js`: Handles HTTP requests/responses, invoking the service layer.
- `services/wordService.js`: Contains business logic, input validation, and invokes the database model.
- `models/Word.js`: Defines the Mongoose schema for the dictionary data.

## Installation & Setup

1. **Prerequisites**: Ensure you have Node.js (v20+) and MongoDB (running locally on port 27017) installed.
2. **Clone the repository** and navigate to the project root.
3. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```
4. **Environment Variables**:
   Copy the example config:
   ```bash
   cp .env.example .env
   ```
   Ensure `.env` contains:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/englishDictionary
   ```

## Running the Application

1. **Start the Backend**:
   ```bash
   cd backend
   node server.js
   ```
   The API will be available at `http://localhost:5000/api`.

2. **Start the Frontend**:
   Simply open `frontend/index.html` in your web browser (e.g., via Live Server or directly).

## Example API Request
```bash
GET http://localhost:5000/api/words/happy
```

**Response**:
```json
{
  "success": true,
  "data": {
    "word": "happy",
    "pronunciation": {
      "uk": "/ˈhæpi/",
      "us": "/ˈhæpi/"
    },
    "meanings": [
      {
        "partOfSpeech": "adjective",
        "definitions": [
          {
            "text": "Feeling or showing pleasure, contentment, or satisfaction.",
            "examples": ["She was happy with the result."]
          }
        ]
      }
    ]
  }
}
```

## Current Project Status
Phase 9 completed. The application is fully integrated, stable, and running via MongoDB with zero frontend mock data.

## Deployment Architecture

The application is designed to be deployed using a decoupled architecture:

**Frontend (Static Hosting)**
- The rontend directory contains pure static assets (HTML/CSS/JS) requiring no build step.
- Designed for deployment on CDN-backed static hosts (e.g., Vercel, Netlify, Cloudflare Pages).
- The API URL dynamically detects the environment and switches to the production backend automatically.

**Backend (Node.js/Express)**
- The Node.js API should be deployed to a cloud platform (e.g., Render, Railway).
- Requires environment variables: `NODE_ENV`, `MONGODB_URI`, `ALLOWED_ORIGINS`, and `PORT`.

**Database (MongoDB Atlas)**
- Production database should be hosted on MongoDB Atlas.
- Only the backend communicates securely with the database using the `MONGODB_URI` secret.

See \DEPLOYMENT.md\ for complete instructions on production setup and configuration.
