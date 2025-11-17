Sentina - AI Safety Agent

This is an advanced, "beyond imagination" safety application built for the "Agents for Good" hackathon.

It is a full-stack web application with a React frontend and a Node.js (Express) backend.

Features

SOS Button: Instantly sends email alerts with your GPS location.

AI Situation Report: Transcribes 10 seconds of ambient audio and sends an AI-powered analysis of the situation to contacts.

Live Location Share: Emails a private, real-time map tracking link to contacts.

AI Safety Chatbot: A built-in Gemini-powered chatbot for non-emergency safety advice.

AI Safe Route Planner: An AI agent that analyzes a destination against a live "danger heatmap" (from user reports) to provide safe route advice.

"Report Unsafe Spot": Allows users to anonymously build the "danger heatmap" by reporting unsafe areas.

Stealth & Passive Triggers:

Disguise Mode: Hides the app as a calculator (trigger with 100=).

Pocket Trigger: Triggers SOS by pressing Volume Down x3 or Esc x3.

Voice Trigger: Listens for the safe word "help help help."

Fall Detection: Triggers an "I'm OK" countdown on a G-force spike.

Biometric Panic: Triggers a countdown on a "panic spike" from a connected heart rate monitor.

How to Run This Project

This project has two parts that must be run separately.

1. Backend Server

The backend handles all email, AI analysis, and secure keys.

# 1. Navigate to the backend folder
cd Backend

# 2. Install all required libraries
npm install

# 3. (CRITICAL) Setup your .env file
# You must create a file named .env in this folder
# and add your secret keys:
GMAIL_EMAIL="your-email@gmail.com"
GMAIL_PASSWORD="your-16-digit-app-password"
GEMINI_API_KEY="your-google-ai-api-key"

# 4. (CRITICAL) Add your Firebase Admin key
# Download your 'serviceAccountKey.json' file from
# Firebase > Project Settings > Service Accounts
# and place it in this 'Backend' folder.

# 5. Run the server
node server.js


The server will now be running on http://localhost:4000.

2. Frontend App

The frontend is the React web app.

# 1. Open a NEW terminal
# 2. Navigate to the frontend folder
cd sos-beacon

# 3. Install all required libraries
npm install

# 4. (CRITICAL) Setup your .env file
# You must create a file named .env in this folder
# and add your Firebase config keys:
REACT_APP_API_KEY="your-firebase-key"
REACT_APP_AUTH_DOMAIN="your-firebase-domain"
REACT_APP_PROJECT_ID="your-firebase-project-id"
REACT_APP_STORAGE_BUCKET="your-firebase-bucket"
REACT_APP_MESSAGING_SENDER_ID="your-firebase-sender-id"
REACT_APP_APP_ID="your-firebase-app-id"

# 5. Run the app
npm start


The app will now be running on http://localhost:3000.