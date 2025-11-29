// popup.js - Popup Interface

document.addEventListener('DOMContentLoaded', function() {
  const scanBtn = document.getElementById('scanBtn');
  const captureBtn = document.getElementById('captureBtn');
  const statusDiv = document.getElementById('statusDiv');

  // Check backend connection status
  checkBackendConnection();
  
  // Scan button click handler
  scanBtn.addEventListener('click', async function() {
    try {
      scanBtn.disabled = true;
      scanBtn.innerHTML = '<span>⚙️</span> Scanning...';
      
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }
      
      // Inject content script and extract page content
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractPageText
      });
      
      // Get the extracted text
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          return window.pageTextForVeritas || document.body.innerText;
        }
      });
      
      const pageText = results[0]?.result || '';
      
      if (!pageText.trim()) {
        throw new Error('No content found on this page');
      }
      
      // Send to background script for processing
      chrome.runtime.sendMessage({
        action: 'scan_page',
        content: pageText,
        tabId: tab.id
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          updateStatus('❌ Communication error', '#ef4444');
        } else if (response && response.success) {
          updateStatus('✅ Scan complete! Check the page.', '#10b981');
        } else {
          updateStatus('⚠️ ' + (response?.error || 'Scan failed'), '#f59e0b');
        }
        
        // Reset button
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<span>🔍</span> Scan This Page';
        
        // Close popup after a delay
        setTimeout(() => window.close(), 1500);
      });
      
    } catch (error) {
      console.error('Scan error:', error);
      updateStatus('❌ ' + error.message, '#ef4444');
      scanBtn.disabled = false;
      scanBtn.innerHTML = '<span>🔍</span> Scan This Page';
    }
  });

  // Capture button click handler
  captureBtn.addEventListener('click', async function() {
    try {
      captureBtn.disabled = true;
      captureBtn.innerHTML = '<span>📸</span> Starting Capture...';

      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        throw new Error('No active tab found');
      }

      // Send message directly to content script
      console.log('Sending start_capture message to tab:', tab.id);

      chrome.tabs.sendMessage(tab.id, {
        action: 'start_capture'
      }, function(response) {
        console.log('Response from content script:', response);

        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          console.log('Attempting to inject content script...');

          // Try to inject content script manually
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }, () => {
            if (chrome.runtime.lastError) {
              updateStatus('❌ Cannot inject script on this page', '#ef4444');
              return;
            }

            // Try again after injection
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: 'start_capture' }, (resp) => {
                if (resp && resp.success) {
                  updateStatus('📸 Drag to select area to capture', '#3b82f6');
                  setTimeout(() => window.close(), 500);
                } else {
                  updateStatus('❌ Capture not supported on this page', '#ef4444');
                }
              });
            }, 100);
          });
        } else if (response && response.success) {
          updateStatus('📸 Drag to select area to capture', '#3b82f6');
          // Close popup to allow user to see the page
          setTimeout(() => window.close(), 500);
        } else {
          updateStatus('❌ Failed to start capture mode', '#ef4444');
        }

        // Reset button
        captureBtn.disabled = false;
        captureBtn.innerHTML = '<span>📸</span> Capture Screenshot';
      });

    } catch (error) {
      console.error('Capture error:', error);
      updateStatus('❌ ' + error.message, '#ef4444');
      captureBtn.disabled = false;
      captureBtn.innerHTML = '<span>📸</span> Capture Screenshot';
    }
  });

  async function checkBackendConnection() {
    try {
      const response = await fetch('http://localhost:8000/', {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      
      if (response.ok) {
        updateStatus('🟢 Backend Online', '#10b981');
      } else {
        updateStatus('🟡 Backend Responding (Non-OK)', '#f59e0b');
      }
    } catch (error) {
      updateStatus('🔴 Backend Offline', '#ef4444');
      scanBtn.disabled = true;
    }
  }
  
  function updateStatus(message, color = '#64748b') {
    statusDiv.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 5px; color: ${color};">
        ${message}
      </div>
    `;
  }
});

// Function to be injected into the page
function extractPageText() {
  // Get main content, avoiding navigation and footer elements
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.post-content',
    '.article-body',
    '.entry-content'
  ];
  
  let content = '';
  
  // Try to find main content area first
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = element.innerText;
      break;
    }
  }
  
  // Fallback to body text if no content area found
  if (!content) {
    content = document.body.innerText;
  }
  
  // Clean up the text and store it
  const cleanText = content
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
    .trim();
    
  // Store in window for retrieval
  window.pageTextForVeritas = cleanText;
  
  return cleanText;
}