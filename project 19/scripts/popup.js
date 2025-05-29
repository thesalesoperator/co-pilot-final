document.addEventListener('DOMContentLoaded', () => {
  // Get elements
  const toggleBtn = document.getElementById('toggleOverlay');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const viewAllBtn = document.getElementById('viewAll');
  const optionsBtn = document.getElementById('goToOptions');
  const keywordCountEl = document.getElementById('keywordCount');
  const videoCountEl = document.getElementById('videoCount');
  
  // Check if overlay is active
  chrome.storage.local.get(['overlayActive'], (result) => {
    const isActive = result.overlayActive || false;
    updateStatus(isActive);
  });
  
  // Get keyword and video stats
  chrome.storage.local.get(['keywords'], (result) => {
    const keywords = result.keywords || [];
    keywordCountEl.textContent = keywords.length;
    
    // Count unique videos
    const videos = new Set(keywords.map(k => k.videoUrl));
    videoCountEl.textContent = videos.size;
  });
  
  // Toggle overlay visibility
  toggleBtn.addEventListener('click', () => {
    chrome.storage.local.get(['overlayActive'], (result) => {
      const newState = !result.overlayActive;
      
      // Save new state
      chrome.storage.local.set({ overlayActive: newState });
      updateStatus(newState);
      
      // Send message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.includes('close.com')) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'toggleOverlay', 
            state: newState 
          });
        }
      });
    });
  });
  
  // View all videos
  viewAllBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('close.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showAllVideos' });
      } else {
        alert('Please navigate to a Close.com page first');
      }
    });
  });
  
  // Open options page
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Update status UI
  function updateStatus(isActive) {
    if (isActive) {
      statusDot.classList.add('active');
      statusText.textContent = 'Active';
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = 'Inactive';
    }
  }
});