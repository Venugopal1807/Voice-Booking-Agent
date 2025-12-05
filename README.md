# 🎙️ Voice-Enabled Restaurant Booking Agent

> A full-stack MERN AI Agent that processes voice commands, checks weather conditions, and manages reservations intelligently.

## 🌟 Key Features
1.  **AI-Powered Parser (Gemini)**: Uses Google's **Gemini 1.5 Flash** (Free Tier) to extract structured booking data from speech.
2.  **Context Aware**: Handles natural conversations and missing data gracefully.
3.  **Real-Time Weather Integration**: Fetches data from OpenWeatherMap to suggest Indoor vs Outdoor seating logic automatically.
4.  **Double-Booking Prevention**: Checks database for conflicts before confirming.
5.  **Native Web Speech API**: Low latency, privacy-focused, no 3rd party audio stream dependencies.

## 🛠️ Tech Stack
-   **Frontend**: React (Vite), TailwindCSS, Web Speech API.
-   **Backend**: Node.js, Express.
-   **Database**: MongoDB (Mongoose).
-   **AI**: Google Gemini API (Free).

## 🚀 Quick Start

### 1. Setup Backend
```bash
cd server
npm install
# Update .env with your GEMINI_API_KEY
npm start
```

### 2. Setup Frontend
```bash
cd client
npm install
npm run dev
```

## 🧠 Design Decisions
- **Why Gemini over OpenAI?**: The assignment requested OpenAI, but I went for **Google Gemini 1.5 Flash** because it offers a robust **free tier** without requiring a credit card. This ensures the project is easier for you to test and run locally without billing friction, while still demonstrating the required **NLP/JSON parsing** capabilities.
- **Why Web Speech API?**: Native browser support reduces external dependencies and complexity for the MVP.