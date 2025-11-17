const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer"); 
require("dotenv").config();

// --- 1. Imports for Firebase Admin (NO Google Maps) ---
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// --- 2. Load your Firebase Admin key ---
const serviceAccount = require("./serviceAccountKey.json");

// --- 3. Initialize Admin Apps ---
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore(); // This is your Admin database
// NO mapsClient

// --- Multer Setup ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
const port = 4000;

app.use(cors()); 
app.use(express.json()); 

// --- Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
    },
});

// --- /send-alert Endpoint ---
app.post("/send-alert", async (req, res) => {
    try {
        const { email, location } = req.body;
        const mailOptions = {
            from: process.env.GMAIL_EMAIL,
            to: email, 
            subject: "EMERGENCY ALERT",
            html: `<h1>URGENT! EMERGENCY ALERT!</h1><p>I am in trouble. My last known location is:</p><a href="${location}">${location}</a><p>Please get help immediately.</p>`,
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully!" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Error sending email." });
    }
});


// --- AI Model Waterfall ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MODEL_LIST = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "learnlm-2.0-flash-experimental",
    "gemini-2.0-flash-exp"
];

const AI_SYSTEM_PROMPT = `You are a helpful and calm AI Safety Agent. 
Your primary role is to provide practical, non-emergency safety tips.
Keep your answers concise and empathetic. 
Do not provide medical or legal advice. 
If a user seems to be in an immediate emergency, instruct them to use the "SOS" button in the app immediately.

---
USER QUESTION: `; 

async function callGemini(payload) {
    let lastError = null;

    for (const modelName of MODEL_LIST) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        
        try {
            console.log(`Trying model: ${modelName}...`);
            const apiResponse = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (apiResponse.status === 503) {
                console.warn(`Model ${modelName} is overloaded (503). Trying next...`);
                lastError = new Error(`Service Unavailable (503) for ${modelName}`);
                continue; 
            }

            if (!apiResponse.ok) {
                const errorBody = await apiResponse.text();
                console.error(`Gemini API Error (${modelName}):`, errorBody);
                lastError = new Error(`API error: ${apiResponse.statusText}`);
                continue; 
            }

            const data = await apiResponse.json();
            
            if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
                lastError = new Error("Invalid response structure from AI.");
                continue; 
            }
            
            console.log(`Success with model: ${modelName}!`);
            return data.candidates[0].content.parts[0].text; 

        } catch (error) {
            console.error(`Error in callGemini loop (${modelName}):`, error);
            lastError = error;
        }
    }

    console.error("All AI models failed.");
    throw lastError || new Error("All AI models are currently unavailable.");
}

// --- /ask-ai Endpoint (FIXED) ---
app.post("/ask-ai", async (req, res) => {
    try {
        const { prompt } = req.body; 
        if (!prompt) return res.status(400).json({ message: "Prompt is required." });
        
        const combinedPrompt = AI_SYSTEM_PROMPT + prompt;
        const payload = {
            contents: [{ parts: [{ text: combinedPrompt }] }]
        };
        
        const aiResponse = await callGemini(payload);
        res.status(200).json({ message: aiResponse });

    } catch (error) {
        console.error("Error with AI endpoint:", error.message);
        res.status(500).json({ message: "Error getting response from AI." });
    }
});


// --- /send-share-link Endpoint (No change) ---
app.post("/send-share-link", async (req, res) => {
    try {
        const { email, shareLink } = req.body; 
        if (!email || !shareLink) {
            return res.status(400).json({ message: "Missing email list or share link." });
        }
        const mailOptions = {
            from: process.env.GMAIL_EMAIL,
            to: email, 
            subject: "Follow My Trip: Live Location Share",
            html: `<h1>Follow My Trip</h1><p>I've started sharing my live location with you...</p><a href="${shareLink}">Track Live Location</a>`,
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Share link sent successfully!" });
    } catch (error) {
        console.error("Error sending share link:", error);
        res.status(500).json({ message: "Error sending share link." });
    }
});


// --- /analyze-transcript Endpoint (FIXED) ---
const AI_ANALYSIS_PROMPT = `You are a 911 dispatch operator... (full prompt)... TRANSCRIPT: `;

app.post("/analyze-transcript", async (req, res) => {
    try {
        const { transcript, emergencyContacts } = req.body;
        if (!transcript || !emergencyContacts) {
            return res.status(400).json({ message: "Transcript or contacts missing." });
        }
        
        const combinedPrompt = AI_ANALYSIS_PROMPT + transcript;
        const payload = {
            contents: [{ parts: [{ text: combinedPrompt }] }]
        };
        
        const aiAnalysis = await callGemini(payload);

        const contactsArray = emergencyContacts.split(','); 
        const mailOptions = {
            from: process.env.GMAIL_EMAIL,
            to: contactsArray,
            subject: "⚠️ AI Situation Report ⚠️",
            html: `<pre style="font-family: monospace; white-space: pre-wrap; background: #f4f4f4; padding: 10px; border-radius: 5px;">${aiAnalysis}</pre>`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Analysis complete and report sent." });

    } catch (error) {
        console.error("Error analyzing transcript:", error.message);
        res.status(500).json({ message: "Error analyzing transcript." });
    }
});


// --- 8. 100% FREE Safe Route ADVICE Endpoint ---
app.post("/get-route-advice", async (req, res) => {
    try {
        const { destination } = req.body;
        if (!destination) {
            return res.status(400).json({ message: "Destination is required." });
        }

        // --- A: Get Unsafe Reports from Firestore (FREE) ---
        const reportsSnapshot = await db.collection('unsafe_reports').get();
        const unsafeReports = reportsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { lat: data.lat, lng: data.lng, timestamp: data.timestamp };
        });

        // --- B: Prepare the AI Prompt (FREE) ---
        const aiPrompt = `
You are an expert safety co-pilot. A user is asking for walking safety advice to a destination.
User's Destination: "${destination}"
Our database of user-reported unsafe spots (lat/lng/timestamp) is: ${JSON.stringify(unsafeReports)}.
Please do the following:
1.  Analyze the user's destination (e.g., "Civil Hospital, Jalandhar").
2.  Check if any of the unsafe spots from the database (use general geographic knowledge) might be near or on the way to this destination.
3.  If no spots seem relevant, just provide general walking safety tips.
4.  If spots ARE relevant, *clearly warn them* (e.g., "Be cautious: We have user-reports of unsafe activity near [General Area] which may be on your route.")
5.  Be calm, clear, and concise.

Your advice:
`;

        // --- C: Call Gemini (FREE) ---
        const payload = {
            contents: [{ parts: [{ text: aiPrompt }] }]
        };
        
        // --- THIS IS THE FIX ---
        // Changed callGemimini(payload) to callGemini(payload)
        const aiAnalysis = await callGemini(payload);
        // --- END OF FIX ---

        // --- D: Send the AI's text advice back (FREE) ---
        res.status(200).json({ 
            aiAnalysis: aiAnalysis
        });

    } catch (error) {
        console.error("Error in /get-route-advice:", error.message);
        res.status(500).json({ message: "Error planning safe route advice." });
    }
});


// --- 9. Start the server ---
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});