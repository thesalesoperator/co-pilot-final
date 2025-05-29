// Background script
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with default settings
  chrome.storage.local.set({ overlayActive: false });
  
  // Inject content script into existing tabs
  chrome.tabs.query({ url: 'https://*.close.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css']
      });
    });
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleOverlay') {
    // Forward the toggle message to the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleOverlay',
          state: request.state
        });
      }
    });
    return true;
  }
});