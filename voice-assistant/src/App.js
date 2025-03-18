import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import initCookingAssistant from './cookingAssistant';

function App() {
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cookingAssistant, setCookingAssistant] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);

  // Initialize the cooking assistant when the component mounts
  useEffect(() => {
    const assistant = initCookingAssistant();
    setCookingAssistant(assistant);
    
    // Cleanup function to stop the assistant when component unmounts
    return () => {
      if (assistant && assistant.vapi) {
        assistant.vapi.stop();
      }
    };
  }, []);

  const handleStartStop = async () => {
    if (!cookingAssistant) return;
    
    if (isAssistantActive) {
      // Stop the assistant
      cookingAssistant.vapi.stop();
      setIsAssistantActive(false);
    } else {
      // Start the assistant with permission check
      const started = await cookingAssistant.initialize();
      if (started) {
        setIsAssistantActive(true);
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('denied');
      }
    }
  };

  const handleMute = () => {
    if (!cookingAssistant) return;
    
    const newMuteState = cookingAssistant.toggleMute();
    setIsMuted(newMuteState);
  };

  const handleEndSession = () => {
    if (!cookingAssistant) return;
    
    cookingAssistant.endSession();
    setIsAssistantActive(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Cooking Assistant</h1>
        
        {permissionStatus === 'denied' && (
          <div className="permission-alert">
            <p>Please allow microphone and camera access to use the cooking assistant.</p>
            <button onClick={() => setPermissionStatus(null)}>Dismiss</button>
          </div>
        )}
        
        <div className="controls">
          <button 
            className="control-button start-stop"
            onClick={handleStartStop}
          >
            {isAssistantActive ? 'Stop Assistant' : 'Start Assistant'}
          </button>
          
          <button 
            className="control-button mute"
            onClick={handleMute}
            disabled={!isAssistantActive}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          
          <button 
            className="control-button end"
            onClick={handleEndSession}
            disabled={!isAssistantActive}
          >
            End Session
          </button>
        </div>
        
        <p className="status">
          Assistant Status: {isAssistantActive ? 'Active' : 'Inactive'}
        </p>
      </header>
    </div>
  );
}

export default App;