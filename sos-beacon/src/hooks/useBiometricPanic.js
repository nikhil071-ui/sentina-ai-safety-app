// In src/hooks/useBiometricPanic.js

import { useState, useRef, useCallback } from 'react';

// --- SETTINGS ---
// The Bluetooth "service" ID for Heart Rate
const HEARTRATE_SERVICE_UUID = 'heart_rate';
// The "characteristic" ID for Heart Rate
const HEARTRATE_CHARACTERISTIC_UUID = 'heart_rate_measurement';
// The "panic spike" trigger. (e.g., a jump of 40 bpm)
const PANIC_SPIKE_BPM = 40;
// The minimum heart rate to be considered a "panic"
const PANIC_THRESHOLD_BPM = 120;

const useBiometricPanic = (onPanicDetected) => {
    const [status, setStatus] = useState("Arm Biometrics");
    const [heartRate, setHeartRate] = useState(0);
    const heartRateHistory = useRef([]);
    const gattServer = useRef(null);

    // This function parses the raw data from the Bluetooth device
    const handleHeartRateChange = (event) => {
        const value = event.target.value;
        // The heart rate value is in the 2nd byte (index 1)
        const currentHeartRate = value.getUint8(1);
        setHeartRate(currentHeartRate); // Update UI
        
        // Add to our history
        const history = heartRateHistory.current;
        history.push(currentHeartRate);
        // Keep only the last 5 readings
        if (history.length > 5) {
            history.shift();
        }

        // Check for a panic spike (we need at least 5 readings)
        if (history.length === 5) {
            const avg = history.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
            
            // A "panic spike" is a sudden jump (e.g., +40bpm)
            // AND the heart rate is high (e.g., > 120bpm)
            if (currentHeartRate > (avg + PANIC_SPIKE_BPM) && currentHeartRate > PANIC_THRESHOLD_BPM) {
                console.log("PANIC SPIKE DETECTED!", avg, "->", currentHeartRate);
                onPanicDetected(); // Fire the SOS countdown!
                disconnect(); // Stop listening after a trigger
            }
        }
    };

    // This function disconnects from the device
    const disconnect = useCallback(() => {
        if (gattServer.current) {
            gattServer.current.disconnect();
            console.log("Biometric device disconnected.");
        }
        heartRateHistory.current = [];
        setHeartRate(0);
        setStatus("Arm Biometrics");
    }, []);

    // This is the main function the button will call
    const armBiometricSensor = async () => {
        if (!navigator.bluetooth) {
            setStatus("Web Bluetooth not supported");
            return;
        }

        try {
            setStatus("Scanning...");
            console.log('Requesting Bluetooth device...');
            
            // 1. Scan for devices that have the "heart_rate" service
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [HEARTRATE_SERVICE_UUID] }]
            });

            setStatus("Connecting...");
            console.log('Connecting to GATT Server...');
            gattServer.current = await device.gatt.connect();

            // 2. Get the Heart Rate service
            console.log('Getting Heart Rate service...');
            const service = await gattServer.current.getPrimaryService(HEARTRATE_SERVICE_UUID);

            // 3. Get the Heart Rate characteristic
            console.log('Getting Heart Rate characteristic...');
            const characteristic = await service.getCharacteristic(HEARTRATE_CHARACTERISTIC_UUID);

            // 4. Start listening for data
            console.log('Starting notifications...');
            await characteristic.startNotifications();

            // 5. Add the event listener
            characteristic.addEventListener('characteristicvaluechanged', handleHeartRateChange);
            setStatus("ARMED");
            console.log('Biometric sensor armed.');

        } catch (error) {
            console.error('Web Bluetooth Error:', error);
            setStatus(`Error: ${error.name}`);
        }
    };

    return { biometricStatus: status, heartRate, armBiometricSensor, disconnectBiometric: disconnect };
};

export default useBiometricPanic;