import Vapi from '@vapi-ai/web';

// Create a cooking assistant class
class CookingAssistant {
  constructor(publicKey) {
    this.vapi = new Vapi(publicKey);
    this.setupEventListeners();
    this.responseData = null;
    this.permissionsGranted = false;
  }

  // Check for media permissions
  async checkMediaPermissions() {
    try {
      // Request only audio permissions
      await navigator.mediaDevices.getUserMedia({ audio: true });
      this.permissionsGranted = true;
      return true;
    } catch (error) {
      console.error('Media permissions error:', error);
      this.permissionsGranted = false;
      return false;
    }
  }

  // Initialize the cooking assistant
  async initialize() {
    const hasPermissions = await this.checkMediaPermissions();
    if (!hasPermissions) {
      console.error('Missing required permissions');
      return false;
    }
    
    this.vapi.start({
      model: {
        provider: "openai",
        model: "gpt-4", // Using more capable model for cooking knowledge
        messages: [
          {
            role: "system",
            content: `You are a helpful cooking assistant. 
            You can provide recipes, cooking techniques, ingredient substitutions, 
            and step-by-step guidance while the user is cooking.
            Always be patient, clear, and concise in your instructions.
            If the user asks you to repeat or slow down, do so immediately.
            Offer to set timers when appropriate for cooking steps.
            When suggesting recipes, ask about dietary restrictions and preferences.`,
          },
        ],
      },
      voice: {
        provider: "11labs",
        voiceId: "bella", // A warm, friendly voice
      },
      recordingEnabled: true,
    });
    
    return true;
  }

  // Start the assistant with custom user name
  startWithUserName(userName) {
    const assistantOverrides = {
      variableValues: {
        name: userName,
      },
    };

    this.vapi.start(
      '957fd012-dc1a-4943-b94b-6100f7c1063e', // Replace with your actual assistant ID
      assistantOverrides,
    );
  }

  // Send a text message to the assistant
  sendMessage(content, role = 'user') {
    this.vapi.send({
      type: 'add-message',
      message: {
        role: role,
        content: content,
      },
    });
  }

  // Send a system message for specific instructions
  sendSystemMessage(content) {
    this.sendMessage(content, 'system');
  }

  // Notify the user about a timer completion
  notifyTimerComplete(dish) {
    this.sendSystemMessage(`The timer for ${dish} has completed. Instruct the user on next steps.`);
  }

  // Helper method to set a cooking timer
  setTimer(minutes, dish) {
    console.log(`Setting timer for ${dish}: ${minutes} minutes`);
    setTimeout(() => {
      this.notifyTimerComplete(dish);
    }, minutes * 60 * 1000);
  }

  // Mute/unmute the microphone
  toggleMute() {
    const currentMuteState = this.vapi.isMuted();
    this.vapi.setMuted(!currentMuteState);
    return !currentMuteState;
  }

  // End the current session
  endSession() {
    this.vapi.say("Thank you for cooking with me today! Enjoy your meal.", true);
  }

  // Parse model output to access the actual response content
  parseModelOutput(output) {
    if (!output) return null;
    
    try {
      // Check if the output has model-output content
      if (output.type === 'model-output' && output.content) {
        return output.content;
      }
      
      // For transcript responses
      if (output.type === 'transcript' && output.transcript) {
        return {
          type: 'transcript',
          content: output.transcript
        };
      }
      
      // For speech updates
      if (output.type === 'speech-update' && output.speech) {
        return {
          type: 'speech',
          content: output.speech
        };
      }
      
      return output;
    } catch (error) {
      console.error('Error parsing model output:', error);
      return null;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    this.vapi.on('call-start', () => {
      console.log('Cooking assistant activated');
      // You could trigger a UI change here
    });

    this.vapi.on('call-end', () => {
      console.log('Cooking assistant deactivated');
      // You could trigger a UI change here
    });

    this.vapi.on('speech-start', () => {
      console.log('Assistant is speaking');
      // You could update UI to show the assistant is speaking
    });

    this.vapi.on('speech-end', () => {
      console.log('Assistant stopped speaking');
      // You could update UI to show the assistant is listening
    });

    // Listen for all message types according to the expected response format
    this.vapi.on('model-output', (output) => {
      console.log('Assistant response (model output):', output);
      const parsedResponse = this.parseModelOutput(output);
      if (parsedResponse && parsedResponse.content) {
        this.handleTimerRequests(parsedResponse.content);
      }
      this.responseData = output;
    });
    
    this.vapi.on('transcript', (transcript) => {
      console.log('User speech transcript:', transcript);
    });
    
    this.vapi.on('speech-update', (update) => {
      console.log('Speech update:', update);
    });
    
    this.vapi.on('status-update', (status) => {
      console.log('Status update:', status);
    });
    
    this.vapi.on('error', (error) => {
      console.error('Vapi error:', error);
      // You could show an error message to the user
    });
    
    this.vapi.on('camera-error', (error) => {
      console.error('Microphone permission error:', error);
      // You could update UI to show permission instructions
    });
    
    // Catch all events to ensure we're not missing anything important
    this.vapi.on('any', (event) => {
      // Log all events except those we already handle specifically
      if (!['call-start', 'call-end', 'speech-start', 'speech-end', 
            'model-output', 'transcript', 'speech-update', 'status-update', 
            'error', 'camera-error'].includes(event.type)) {
        console.log('Other event received:', event);
      }
    });
  }

  // Parse assistant responses for timer requests
  handleTimerRequests(content) {
    if (!content || typeof content !== 'string') return;
    
    const timerRegex = /set(?:\s+a)?\s+timer(?:\s+for)?\s+(\d+)\s+(minute|minutes|min|mins)(?:\s+for\s+(.+?))?/i;
    const match = content.match(timerRegex);
    
    if (match) {
      const minutes = parseInt(match[1]);
      const dish = match[3] || "your food";
      this.setTimer(minutes, dish);
    }
  }
  
  // Get the latest response data
  getLatestResponse() {
    return this.responseData;
  }
  
  // Test the assistant with a message
  testAssistant() {
    console.log('Sending test message to assistant...');
    this.sendMessage("Hello, can you help me make pasta?");
  }
}

// Usage example
const initCookingAssistant = () => {
  // REPLACE WITH YOUR ACTUAL PUBLIC KEY
  const cookingAssistant = new CookingAssistant('a89b3bb5-5b1c-405d-85c0-2fab9e3873d2');
  
  // Don't initialize automatically - let the user start it
  // cookingAssistant.initialize();
  
  return cookingAssistant;
};

// Export the initialization function
export default initCookingAssistant;
