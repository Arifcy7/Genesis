// content.js - Veritas UI
console.log('Veritas content script loaded');

// 1. LISTENERS
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Content script received message:', msg);

  if (msg.action === 'ping') {
    sendResponse({ status: 'ready' });
    return true;
  }
  if (msg.action === 'status_update') showLoading(msg.message);
  if (msg.action === 'validation_complete') showResult(msg.result);
  if (msg.action === 'scan_complete') showScanResults(msg.results);
  if (msg.action === 'agent_error') showError(msg.error);
  if (msg.action === 'start_capture') {
    console.log('Starting capture mode...');
    startCaptureMode();
    sendResponse({ success: true });
  }
  if (msg.action === 'image_validation_complete') showImageResult(msg.result);

  return true; // Keep the messaging channel open for async responses
});

// 2. UI BUILDER
function createWidget() {
  let w = document.getElementById('veritas-widget');
  if (!w) {
    w = document.createElement('div');
    w.id = 'veritas-widget';
    w.style.cssText = `
      position: fixed; top: 20px; right: 20px; width: 380px; max-width: 90vw;
      background: #0f172a; color: white; z-index: 2147483647;
      border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      border: 1px solid #334155; overflow: hidden; 
      transition: all 0.3s ease; backdrop-filter: blur(10px);
    `;
    document.body.appendChild(w);
  }
  return w;
}

// 3. STATES
function showLoading(text) {
  const w = createWidget();
  w.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <div style="font-size: 24px; animation: spin 1s linear infinite;">⚙️</div>
      <h3 style="margin: 10px 0 5px; color: #10b981; font-size: 16px;">Veritas Agent</h3>
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">${text}</p>
    </div>
    <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
  `;
}

function showResult(data) {
  const w = createWidget();
  const color = data.verdict === 'REAL' ? '#10b981' : data.verdict === 'FAKE' ? '#ef4444' : '#f59e0b';
  const icon = data.verdict === 'REAL' ? '✅' : data.verdict === 'FAKE' ? '❌' : '⚠️';

  // Clean up claim text for display
  const cleanClaim = data.claim.length > 100 ? data.claim.substring(0, 100) + '...' : data.claim;

  w.innerHTML = `
    <div style="background: ${color}20; padding: 15px; border-bottom: 1px solid ${color}; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <span style="font-size: 24px;">${icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 900; font-size: 18px; color: ${color}; letter-spacing: 1px;">${data.verdict}</div>
          <div style="font-size: 11px; color: #94a3b8; font-weight: bold;">CONFIDENCE: ${Math.round(data.confidence * 100)}%</div>
        </div>
      </div>
      <button id="v-close" style="background:none; border:none; color:white; cursor:pointer; font-size: 20px; padding: 5px;">&times;</button>
    </div>
    
    <div style="padding: 15px;">
      <div style="font-size: 11px; color: #64748b; margin-bottom: 10px; font-style: italic;">
        "${cleanClaim}"
      </div>
      
      <div style="font-size: 13px; line-height: 1.6; color: #e2e8f0; margin-bottom: 15px;">
        ${formatSynthesis(data.analysis)}
      </div>

      ${data.sources && data.sources.length > 0 ? `
        <div style="border-top: 1px solid #334155; padding-top: 15px;">
          <div style="font-size: 10px; font-weight: bold; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase;">Verified Sources</div>
          ${data.sources.slice(0, 3).map(s => `
            <a href="${s.uri}" target="_blank" style="display: block; color: #3b82f6; font-size: 11px; text-decoration: none; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              🔗 ${s.title || 'Source Link'}
            </a>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  
  const closeBtn = document.getElementById('v-close');
  if (closeBtn) {
    closeBtn.onclick = () => w.remove();
  }
}

function showScanResults(results) {
  const w = createWidget();
  w.innerHTML = `
    <div style="background: #1e293b; padding: 15px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; color: white; font-size: 16px;">📊 Page Scan Results</h3>
      <button id="v-close" style="background:none; border:none; color:white; cursor:pointer; font-size: 18px; padding: 5px;">&times;</button>
    </div>
    <div style="padding: 0; max-height: 400px; overflow-y: auto;">
      ${results.map((r, index) => `
        <div style="padding: 15px; border-bottom: 1px solid #334155;">
          <div style="font-size: 11px; color: #64748b; margin-bottom: 5px; line-height: 1.4;">
            <strong>Claim ${index + 1}:</strong> "${r.claim.length > 80 ? r.claim.substring(0, 80) + '...' : r.claim}"
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
            <span style="font-weight: bold; font-size: 12px; color: ${
              r.verdict === 'REAL' ? '#10b981' : 
              r.verdict === 'FAKE' ? '#ef4444' : '#f59e0b'
            }">
              ${r.verdict === 'REAL' ? '✅' : r.verdict === 'FAKE' ? '❌' : '⚠️'} ${r.verdict}
            </span>
            <span style="font-size: 10px; background: #334155; padding: 2px 6px; border-radius: 4px;">
              ${Math.round(r.confidence * 100)}%
            </span>
          </div>
          ${r.explanation ? `
            <div style="font-size: 10px; color: #94a3b8; line-height: 1.3; margin-top: 5px;">
              ${r.explanation.substring(0, 150)}${r.explanation.length > 150 ? '...' : ''}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    <div style="padding: 10px; background: #1e293b; text-align: center; border-top: 1px solid #334155;">
      <div style="font-size: 10px; color: #64748b;">
        Scanned ${results.length} claims • Right-click any text to verify individually
      </div>
    </div>
  `;
  
  const closeBtn = document.getElementById('v-close');
  if (closeBtn) {
    closeBtn.onclick = () => w.remove();
  }
}

function formatSynthesis(text) {
  if (!text) return 'Analysis completed.';
  
  // Convert markdown bold to HTML bold for display
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Limit length for popup display
  if (formatted.length > 300) {
    formatted = formatted.substring(0, 300) + '...';
  }
  
  return formatted;
}

function showError(msg) {
  const w = createWidget();
  w.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <div style="font-size: 24px; color: #ef4444;">⚠️</div>
      <h3 style="margin: 10px 0 5px; color: #ef4444; font-size: 16px;">Error</h3>
      <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.4;">${msg}</p>
      <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
        Close
      </button>
    </div>
  `;
  setTimeout(() => {
    if (w && w.parentElement) w.remove();
  }, 5000);
}

// 4. PAGE CONTENT EXTRACTION
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
  
  // Clean up the text
  return content
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
    .trim();
}

// 5. CAPTURE MODE FUNCTIONALITY
let captureOverlay = null;
let isCapturing = false;
let startX, startY, endX, endY;

function startCaptureMode() {
  console.log('startCaptureMode called, isCapturing:', isCapturing);

  if (isCapturing) {
    console.log('Already capturing, returning...');
    return;
  }

  console.log('Setting up capture mode...');
  isCapturing = true;
  createCaptureOverlay();
  showCaptureInstructions();
  console.log('Capture mode setup complete');
}

function createCaptureOverlay() {
  console.log('Creating capture overlay...');

  // Create overlay
  captureOverlay = document.createElement('div');
  captureOverlay.id = 'veritas-capture-overlay';
  captureOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.3); z-index: 2147483647;
    cursor: crosshair; user-select: none;
  `;

  // Create selection box
  const selectionBox = document.createElement('div');
  selectionBox.id = 'veritas-selection-box';
  selectionBox.style.cssText = `
    position: absolute; border: 2px dashed #10b981;
    background: rgba(16, 185, 129, 0.1); display: none;
  `;
  captureOverlay.appendChild(selectionBox);

  // Create done button
  const doneButton = document.createElement('button');
  doneButton.id = 'veritas-done-btn';
  doneButton.textContent = 'Done';
  doneButton.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 2147483648;
    padding: 10px 20px; background: #10b981; color: white; border: none;
    border-radius: 8px; cursor: pointer; font-weight: bold; display: none;
  `;
  document.body.appendChild(doneButton);

  // Mouse events for selection
  let isDrawing = false;

  captureOverlay.addEventListener('mousedown', (e) => {
    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.display = 'block';
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
  });

  captureOverlay.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    endX = e.clientX;
    endY = e.clientY;

    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  });

  captureOverlay.addEventListener('mouseup', () => {
    if (isDrawing) {
      isDrawing = false;
      doneButton.style.display = 'block';
    }
  });

  // Done button click
  doneButton.addEventListener('click', () => {
    capturSelectedArea();
  });

  // Handle keyboard events
  document.addEventListener('keydown', function keyHandler(e) {
    if (e.key === 'Escape') {
      console.log('ESC pressed, canceling capture');
      cancelCapture();
      document.removeEventListener('keydown', keyHandler);
    }
    if (e.key === 'Enter') {
      console.log('Enter pressed, capturing selected area');
      const doneButton = document.getElementById('veritas-done-btn');
      if (doneButton && doneButton.style.display !== 'none') {
        capturSelectedArea();
      }
      document.removeEventListener('keydown', keyHandler);
    }
  });

  document.body.appendChild(captureOverlay);
}

function showCaptureInstructions() {
  const instructionWidget = createWidget();
  instructionWidget.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <div style="font-size: 24px; color: #3b82f6;">📸</div>
      <h3 style="margin: 10px 0 5px; color: #3b82f6; font-size: 16px;">Capture Mode</h3>
      <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.4;">
        Drag to select the area you want to fact-check.<br>
        Press <strong>Done</strong> when ready or <strong>ESC</strong> to cancel.
      </p>
    </div>
  `;
}

function capturSelectedArea() {
  console.log('capturSelectedArea called');

  const selectionBox = document.getElementById('veritas-selection-box');
  if (!selectionBox) {
    console.log('No selection box found');
    return;
  }

  const rect = selectionBox.getBoundingClientRect();
  console.log('Selection area:', rect);

  if (rect.width < 10 || rect.height < 10) {
    console.log('Selection too small:', rect.width, 'x', rect.height);
    showError('Selection too small. Please select a larger area.');
    cancelCapture();
    return;
  }

  console.log('Starting screenshot capture...');
  showLoading('📸 Capturing screenshot...');

  const captureData = {
    x: Math.round(rect.left * window.devicePixelRatio),
    y: Math.round(rect.top * window.devicePixelRatio),
    width: Math.round(rect.width * window.devicePixelRatio),
    height: Math.round(rect.height * window.devicePixelRatio)
  };

  console.log('Sending capture data:', captureData);

  // Send capture request to background script
  chrome.runtime.sendMessage({
    action: 'capture_screenshot',
    area: captureData
  }, function(response) {
    if (chrome.runtime.lastError) {
      console.error('Runtime error during capture:', chrome.runtime.lastError);
      showError('Screenshot capture failed: ' + chrome.runtime.lastError.message);
      return;
    }
    
    // Check if response is valid
    if (!response) {
      console.error('No response received from background script');
      showError('Failed to process screenshot - no response from extension');
      return;
    }
    
    console.log('Response from background script:', response);
    
    // Handle response based on success
    if (response.success === false) {
      showError(response.error || 'Failed to process screenshot');
    }
    // Success case is handled by 'image_validation_complete' message listener
  });

  cancelCapture();
}

function cancelCapture() {
  isCapturing = false;

  if (captureOverlay) {
    captureOverlay.remove();
    captureOverlay = null;
  }

  const doneButton = document.getElementById('veritas-done-btn');
  if (doneButton) {
    doneButton.remove();
  }

  const widget = document.getElementById('veritas-widget');
  if (widget) {
    widget.remove();
  }
}

function showImageResult(data) {
  const w = createWidget();
  const color = data.verdict === 'REAL' ? '#10b981' : data.verdict === 'FAKE' ? '#ef4444' : '#f59e0b';
  const icon = data.verdict === 'REAL' ? '✅' : data.verdict === 'FAKE' ? '❌' : '⚠️';

  w.innerHTML = `
    <div style="background: ${color}20; padding: 15px; border-bottom: 1px solid ${color}; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <span style="font-size: 24px;">${icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 900; font-size: 18px; color: ${color}; letter-spacing: 1px;">${data.verdict}</div>
          <div style="font-size: 11px; color: #94a3b8; font-weight: bold;">FROM IMAGE • CONFIDENCE: ${Math.round(data.confidence * 100)}%</div>
        </div>
      </div>
      <button id="v-close" style="background:none; border:none; color:white; cursor:pointer; font-size: 20px; padding: 5px;">&times;</button>
    </div>

    <div style="padding: 15px;">
      <div style="font-size: 11px; color: #64748b; margin-bottom: 10px; font-style: italic;">
        "Image Content: ${data.extracted_content?.substring(0, 100) || 'Extracted from screenshot'}..."
      </div>

      <div style="font-size: 13px; line-height: 1.6; color: #e2e8f0; margin-bottom: 15px;">
        ${formatSynthesis(data.analysis)}
      </div>

      ${data.sources && data.sources.length > 0 ? `
        <div style="border-top: 1px solid #334155; padding-top: 15px;">
          <div style="font-size: 10px; font-weight: bold; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase;">Verified Sources</div>
          ${data.sources.slice(0, 3).map(s => `
            <a href="${s.uri}" target="_blank" style="display: block; color: #3b82f6; font-size: 11px; text-decoration: none; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              🔗 ${s.title || 'Source Link'}
            </a>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  const closeBtn = document.getElementById('v-close');
  if (closeBtn) {
    closeBtn.onclick = () => w.remove();
  }
}