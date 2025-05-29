// Content script for Close CRM Co-Pilot

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);

// Global variables
let overlay = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let overlayActive = false;

// Initialize the extension
function initialize() {
  // Check if overlay should be active
  chrome.storage.local.get(['overlayActive'], (result) => {
    overlayActive = result.overlayActive || false;
    if (overlayActive) {
      createOverlay();
    }
  });
  
  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleOverlay') {
      toggleOverlay(request.state);
      sendResponse({ success: true });
    }
    return true;
  });
}

// Create and append the floating overlay
function createOverlay() {
  if (overlay) {
    document.body.removeChild(overlay);
  }
  
  overlay = document.createElement('div');
  overlay.className = 'close-assistant-overlay';
  overlay.style.top = '20px';
  overlay.style.right = '20px';
  
  const header = document.createElement('div');
  header.className = 'close-assistant-overlay-header';
  
  const title = document.createElement('h2');
  title.className = 'close-assistant-overlay-title';
  title.textContent = 'Close CRM Co-Pilot';
  
  const actions = document.createElement('div');
  actions.className = 'close-assistant-overlay-actions';
  
  const minimizeBtn = document.createElement('button');
  minimizeBtn.className = 'close-assistant-overlay-btn';
  minimizeBtn.innerHTML = '−';
  minimizeBtn.title = 'Minimize';
  minimizeBtn.addEventListener('click', () => toggleOverlay(false));
  
  actions.appendChild(minimizeBtn);
  header.appendChild(title);
  header.appendChild(actions);
  
  // Make overlay draggable
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = overlay.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    overlay.style.left = `${x}px`;
    overlay.style.right = 'auto';
    overlay.style.top = `${y}px`;
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  // Create chat interface
  const content = document.createElement('div');
  content.className = 'close-assistant-overlay-content';
  
  const chat = document.createElement('div');
  chat.className = 'close-assistant-chat';
  
  const chatMessages = document.createElement('div');
  chatMessages.className = 'close-assistant-chat-messages';
  chatMessages.id = 'chatMessages';
  
  const welcomeMessage = document.createElement('div');
  welcomeMessage.className = 'close-assistant-chat-message bot';
  welcomeMessage.textContent = 'Hello! I\'m your Close CRM Co-Pilot. How can I help you today?';
  chatMessages.appendChild(welcomeMessage);
  
  const setupMessage = document.createElement('div');
  setupMessage.className = 'close-assistant-chat-message bot';
  setupMessage.textContent = 'Note: The server is not connected yet. Please deploy the backend to Railway and update the API endpoint to enable chat functionality.';
  chatMessages.appendChild(setupMessage);
  
  const chatInputContainer = document.createElement('div');
  chatInputContainer.className = 'close-assistant-chat-input-container';
  
  const chatInput = document.createElement('textarea');
  chatInput.className = 'close-assistant-chat-input';
  chatInput.id = 'chatInput';
  chatInput.placeholder = 'Type your question here...';
  chatInput.rows = 1;
  
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
  });
  
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
  
  const sendButton = document.createElement('button');
  sendButton.className = 'close-assistant-chat-send';
  sendButton.innerHTML = '↑';
  sendButton.addEventListener('click', sendChatMessage);
  
  chatInputContainer.appendChild(chatInput);
  chatInputContainer.appendChild(sendButton);
  
  chat.appendChild(chatMessages);
  chat.appendChild(chatInputContainer);
  content.appendChild(chat);
  
  // Assemble overlay
  overlay.appendChild(header);
  overlay.appendChild(content);
  
  // Add to document
  document.body.appendChild(overlay);
}

// Send chat message
async function sendChatMessage() {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const message = chatInput.value.trim();
  
  if (!message) return;
  
  // Add user message to chat
  const userMessageEl = document.createElement('div');
  userMessageEl.className = 'close-assistant-chat-message user';
  userMessageEl.textContent = message;
  chatMessages.appendChild(userMessageEl);
  
  // Clear input
  chatInput.value = '';
  chatInput.style.height = 'auto';
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  try {
    // Send message to server
    const response = await fetch('co-pilot-final-production.up.railway.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error('Server not connected. Please deploy the backend to Railway first.');
    }
    
    const data = await response.json();
    
    // Add bot response to chat
    const botMessageEl = document.createElement('div');
    botMessageEl.className = 'close-assistant-chat-message bot';
    botMessageEl.textContent = data.response;
    chatMessages.appendChild(botMessageEl);
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Add error message to chat
    const errorMessageEl = document.createElement('div');
    errorMessageEl.className = 'close-assistant-chat-message bot error';
    errorMessageEl.innerHTML = `
      The server is not connected yet. To enable chat functionality:<br><br>
      1. Deploy the backend to Railway<br>
      2. Set up the environment variables<br>
      3. Update the API endpoint in the extension
    `;
    chatMessages.appendChild(errorMessageEl);
  }
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show/hide overlay
function toggleOverlay(state) {
  overlayActive = typeof state === 'boolean' ? state : !overlayActive;
  
  if (overlayActive) {
    if (!overlay) {
      createOverlay();
    } else {
      overlay.style.display = 'flex';
    }
  } else if (overlay) {
    overlay.style.display = 'none';
  }
  
  // Save state
  chrome.storage.local.set({ overlayActive });
}

// Initialize on script load
initialize();
