// In src/components/SosApp.js

import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- 1. Import our other components ---
import SafetyChat from './SafetyChat'; 
import LiveShareModal from './LiveShareModal';

// --- 2. Import firestore tools (NEEDED for reporting) ---
import { db } from '../firebase';
import { doc, setDoc } from "firebase/firestore";

// --- 3. Import our Biometric hook ---
import useBiometricPanic from '../hooks/useBiometricPanic';

// --- SVG Icons (All 13 icons) ---
const SettingsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.902 3.433 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.892 3.433-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c-1.79-.527-1.79-3.065 0 3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.892 1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zM8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg> );
const BackIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/></svg> );
const CheckIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg> );
const PoliceIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v3.585l1.64 1.64a.5.5 0 0 1-.353.854H2.713a.5.5 0 0 1-.353-.854L4 6.585V3a2 2 0 0 1 2-2h4z"/><path d="M2.213 10.354.5 12.5h15l-1.713-2.146A.5.5 0 0 0 13.287 10H2.713a.5.5 0 0 0-.5.354zM4.5 11h7a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z"/></svg> );
const HospitalIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.5.5a.5.5 0 0 0-1 0v.634l-1.146-1.147a.5.5 0 0 0-.708.708L6.293 1.343H.5a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5H9.707L10.354.195a.5.5 0 0 0-.708-.708L8.5.634V.5zM8 4.5a.5.5 0 0 1 .5.5v2h2a.5.5 0 0 1 0 1h-2v2a.5.5 0 0 1-1 0v-2h-2a.5.5 0 0 1 0-1h2v-2a.5.5 0 0 1 .5-.5z"/></svg> );
const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg> );
const MicIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/><path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/></svg> );
const ShieldIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path d="M5.338 1.59a.5.5 0 0 0-.585.326l-1.5 4A.5.5 0 0 0 3.73 6.5H8a.5.5 0 0 0 .447-.284l1.5-4a.5.5 0 0 0-.585-.326C8.806 1.8 8.41 1.5 8 1.5s-.806.3-1.07.59z"/> <path d="M14 6.5H2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zM2 7.5h12v3H2v-3z"/> <path d="M4 11.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5zm9 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5z"/> </svg> );
const ChatIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319l.003-.01a1 1 0 0 1 .71-.854c.545-.118 1.07-.242 1.555-.365a1 1 0 0 1 .806.01l.003.001c.669.215 1.36.424 2.008.58a1 1 0 0 1 .287.801c-.082.238-.19.463-.3.66a1 1 0 0 1-.71.364c-.318.09-.636.198-.943.298a1 1 0 0 1-.806-.011z"/> </svg> );
const MapIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.598-.49L10.5.99l-4.902.98A.5.5 0 0 0 5 1.99V15.5a.5.5 0 0 0 .598.49l4.902-.98 4.902-.98a.5.5 0 0 0 .598-.49V.5zM5 14.09V1.91l.402-.08 4.5-.9v12.18l-4.5.9zm5-12.18v12.18l.402.08 4.5.9V1.91l-4.5-.9z"/> </svg> );
const BiometricIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path d="M10.835 8.01a.5.5 0 0 0-.75.438V14.5a.5.5 0 0 0 1 0V8.448a.5.5 0 0 0-.25-.438z"/> <path d="M6.866 3.37C4.411 5.063 3 7.784 3 10.5a.5.5 0 0 0 1 0c0-2.318 1.18-4.633 3.231-6.082A.5.5 0 0 0 6.866 3.37z"/> <path d="M8 1.25a.5.5 0 0 0-.5.5v3.219l-.224-.113a.5.5 0 0 0-.552.868l.224.113V8.82a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5V5.82l.224-.113a.5.5 0 0 0-.552-.868L8.5 5.069V1.75a.5.5 0 0 0-.5-.5z"/> <path d="M4.866 3.37a.5.5 0 0 1 .316.633C3.411 5.063 2 7.784 2 10.5a.5.5 0 0 1-1 0c0-2.318 1.18-4.633 3.231-6.082a.5.5 0 0 1 .635-.048z"/> </svg> );
// --- 4. NEW: Flag Icon ---
const FlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.5.5h-6.586a.5.5 0 0 0-.354.146l-4 4a.5.5 0 0 1-.708 0l-4-4A.5.5 0 0 1 0 8.5H.5a.5.5 0 0 1 .5.5v6.5a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V.5a.5.5 0 0 0-.222-.415zM4.34 4.14a.5.5 0 0 1 .707 0l1.768 1.768a.5.5 0 0 1 0 .707l-1.768 1.768a.5.5 0 0 1-.707-.707L5.293 6H.5a.5.5 0 0 1 0-1h4.793L4.34 4.14z"/>
    </svg>
);
// --- END ICONS ---

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// --- Check for browser APIs ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechApiSupported = !!SpeechRecognition; 
const motionApiSupported = !!window.DeviceMotionEvent;
const G_FORCE_THRESHOLD = 30; 

function SosApp({ 
    emergencyContacts, 
    setEmergencyContacts, 
    statusMessage, 
    handleSosClick 
}) {
    // --- All States ---
    const [currentPage, setCurrentPage] = useState('sos');
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0); 
    const [newContactEmail, setNewContactEmail] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState("Arm Voice SOS");
    const recognitionRef = useRef(null); 
    const [isDetectionActive, setIsDetectionActive] = useState(false);
    const [detectionStatus, setDetectionStatus] = useState("Arm Incident Detection");
    const [incidentCountdown, setIncidentCountdown] = useState(0); 
    const [incidentCountdownActive, setIncidentCountdownActive] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showLiveShare, setShowLiveShare] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [activeShareLink, setActiveShareLink] = useState('');

    // --- Initialize the Biometric Hook ---
    const onPanic = useCallback(() => {
        if (!incidentCountdownActive) { 
            setIncidentCountdown(15);
            setIncidentCountdownActive(true);
        }
    }, [incidentCountdownActive]);
    const { biometricStatus, heartRate, armBiometricSensor, disconnectBiometric } = useBiometricPanic(onPanic);


    // --- All useEffects (no change) ---
    useEffect(() => {
        if (!speechApiSupported) return;
        const recognition = new SpeechRecognition();
        recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map(result => result[0]).map(result => result.transcript).join('').toLowerCase();
            if (transcript.includes('help help help') && statusMessage !== 'Sending alert...') { handleSosClick(); setIsListening(false); }
        };
        recognition.onerror = (event) => { console.error('Speech recognition error:', event.error); };
        recognitionRef.current = recognition;
    }, [handleSosClick, statusMessage]); 

    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;
        recognition.onend = () => { if (isListening) { recognition.start(); } };
        if (isListening) {
            try { recognition.start(); setVoiceStatus("Listening... (Say 'help help help')"); } 
            catch (e) { setVoiceStatus("Mic permission needed"); }
        } else {
            recognition.stop(); setVoiceStatus("Arm Voice SOS");
        }
    }, [isListening]); 

    useEffect(() => {
        if (emergencyContacts.length === 0 && currentPage !== 'settings') {
            setCurrentPage('settings');
        }
    }, [emergencyContacts, currentPage]); 

    useEffect(() => {
        if (isTimerActive && timeRemaining > 0) {
            const timerId = setTimeout(() => { setTimeRemaining(timeRemaining - 1); }, 1000);
            return () => clearTimeout(timerId);
        }
        if (isTimerActive && timeRemaining === 0) {
            handleSosClick(); 
            setIsTimerActive(false); 
        }
    }, [isTimerActive, timeRemaining, handleSosClick]);

    useEffect(() => {
        if (incidentCountdownActive && incidentCountdown > 0) {
            const timerId = setTimeout(() => { setIncidentCountdown(incidentCountdown - 1); }, 1000);
            return () => clearTimeout(timerId);
        }
        if (incidentCountdownActive && incidentCountdown === 0) {
            handleSosClick();
            setIncidentCountdownActive(false); 
            setIsDetectionActive(false); 
            setDetectionStatus("Arm Incident Detection");
            disconnectBiometric(); 
        }
    }, [incidentCountdownActive, incidentCountdown, handleSosClick, disconnectBiometric]);

    const handleMotionEvent = useCallback((event) => {
        if (!event.accelerationIncludingGravity) { return; }
        const { x, y, z } = event.accelerationIncludingGravity;
        const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
        if (totalAcceleration > G_FORCE_THRESHOLD && !incidentCountdownActive) {
            setIncidentCountdown(15); 
            setIncidentCountdownActive(true);
        }
    }, [incidentCountdownActive]); 

    useEffect(() => {
        if (isDetectionActive) {
            window.addEventListener('devicemotion', handleMotionEvent);
        } else {
            window.removeEventListener('devicemotion', handleMotionEvent);
        }
        return () => { window.removeEventListener('devicemotion', handleMotionEvent); };
    }, [isDetectionActive, handleMotionEvent]);

    
    // --- Live Share Functions ---
    const handleStartLiveShare = async () => {
        if (emergencyContacts.length === 0) {
            alert("Please add at least one emergency contact first.");
            setCurrentPage('settings');
            return;
        }
        const sessionId = Math.random().toString(36).substring(2, 10);
        const shareLink = `${window.location.origin}/track.html?session=${sessionId}`;
        try {
            const response = await fetch("http://localhost:4000/send-share-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emergencyContacts, shareLink: shareLink }),
            });
            if (!response.ok) throw new Error("Failed to send link");
            setActiveSessionId(sessionId);
            setActiveShareLink(shareLink);
            setShowLiveShare(true); 
        } catch (error) {
            console.error("Error sending share link:", error);
            alert("Could not send the share link. Please try again.");
        }
    };
    const handleStopLiveShare = () => {
        setShowLiveShare(false);
        setActiveSessionId(null);
        setActiveShareLink('');
    };

    // --- Other Functions (with fixes) ---
    const handleAddContact = () => {
        if (newContactEmail && !emergencyContacts.includes(newContactEmail)) {
            const updatedContacts = [...emergencyContacts, newContactEmail];
            setEmergencyContacts(updatedContacts);
            localStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
            setNewContactEmail(""); 
        }
    };
    const handleDeleteContact = (emailToDelete) => {
        const updatedContacts = emergencyContacts.filter(email => email !== emailToDelete);
        setEmergencyContacts(updatedContacts);
        localStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
    };
    const startTimer = (seconds) => {
        setTimeRemaining(seconds);
        setIsTimerActive(true);
    };
    const cancelTimer = () => {
        setIsTimerActive(false);
        setTimeRemaining(0);
    };
    
    // --- FIXED: Location link in handleFindHelp ---
    const handleFindHelp = (query) => {
        if (!navigator.geolocation) { alert("Geolocation is not supported by your browser."); return; }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // --- THIS IS THE FIX ---
                // Creates a search query for "query" near the user's lat/lng
                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}+near+${latitude},${longitude}`;
                window.open(url, '_blank');
            },
            () => { alert("Unable to retrieve your location. Please check GPS settings."); }
        );
    };
    const toggleListening = () => {
        if (!speechApiSupported) { alert("Sorry, your browser does not support voice commands."); return; }
        setIsListening(!isListening); 
    };
    const toggleDetection = async () => {
        if (!motionApiSupported) {
            alert("Sorry, your browser does not support motion detection.");
            return;
        }
        if (isDetectionActive) {
            setIsDetectionActive(false);
            setDetectionStatus("Arm Incident Detection");
        } else {
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                try {
                    const permissionState = await DeviceMotionEvent.requestPermission();
                    if (permissionState === 'granted') {
                        setIsDetectionActive(true);
                        setDetectionStatus("Incident Detection ARMED");
                    } else {
                        setDetectionStatus("Permission denied");
                    }
                } catch (error) {
                    console.error("Motion permission error:", error);
                    setDetectionStatus("Permission error");
                }
            } else {
                setIsDetectionActive(true);
                setDetectionStatus("Incident Detection ARMED");
            }
        }
    };
    const cancelIncident = () => {
        setIncidentCountdown(0);
        setIncidentCountdownActive(false);
        setIsDetectionActive(false); 
        setDetectionStatus("Arm Incident Detection");
        disconnectBiometric(); // Also disconnect bluetooth
    };

    // --- 5. NEW: Function to report an unsafe spot ---
    const handleReportUnsafeSpot = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        if (!window.confirm("This will anonymously report your current location as an unsafe spot to help warn other users. Are you sure?")) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const report = {
                    lat: latitude,
                    lng: longitude,
                    timestamp: new Date() // Save the current time
                };

                try {
                    // Create a unique ID for the report
                    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                    // --- This is our new "danger heatmap" database ---
                    const reportRef = doc(db, "unsafe_reports", reportId);
                    
                    await setDoc(reportRef, report);
                    alert("Unsafe spot reported. Thank you for helping the community.");
                } catch (error) {
                    console.error("Error reporting spot:", error);
                    alert("Could not report spot. Please try again.");
                }
            },
            () => {
                alert("Unable to retrieve your location. Please check GPS settings.");
            }
        );
    };


    // --- renderSosPage (UPDATED) ---
    const renderSosPage = () => {
        // --- 1. Incident Detected! Show this first. ---
        if (incidentCountdownActive) {
            return (
                <div className="container incidentContainer">
                    <h1>INCIDENT DETECTED!</h1>
                    <p>Alerting contacts in...</p>
                    <div className="timerDisplay">{incidentCountdown}</div>
                    <button 
                        onClick={cancelIncident} 
                        className="button saveButton" 
                        style={{backgroundColor: '#28a745', transform: 'scale(1.2)'}} 
                    >
                        <CheckIcon /> I'M OK
                    </button>
                    <p className="statusMessage"><strong>Press "I'M OK" to cancel the alert.</strong></p>
                </div>
            );
        }

        // --- 2. Safety Timer ---
        if (isTimerActive) {
            return (
                <div className="container">
                    <h1>TIMER ACTIVE</h1>
                    <p>Check in before the timer runs out.</p>
                    <div className="timerDisplay">{formatTime(timeRemaining)}</div>
                    <button 
                        onClick={cancelTimer} 
                        className="button saveButton" 
                        style={{backgroundColor: '#28a745'}} 
                    >
                        <CheckIcon /> I Am Safe
                    </button>
                    <p className="statusMessage"><strong>{statusMessage}</strong></p>
                </div>
            );
        }

        // --- 3. Main SOS Page ---
        return (
            <div className="container">
                <h1>EMERGENCY</h1>
                <p>Press the button or use a trigger to alert contacts.</p>
                <button onClick={handleSosClick} className="sosButton">
                    SOS
                </button>
                <p className="statusMessage"><strong>{statusMessage}</strong></p>
                
                <div className="contact-list-preview">
                    <strong>Alerting:</strong>
                    {emergencyContacts.length > 0 ? (
                        emergencyContacts.map(email => <span key={email} className="contact-tag">{email}</span>)
                    ) : (
                        <span> No contacts set.</span>
                    )}
                </div>

                <div className="tools-grid-container">
                    
                    <button 
                        className="button liveShareButton"
                        onClick={handleStartLiveShare} 
                        title="Share live location with a contact"
                    >
                        <MapIcon /> Share Live Trip
                    </button>

                    <button
                        className={`button biometricButton ${biometricStatus === 'ARMED' ? 'listening' : ''}`}
                        onClick={biometricStatus === 'ARMED' ? disconnectBiometric : armBiometricSensor}
                        title="Connect to a heart rate monitor"
                    >
                        <BiometricIcon /> {biometricStatus === 'ARMED' ? `HR: ${heartRate}` : biometricStatus}
                    </button>
                    
                    {speechApiSupported && (
                        <button className={`button voiceButton ${isListening ? 'listening' : ''}`} onClick={toggleListening} title="Listens for 'help help help'">
                            <MicIcon /> {voiceStatus}
                        </button>
                    )}
                    {motionApiSupported && (
                        <button className={`button detectionButton ${isDetectionActive ? 'listening' : ''}`} onClick={toggleDetection} title="Detects a sudden fall or crash">
                            <ShieldIcon /> {detectionStatus}
                        </button>
                    )}

                    <button className="button" onClick={() => startTimer(60)}>1 Min Test</button>
                    <button className="button" onClick={() => startTimer(15 * 60)}>15 Mins</button>
                    <button className="button" onClick={() => startTimer(30 * 60)}>30 Mins</button>

                    <button className="button aiChatButton" onClick={() => setShowChat(true)}>
                        <ChatIcon /> Ask AI Agent
                    </button>

                    <button className="button resourceButton" onClick={() => handleFindHelp('police station')}>
                        <PoliceIcon /> Find Police
                    </button>
                    <button className="button resourceButton" onClick={() => handleFindHelp('hospital')}>
                        <HospitalIcon /> Find Hospital
                    </button>

                    {/* --- 6. NEW "Report" BUTTON --- */}
                    <button 
                        className="button reportButton"
                        onClick={handleReportUnsafeSpot}
                        title="Anonymously report this area as unsafe"
                    >
                        <FlagIcon /> Report Unsafe Spot
                    </button>
                </div>

                <button 
                    onClick={() => setCurrentPage('settings')} 
                    className="button settingsButton"
                    style={{marginTop: '25px', width: 'calc(100% - 16px)'}}
                >
                    <SettingsIcon /> Manage Contacts
                </button>
            </div>
        );
    };

    // --- Settings Page (with all fixes) ---
    const renderSettingsPage = () => (
        <div className="container">
            <h2>Manage Contacts</h2>
            <p>Add the email addresses of your emergency contacts.</p>
            
            <div className="add-contact-form">
                <input
                    type="email"
                    placeholder="Enter new contact's email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="input"
                />
                <button onClick={handleAddContact} className="button saveButton">
                    Add
                </button>
            </div>

            <hr className="divider" />

            <div className="contact-list">
                {emergencyContacts.length === 0 ? (
                    <p>No contacts added yet.</p>
                ) : (
                    emergencyContacts.map(email => (
                        <div key={email} className="contact-list-item">
                            <span>{email}</span>
                            <button className="deleteButton" onClick={() => handleDeleteContact(email)}>
                                <TrashIcon />
                            </button>
                        </div>
                    ))
                )}
            </div>
            
            {emergencyContacts.length > 0 && (
                <button 
                    onClick={() => setCurrentPage('sos')} 
                    className="button backButton"
                    style={{marginTop: '20px'}}
                >
                    <BackIcon /> Back to Safety
                </button> 
            )}
        </div>
    );

    // --- Main return (with all modals) ---
    return (
        <>
            {currentPage === 'sos' ? renderSosPage() : renderSettingsPage()}
            {showChat && <SafetyChat onClose={() => setShowChat(false)} />}
            
            {showLiveShare && (
                <LiveShareModal 
                    onClose={handleStopLiveShare}
                    sessionId={activeSessionId}
                    shareLink={activeShareLink}
                />
            )}
        </>
    );
}

export default SosApp;