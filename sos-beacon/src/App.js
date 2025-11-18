import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css'; 

import SosApp from './components/SosApp';
import DisguiseCalculator from './components/DisguiseCalculator';

// --- Pocket Trigger Settings ---
const TRIGGER_KEY_1 = "VolumeDown"; 
const TRIGGER_KEY_2 = "Escape";     
const TRIGGER_PRESSES = 3;          
const TRIGGER_TIMEFRAME = 2000;     

// --- Check for SpeechRecognition API ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function App() {
    const [isDisguised, setIsDisguised] = useState(false);
    const [emergencyContacts, setEmergencyContacts] = useState([]); 
    const [statusMessage, setStatusMessage] = useState('Ready');
    const keyPressTimestamps = useRef([]);

    useEffect(() => {
        const savedContacts = localStorage.getItem('emergencyContacts');
        if (savedContacts) {
            setEmergencyContacts(JSON.parse(savedContacts));
        }
    }, []);

    // --- 1. NEW: AI Interview Function ---
    // This replaces the old "recordAndAnalyzeTranscript"
    const startAiInterview = useCallback(() => {
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false; // We want it to stop after the user speaks
        recognition.lang = 'en-US';
        
        let conversationLog = "";

        // Helper function to make the AI Speak
        const aiSpeak = (text, onComplete) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1; // Slightly faster and more urgent
            utterance.onend = onComplete; // Run the next step when finished speaking
            window.speechSynthesis.speak(utterance);
        };

        // Helper function to Listen
        const aiListen = (duration, onComplete) => {
            try {
                recognition.start();
                console.log("AI is listening...");
            } catch(e) { console.error("Mic error", e); }

            // Capture the result
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log("User said:", transcript);
                conversationLog += `User: ${transcript}. `;
            };

            // Stop listening after 'duration' milliseconds
            setTimeout(() => {
                recognition.stop();
                onComplete();
            }, duration);
        };

        // --- THE INTERVIEW FLOW ---
        // Step 1: First Question
        aiSpeak("Emergency Alert Sent. I am listening. Tell me exactly what is happening.", () => {
            
            // Step 2: Listen for 7 seconds
            aiListen(7000, () => {
                
                // Step 3: Second Question
                aiSpeak("I have recorded that. Are you injured? Do you need an ambulance?", () => {
                    
                    // Step 4: Listen for 5 seconds
                    aiListen(5000, async () => {
                        
                        // Step 5: Finish and Send
                        aiSpeak("Understood. I am sending this report to your contacts now. Keep moving to safety.", () => {});
                        
                        console.log("Full Interview:", conversationLog);
                        if (!conversationLog) conversationLog = "[No speech detected during interview]";

                        // Send to Backend
                        try {
                            const response = await fetch("http://localhost:4000/analyze-transcript", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                    transcript: conversationLog,
                                    emergencyContacts: emergencyContacts.join(',') 
                                }), 
                            });
                            const data = await response.json();
                            console.log("AI Situation Report sent:", data.message);
                        } catch (error) {
                            console.error("Failed to send interview:", error);
                        }
                    });
                });
            });
        });

    }, [emergencyContacts]);


    // --- 2. UPDATED: handleSosClick ---
    const handleSosClick = useCallback(() => {
        if (emergencyContacts.length === 0) {
            alert("No emergency contact set. Please go to settings.");
            setStatusMessage('Error: No contact set.');
            return;
        }

        setStatusMessage('Sending alert...');

        // --- A. START INTERVIEW (New Function) ---
        startAiInterview();

        // --- B. SEND IMMEDIATE LOCATION ALERT (Old Logic) ---
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            setStatusMessage('Error: Geolocation not supported.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { longitude } = position.coords;
                const locationLink = `http://googleusercontent.com/maps/google.com/18{latitude},${longitude}`;
                
                console.log(`Location: ${locationLink}`);
                setStatusMessage('Location found. Sending email...');

                fetch("http://localhost:4000/send-alert", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: emergencyContacts, location: locationLink }),
                })
                .then(response => response.json())
                .then(data => console.log("Initial SOS Email sent:", data.message))
                .catch((error) => console.error('Error sending initial SOS:', error));

                // Note: We removed the "Help Help Help" chant because the AI is now talking.
                // We still open the dialer as a backup.
                window.location.href = "tel:100";

                setStatusMessage('Ready');
                setIsDisguised(true);
                
            },
            () => {
                alert("Unable to retrieve your location. Please check GPS settings.");
                setStatusMessage('Error: Unable to get location.');
            }
        );
    }, [emergencyContacts, startAiInterview]); 


    // --- 3. Pocket Trigger (No Change) ---
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === TRIGGER_KEY_1 || event.key === TRIGGER_KEY_2) {
                const now = Date.now();
                keyPressTimestamps.current.push(now);
                keyPressTimestamps.current = keyPressTimestamps.current.filter(
                    timestamp => now - timestamp < TRIGGER_TIMEFRAME
                );
                if (keyPressTimestamps.current.length >= TRIGGER_PRESSES) {
                    handleSosClick();
                    keyPressTimestamps.current = [];
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleSosClick]); 


    // --- Disable Disguise (No Change) ---
    const handleDisableDisguise = () => {
        setIsDisguised(false);
    };

    
    // --- Main Render (No Change) ---
    return (
        <div className="App">
            {isDisguised ? (
                <DisguiseCalculator 
                    onTriggerSos={handleSosClick} 
                    onDisableDisguise={handleDisableDisguise}
                />
            ) : (
                <SosApp 
                    emergencyContacts={emergencyContacts}
                    setEmergencyContacts={setEmergencyContacts}
                    statusMessage={statusMessage}
                    handleSosClick={handleSosClick}
                />
            )}
        </div>
    );
}

export default App;