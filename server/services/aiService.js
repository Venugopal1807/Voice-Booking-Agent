const axios = require('axios');

// 1. SANITIZE THE KEY
const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

if (!apiKey) {
    console.error("❌ CRITICAL: GEMINI_API_KEY is missing in aiService.js");
}

// CACHE: Store the working model so we don't ask every time
let cachedModelName = null;

// 2. AUTO-DISCOVERY FUNCTION
async function getWorkingModel() {
    if (cachedModelName) return cachedModelName;

    console.log("🔍 Auto-detecting available AI models...");
    try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(listUrl);
        const models = response.data.models || [];

        const flash = models.find(m => m.name.includes('gemini-1.5-flash') && m.supportedGenerationMethods.includes('generateContent'));
        const pro = models.find(m => m.name.includes('gemini-pro') && m.supportedGenerationMethods.includes('generateContent'));
        const anyGen = models.find(m => m.supportedGenerationMethods.includes('generateContent'));

        const selected = flash || pro || anyGen;

        if (selected) {
            cachedModelName = selected.name; 
            console.log(`✅ Auto-Selected Model: ${cachedModelName}`);
            return cachedModelName;
        } else {
            console.error("❌ No generateContent models found for this key!");
            return "models/gemini-1.5-flash"; 
        }

    } catch (error) {
        console.error("⚠️ Model Discovery Failed (using fallback):", error.message);
        return "models/gemini-1.5-flash";
    }
}

// Helper: Get real weather data
const getWeatherContext = async (dateStr) => {
    try {
        const city = 'Hyderabad';
        const weatherKey = process.env.WEATHER_API_KEY ? process.env.WEATHER_API_KEY.trim() : "";
        if(!weatherKey) return null;

        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${weatherKey}&units=metric`;
        const response = await axios.get(url);
        
        const forecast = response.data.list[0]; 
        return {
            temp: forecast.main.temp,
            condition: forecast.weather[0].main, 
            desc: forecast.weather[0].description
        };
    } catch (error) {
        console.log("Weather fetch failed:", error.message);
        return null;
    }
};

exports.processConversation = async (userText, conversationHistory) => {
    const modelName = await getWorkingModel();
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

    console.log(`🔹 History received: ${conversationHistory.length} items`);

    const systemPrompt = `
    You are a restaurant booking assistant for "Flavor Table".
    Current Date: ${new Date().toISOString().split('T')[0]}.
    
    GOAL: Build a "Booking State" by merging the ENTIRE Conversation History.
    
    CRITICAL RULES:
    1. ANALYZE HISTORY FIRST: Look for previously mentioned fields (Date, Guests, Cuisine).
    2. MERGE, DON'T RESET: If the user said "Tomorrow" in the past, and says "6 PM" now, the Result MUST have BOTH Date and Time.
    3. NEVER overwrite a non-null field with null unless the user explicitly cancels it.
    4. "numberOfGuests" is a number (e.g., 2).
    5. "time" must be 24-hour format (HH:MM).

    Return JSON ONLY. Use this structure:
    {
        "_reasoning": "Explain step-by-step what fields were found in history and what was added now.",
        "reply": "Conversational response asking for the next missing field",
        "bookingDetails": { 
            "numberOfGuests": number | null,
            "date": "YYYY-MM-DD" | null,
            "time": "HH:MM" | null,
            "cuisine": string | null,
            "specialRequests": string | null
        },
        "missingFields": ["list", "of", "null", "fields"],
        "isComplete": boolean (true ONLY if guests, date, and time are known)
    }
    `;

    // Map history to clear User/Assistant format
    const historyText = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

    const finalPrompt = `${systemPrompt}\n\n=== CONVERSATION HISTORY ===\n${historyText}\n\n=== NEW USER INPUT ===\nUser: ${userText}`;

    const payload = {
        contents: [{
            parts: [{ text: finalPrompt }]
        }]
    };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const rawText = response.data.candidates[0].content.parts[0].text;
        
        console.log("🔹 Gemini Response:", rawText); 

        // CLEANING LOGIC
        const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);

    } catch (error) {
        console.error("❌ Gemini API Error:");
        if (error.response) {
            console.error("   Status:", error.response.status);
        } else {
            console.error("   Message:", error.message);
        }

        return {
            reply: "I'm having trouble connecting to the brain. Please try again.",
            bookingDetails: {},
            missingFields: [],
            isComplete: false
        };
    }
};

exports.getWeather = getWeatherContext;