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

    // --- 1. NEW: Function to get transcript and send for analysis ---
    const recordAndAnalyzeTranscript = useCallback(() => {
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported.");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true; // Keep listening
            recognition.interimResults = true; // Get results as they come
            let finalTranscript = '';

            recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                console.log("Listening...", interimTranscript);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
            };

            recognition.onend = async () => {
                console.log("Final transcript:", finalTranscript);
                if (!finalTranscript) {
                    finalTranscript = "[No speech detected]";
                }
                
                // Send the text transcript to our new backend endpoint
                try {
                    console.log("Uploading transcript for analysis...");
                    const response = await fetch("http://localhost:4000/analyze-transcript", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            transcript: finalTranscript,
                            emergencyContacts: emergencyContacts.join(',') // Send as comma-separated string
                        }), 
                    });
                    
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message);
                    
                    console.log("AI Situation Report sent:", data.message);

                } catch (error) {
                    console.error("Failed to send text analysis:", error);
                }
            };
            
            // Start recording
            recognition.start();
            console.log("Recording 10 seconds of audio for transcription...");
            
            // Automatically stop after 10 seconds
            setTimeout(() => {
                recognition.stop();
            }, 10000); // 10-second recording

        } catch (err) {
            console.error("Microphone permission error or API error:", err);
        }

    }, [emergencyContacts]); // Depends on the contact list


    // --- 2. UPDATED: handleSosClick ---
    const handleSosClick = useCallback(() => {
        if (emergencyContacts.length === 0) {
            alert("No emergency contact set. Please go to settings.");
            setStatusMessage('Error: No contact set.');
            return;
        }

        setStatusMessage('Sending alert...');

        // --- A. START RECORDING (New Function) ---
        recordAndAnalyzeTranscript();

        // --- B. SEND IMMEDIATE ALERTS (Old Logic) ---
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            setStatusMessage('Error: Geolocation not supported.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const locationLink = `https://www.google.com/maps?q=$${latitude},${longitude}`;
                
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

                try {
                    const utterance = new SpeechSynthesisUtterance("Help. Help. Help. Emergency alert activated.");
                    utterance.rate = 1.2;
                    utterance.pitch = 1.5;
                    window.speechSynthesis.speak(utterance);
                } catch (e) { console.error("Audio alarm failed:", e); }

                window.location.href = "tel:100";

                setStatusMessage('Ready');
                setIsDisguised(true);
                
            },
            () => {
                alert("Unable to retrieve your location. Please check GPS settings.");
                setStatusMessage('Error: Unable to get location.');
            }
        );
    }, [emergencyContacts, recordAndAnalyzeTranscript]); // Add new dependency


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