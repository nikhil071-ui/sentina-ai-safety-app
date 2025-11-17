import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown'; 

// --- ICONS (No Change) ---
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg> );
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11zM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493z"/></svg> );
const CopyIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M13.646 2.354a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 9.293l6.646-6.647a.5.5 0 0 1 .708 0z"/><path d="M4.5 0a.5.5 0 0 0-.5.5v1.5H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-1.5V.5a.5.5 0 0 0-.5-.5h-5zm-3 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4z"/></svg> );
const NewChatIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.224 4.14a.5.5 0 0 1 .216.666l-2.43 6.076a.5.5 0 0 1-.928.057l-1.01-3.03-3.03-1.01a.5.5 0 0 1 .058-.927l6.075-2.43a.5.5 0 0 1 .666.215z"/><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8z"/></svg> );
const RouteIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path fillRule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v12a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-.5-.5H1.5zM2 2h11v11H2V2zm4.5 1.99a.5.5 0 0 1 .491.592l-1.5 6A.5.5 0 0 1 4.5 11H3a.5.5 0 0 1 0-1h1.168l1.0-4.018a.5.5 0 0 1 .592-.491zM10.5 4a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 1 0v-4a.5.5 0 0 0-.5-.5z"/> </svg> );
const ChatBubbleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12z"/> </svg> );
// --- END ICONS ---

const SafetyChat = ({ onClose }) => {
    const defaultMessage = { role: 'model', text: "Hi! I'm your AI Safety Agent. I can give safety tips or plan a safe route. What do you need?" };
    const [chatHistory, setChatHistory] = useState([defaultMessage]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState('chat'); 
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleNewChat = () => {
        setChatHistory([defaultMessage]);
        setMode('chat'); 
    };
    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const userMessage = currentMessage.trim();
        if (!userMessage) return;

        setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
        setCurrentMessage("");
        setIsLoading(true);

        if (mode === 'chat') {
            await sendStandardChat(userMessage);
        } else {
            // --- UPDATED: Call the new function ---
            await sendSafeRouteAdvice(userMessage);
        }
        setIsLoading(false);
    };
    
    const sendStandardChat = async (userMessage) => {
        try {
            const response = await fetch("http://localhost:4000/ask-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userMessage }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to get response from AI");
            }
            const data = await response.json();
            setChatHistory(prev => [...prev, { role: 'model', text: data.message }]);
        } catch (error) {
            // This now correctly parses JSON errors
            let errorMsg = error.message;
            if (error.message.includes("valid JSON")) {
                errorMsg = "The server sent an invalid response. Please check the backend logs.";
            }
            setChatHistory(prev => [...prev, { role: 'model', text: `Sorry, an error occurred: ${errorMsg}` }]);
        }
    };
    
    // --- UPDATED: Safe Route ADVICE function (100% Free) ---
    const sendSafeRouteAdvice = async (destination) => {
        setChatHistory(prev => [...prev, { role: 'model', text: "Checking our safety database for your destination..." }]);
        
        try {
            // --- THIS IS THE FIX ---
            // We only call '/get-route-advice' and only send the destination text.
            // We no longer ask for the user's location.
            const response = await fetch("http://localhost:4000/get-route-advice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ destination: destination }),
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to get route advice");
            }
            
            const data = await response.json();
            
            // Add the AI's analysis
            setChatHistory(prev => [...prev, { role: 'model', text: data.aiAnalysis }]);

        } catch (error) {
             // This now correctly parses JSON errors
            let errorMsg = error.message;
            if (error.message.includes("valid JSON")) {
                errorMsg = "The server sent an invalid response. Please check the backend logs.";
            }
            setChatHistory(prev => [...prev, { role: 'model', text: `Sorry, an error occurred: ${errorMsg}` }]);
        }
    };

    const toggleMode = (newMode) => {
        setMode(newMode);
        if (newMode === 'route') {
            setChatHistory(prev => [...prev, { role: 'model', text: "Safe Route Advice mode. Please enter your destination." }]);
        } else {
            setChatHistory(prev => [...prev, { role: 'model', text: "Safety Chat mode activated. Ask me anything." }]);
        }
    };

    return (
        <div className="chat-modal-backdrop">
            <div className="chat-modal-container">
                <div className="chat-modal-header">
                    <h3>AI Safety Agent</h3>
                    <div>
                        <button onClick={handleNewChat} className="chat-action-button" title="New Chat">
                            <NewChatIcon />
                        </button>
                        <button onClick={onClose} className="chat-action-button" title="Close">
                            <CloseIcon />
                        </button>
                    </div>
                </div>
                
                <div className="chat-mode-toggle">
                    <button className={mode === 'chat' ? 'active' : ''} onClick={() => toggleMode('chat')}>
                        <ChatBubbleIcon /> Safety Chat
                    </button>
                    <button className={mode === 'route' ? 'active' : ''} onClick={() => toggleMode('route')}>
                        <RouteIcon /> Route Advice
                    </button>
                </div>
                
                <div className="chat-modal-body">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.role}`}>
                            <div className="chat-bubble">
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                            {msg.role === 'model' && (
                                <button className="chat-copy-button" onClick={() => handleCopy(msg.text)} title="Copy">
                                    <CopyIcon />
                                </button>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="chat-message model">
                            <div className="chat-bubble typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                
                <form className="chat-modal-footer" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        placeholder={mode === 'chat' ? 'Ask for safety tips...' : 'Enter your destination...'}
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading} className="chat-send-button">
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SafetyChat;