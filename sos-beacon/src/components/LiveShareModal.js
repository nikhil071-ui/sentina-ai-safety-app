// In src/components/LiveShareModal.js

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from "firebase/firestore";

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
    </svg>
);

// --- 1. Now receives sessionId and shareLink as props ---
const LiveShareModal = ({ onClose, sessionId, shareLink }) => {
    const [status, setStatus] = useState('Starting session...');
    const intervalRef = useRef(null);

    useEffect(() => {
        // This function gets location and pushes to Firestore
        const updateLocation = () => {
            if (!navigator.geolocation) {
                setStatus("Geolocation not supported.");
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const locationData = { lat: latitude, lng: longitude, timestamp: new Date() };
                    
                    // Use the sessionId from props
                    const sessionRef = doc(db, "live_sessions", sessionId);
                    setDoc(sessionRef, locationData, { merge: true })
                        .then(() => setStatus("Live location is active..."))
                        .catch(e => setStatus("Error updating location."));
                },
                () => { setStatus("Could not get location. Check GPS."); },
                { enableHighAccuracy: true }
            );
        };

        // 2. Start the session
        updateLocation(); // Run once immediately
        intervalRef.current = setInterval(updateLocation, 10000); // And then every 10 seconds

        // 3. Cleanup function: This runs when the component is unmounted
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            // Delete the document from Firestore on cleanup
            if (sessionId) {
                const sessionRef = doc(db, "live_sessions", sessionId);
                deleteDoc(sessionRef).catch(e => console.error("Error deleting session:", e));
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]); // Effect now depends on the sessionId from props

    const handleStopSharing = () => {
        onClose(); // This will trigger the useEffect cleanup
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareLink);
        alert("Link copied to clipboard!");
    };

    return (
        <div className="chat-modal-backdrop">
            <div className="chat-modal-container">
                <div className="chat-modal-header">
                    <h3>Live Location Share</h3>
                    <button onClick={handleStopSharing} className="chat-close-button">
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="live-share-body">
                    <p>Session is active and link has been sent to your contacts. You can also copy it here:</p>
                    
                    {/* 4. Use the shareLink from props */}
                    <div className="share-link-input">
                        {shareLink}
                    </div>
                    
                    <button onClick={copyToClipboard} className="button saveButton">
                        Copy Link
                    </button>

                    <p className="status-text">Status: {status}</p>

                    <button 
                        onClick={handleStopSharing} 
                        className="button detectionButton"
                        style={{marginTop: '20px', width: '100%'}}
                    >
                        Stop Sharing
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveShareModal;