document.addEventListener('DOMContentLoaded', () => {
  // Get form and list elements
  const keywordForm = document.getElementById('keywordForm');
  const keywordsList = document.getElementById('keywordsList');
  const searchInput = document.getElementById('searchKeywords');
  const keywordTemplate = document.getElementById('keywordTemplate');
  
  // Modal elements
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const closeEditBtn = editModal.querySelector('.close-btn');
  
  const importExportModal = document.getElementById('importExportModal');
  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');
  const closeImportExportBtn = importExportModal.querySelector('.close-btn');
  const exportContainer = document.getElementById('exportContainer');
  const importContainer = document.getElementById('importContainer');
  const exportData = document.getElementById('exportData');
  const importData = document.getElementById('importData');
  const copyExportBtn = document.getElementById('copyExportBtn');
  const confirmImportBtn = document.getElementById('confirmImportBtn');
  
  // Load keywords from storage
  function loadKeywords() {
    chrome.storage.local.get(['keywords'], (result) => {
      const keywords = result.keywords || [];
      renderKeywordsList(keywords);
    });
  }
  
  // Render keywords list
  function renderKeywordsList(keywords, searchTerm = '') {
    // Clear current list
    keywordsList.innerHTML = '';
    
    // Filter keywords if search term exists
    const filteredKeywords = searchTerm 
      ? keywords.filter(k => 
          k.keyword.toLowerCase().includes(searchTerm.toLowerCase()) || 
          k.videoTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      : keywords;
    
    if (filteredKeywords.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      
      if (searchTerm) {
        emptyState.innerHTML = `<p>No keywords matching "${searchTerm}"</p>`;
      } else {
        emptyState.innerHTML = `<p>No keywords added yet. Add your first keyword above.</p>`;
      }
      
      keywordsList.appendChild(emptyState);
      return;
    }
    
    // Add each keyword to the list
    filteredKeywords.forEach((item, index) => {
      const keywordItem = keywordTemplate.content.cloneNode(true);
      
      // Fill in template data
      keywordItem.querySelector('.keyword-text').textContent = item.keyword;
      keywordItem.querySelector('.video-title').textContent = item.videoTitle;
      keywordItem.querySelector('.keyword-description').textContent = item.description || 'No description provided';
      
      const videoLink = keywordItem.querySelector('.video-url');
      videoLink.href = item.videoUrl;
      videoLink.textContent = 'View Video';
      
      // Set up edit button
      const editBtn = keywordItem.querySelector('.edit-btn');
      editBtn.addEventListener('click', () => {
        editKeyword(index);
      });
      
      // Set up delete button
      const deleteBtn = keywordItem.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => {
        deleteKeyword(index);
      });
      
      keywordsList.appendChild(keywordItem);
    });
  }
  
  // Add new keyword
  keywordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const keyword = document.getElementById('keyword').value.trim();
    const videoTitle = document.getElementById('videoTitle').value.trim();
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const description = document.getElementById('description').value.trim();
    
    chrome.storage.local.get(['keywords'], (result) => {
      const keywords = result.keywords || [];
      
      // Check if keyword already exists
      const exists = keywords.some(k => k.keyword.toLowerCase() === keyword.toLowerCase());
      if (exists) {
        alert(`Keyword "${keyword}" already exists. Please use a different keyword.`);
        return;
      }
      
      // Add new keyword
      keywords.push({ keyword, videoTitle, videoUrl, description });
      
      // Save to storage
      chrome.storage.local.set({ keywords }, () => {
        // Reset form
        keywordForm.reset();
        
        // Refresh list
        renderKeywordsList(keywords);
      });
    });
  });
  
  // Edit keyword
  function editKeyword(index) {
    chrome.storage.local.get(['keywords'], (result) => {
      const keywords = result.keywords || [];
      const keyword = keywords[index];
      
      if (!keyword) return;
      
      // Fill edit form
      document.getElementById('editIndex').value = index;
      document.getElementById('editKeyword').value = keyword.keyword;
      document.getElementById('editVideoTitle').value = keyword.videoTitle;
      document.getElementById('editVideoUrl').value = keyword.videoUrl;
      document.getElementById('editDescription').value = keyword.description || '';
      
      // Show modal
      editModal.classList.add('active');
    });
  }
  
  // Submit edit form
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const index = parseInt(document.getElementById('editIndex').value);
    const keyword = document.getElementById('editKeyword').value.trim();
    const videoTitle = document.getElementById('editVideoTitle').value.trim();
    const videoUrl = document.getElementById('editVideoUrl').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    
    chrome.storage.local.get(['keywords'], (result) => {
      const keywords = result.keywords || [];
      
      // Check if updated keyword already exists (except current one)
      const exists = keywords.some((k, i) => 
        i !== index && k.keyword.toLowerCase() === keyword.toLowerCase()
      );
      
      if (exists) {
        alert(`Keyword "${keyword}" already exists. Please use a different keyword.`);
        return;
      }
      
      // Update keyword
      keywords[index] = { keyword, videoTitle, videoUrl, description };
      
      // Save to storage
      chrome.storage.local.set({ keywords }, () => {
        // Close modal
        editModal.classList.remove('active');
        
        // Refresh list
        renderKeywordsList(keywords);
      });
    });
  });
  
  // Delete keyword
  function deleteKeyword(index) {
    if (!confirm('Are you sure you want to delete this keyword?')) return;
    
    chrome.storage.local.get(['keywords'], (result) => {
      const keywords = result.keywords || [];
      
      // Remove keyword
      keywords.splice(index, 1);
      
      // Save to storage
      chrome.storage.local.set({ keywords }, () => {
        // Refresh list
        renderKeywordsList(keywords);
      });
    });
  }
  
  // Search keywords
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.trim();
    
    chrome.storage.local.get(['keywords'], (result) => {
      const keywords = result.keywords || [];
      renderKeywordsList(keywords, searchTerm);
    });
  });
  
  // Export keywords
  exportBtn.addEventListener('click', () => {
    chrome.storage.local.get(['keywords'], (result) => {
      const keywords = result.keywords || [];
      exportData.value = JSON.stringify(keywords, null, 2);
      
      importExportModal.classList.add('active');
      document.getElementById('importExportTitle').textContent = 'Export Keywords';
      exportContainer.classList.remove('hidden');
      importContainer.classList.add('hidden');
    });
  });
  
  // Copy export data
  copyExportBtn.addEventListener('click', () => {
    exportData.select();
    document.execCommand('copy');
    
    copyExportBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyExportBtn.textContent = 'Copy to Clipboard';
    }, 2000);
  });
  
  // Import keywords
  importBtn.addEventListener('click', () => {
    importExportModal.classList.add('active');
    document.getElementById('importExportTitle').textContent = 'Import Keywords';
    exportContainer.classList.add('hidden');
    importContainer.classList.remove('hidden');
  });
  
  // Confirm import
  confirmImportBtn.addEventListener('click', () => {
    try {
      const importedData = JSON.parse(importData.value);
      const importMode = document.querySelector('input[name="importMode"]:checked').value;
      
      if (!Array.isArray(importedData)) {
        throw new Error('Invalid data format. Expected an array of keywords.');
      }
      
      // Validate each item
      importedData.forEach(item => {
        if (!item.keyword || !item.videoTitle || !item.videoUrl) {
          throw new Error('Invalid data format. Each keyword must have keyword, videoTitle, and videoUrl properties.');
        }
      });
      
      chrome.storage.local.get(['keywords'], (result) => {
        let keywords = [];
        
        if (importMode === 'merge') {
          // Merge with existing keywords
          keywords = result.keywords || [];
          
          // Add only new keywords
          importedData.forEach(newItem => {
            const exists = keywords.some(k => k.keyword.toLowerCase() === newItem.keyword.toLowerCase());
            if (!exists) {
              keywords.push(newItem);
            }
          });
        } else {
          // Replace all keywords
          keywords = importedData;
        }
        
        // Save to storage
        chrome.storage.local.set({ keywords }, () => {
          // Close modal
          importExportModal.classList.remove('active');
          
          // Refresh list
          renderKeywordsList(keywords);
          
          alert(`Successfully imported ${importedData.length} keywords.`);
        });
      });
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    }
  });
  
  // Close modals
  closeEditBtn.addEventListener('click', () => {
    editModal.classList.remove('active');
  });
  
  closeImportExportBtn.addEventListener('click', () => {
    importExportModal.classList.remove('active');
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.classList.remove('active');
    }
    if (e.target === importExportModal) {
      importExportModal.classList.remove('active');
    }
  });
  
  // Initial load
  loadKeywords();
});