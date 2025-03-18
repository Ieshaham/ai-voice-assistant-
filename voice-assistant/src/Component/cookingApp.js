import initCookingAssistant from './cookingAssistant';

// When your app is ready to start the cooking assistant
const cookingAssistant = initCookingAssistant();

// Connect to UI elements (examples)
document.getElementById('muteButton').addEventListener('click', () => {
  const isMuted = cookingAssistant.toggleMute();
  // Update UI based on mute state
});

document.getElementById('endButton').addEventListener('click', () => {
  cookingAssistant.endSession();
});