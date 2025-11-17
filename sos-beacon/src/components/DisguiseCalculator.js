// In src/components/DisguiseCalculator.js

import React, { useState } from 'react';

// --- Receive the new onDisableDisguise prop ---
const DisguiseCalculator = ({ onTriggerSos, onDisableDisguise }) => {
    const [display, setDisplay] = useState('0');

    const handleInput = (value) => {
        // Clear if display is '0' or an error
        if (display === '0' || display === 'Error') {
            setDisplay(value);
        } else {
            // Check for our secret code
            if (display === '100' && value === '=') {
                // --- SECRET TRIGGER ---
                setDisplay('SOS Sent!');
                onTriggerSos(); // Call the main SOS function
            } else if (value === '=') {
                // A 'fake' equals for other numbers
                try {
                    // eslint-disable-next-line no-eval
                    setDisplay(eval(display).toString());
                } catch (e) {
                    setDisplay('Error');
                }
            } else {
                setDisplay(display + value);
            }
        }
    };

    const clearDisplay = () => {
        // --- NEW SECRET CODE TO DISABLE DISGUISE ---
        // If display is already "0", pressing C again exits disguise mode.
        if (display === '0' || display === 'Error' || display === 'SOS Sent!') {
            onDisableDisguise();
        } else {
            // Otherwise, just clear the display
            setDisplay('0');
        }
    };

    const buttons = [
        '7', '8', '9', '/',
        '4', '5', '6', '*',
        '1', '2', '3', '-',
        '0', '.', '=', '+'
    ];

    return (
        <div className="calculator">
            <div className="calc-display">{display}</div>
            <button onClick={clearDisplay} className="calc-button clear">C</button>
            <div className="calc-keypad">
                {buttons.map(btn => (
                    <button key={btn} onClick={() => handleInput(btn)} className="calc-button">
                        {btn}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DisguiseCalculator;