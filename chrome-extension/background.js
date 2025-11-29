// background.js - Veritas Orchestrator

// POINT TO YOUR FASTAPI BACKEND
const API_BASE = 'http://localhost:8000/api';

// Initialize Context Menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'veritas-check',
    title: 'Verify with Veritas Agent',
    contexts: ['selection']
  });
});

// Handle Context Menu (Selection Mode)
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'veritas-check' && info.selectionText) {
    try {
      // Ensure content script is injected
      await ensureContentScriptInjected(tab.id);
      // Run verification flow
      runVerificationFlow(info.selectionText, tab.id);
    } catch (error) {
      console.error('Context menu error:', error);
    }
  }
});

// Helper function to ensure content script is injected
async function ensureContentScriptInjected(tabId) {
  try {
    // Try to ping the content script
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch (error) {
    // Content script not loaded, inject it
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    // Give it a moment to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Helper function to send messages safely
async function sendMessageSafely(tabId, message) {
  if (!tabId) {
    console.warn('No tabId provided to sendMessageSafely');
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    // Only retry if it's an error about the receiver not existing
    if (error.message && error.message.includes('receiving end does not exist')) {
      try {
        // Try to inject content script and retry
        await ensureContentScriptInjected(tabId);
        await chrome.tabs.sendMessage(tabId, message);
      } catch (retryError) {
        console.error('Failed to send message after retry:', retryError.message);
      }
    } else {
      // For other errors (like closed message channel), just log and continue
      console.warn('Message send warning:', error.message);
    }
  }
}

// Handle Messages from Popup/Content
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'check_selection') {
    runVerificationFlow(request.text, sender.tab?.id || request.tabId)
      .then(res => sendResponse(res));
    return true; // Async
  }

  if (request.action === 'scan_page') {
    runPageScan(request.content, sender.tab?.id || request.tabId)
      .then(res => sendResponse(res));
    return true; // Async
  }

  if (request.action === 'capture_screenshot') {
    const tabId = sender.tab?.id || request.tabId;
    if (!tabId) {
      sendResponse({ success: false, error: 'No tab ID available' });
      return false;
    }
    
    handleScreenshotCapture(request.area, tabId)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

// --- CORE VERIFICATION FLOW (MATCHING MAIN.PY) ---
async function runVerificationFlow(text, tabId) {
  try {
    // STEP 1: Main Agent (like main.py)
    if (tabId) {
      await sendMessageSafely(tabId, {
        action: 'status_update',
        status: 'thinking',
        message: '🤖 Main Agent analyzing...'
      });
    }

    const mainResponse = await fetch(`${API_BASE}/main-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userText: text })
    });

    if (!mainResponse.ok) {
      throw new Error(`Main Agent failed: ${mainResponse.status}`);
    }
    
    const plan = await mainResponse.json();

    if (plan.action === "DELEGATE_TO_CHECKER") {
      // STEP 2: Check Agent (like main.py)
      if (tabId) {
        await sendMessageSafely(tabId, {
          action: 'status_update',
          status: 'checking',
          message: '🔍 Check Agent verifying...'
        });
      }

      const checkResponse = await fetch(`${API_BASE}/check-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: plan.checker_query || text })
      });

      if (!checkResponse.ok) {
        throw new Error(`Check Agent failed: ${checkResponse.status}`);
      }
      
      const checkResult = await checkResponse.json();

      // STEP 3: Synthesis (like main.py)
      if (tabId) {
        await sendMessageSafely(tabId, {
          action: 'status_update',
          status: 'synthesizing',
          message: '✨ Synthesizing response...'
        });
      }

      const synthesisResponse = await fetch(`${API_BASE}/synthesis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: text,
          checkResult: checkResult
        })
      });

      if (!synthesisResponse.ok) {
        throw new Error(`Synthesis failed: ${synthesisResponse.status}`);
      }
      
      const synthesisResult = await synthesisResponse.json();

      // Build final result
      const finalPacket = {
        claim: text,
        verdict: checkResult.verdict || 'UNCERTAIN',
        confidence: checkResult.confidence || 0.5,
        sources: checkResult.sources || [],
        analysis: synthesisResult.text || 'Analysis completed.'
      };

      // Send to UI
      if (tabId) {
        await sendMessageSafely(tabId, {
          action: 'validation_complete',
          result: finalPacket
        });
      }

      return { success: true, data: finalPacket };

    } else if (plan.action === "DIRECT_REPLY") {
      // Direct reply from main agent
      const responseText = plan.reply_text || "I can help you verify information.";

      if (tabId) {
        await sendMessageSafely(tabId, {
          action: 'validation_complete',
          result: {
            claim: text,
            verdict: 'INFO',
            confidence: 1.0,
            sources: [],
            analysis: responseText
          }
        });
      }

      return { success: true, data: { analysis: responseText } };
    } else {
      throw new Error('Unknown action from Main Agent');
    }

  } catch (error) {
    console.error("Verification Error:", error);
    if (tabId) {
      await sendMessageSafely(tabId, { 
        action: 'agent_error', 
        error: error.message || 'Verification failed' 
      });
    }
    return { success: false, error: error.message };
  }
}

// --- PAGE SCAN MODE ---
async function runPageScan(pageText, tabId) {
  try {
    // Extract first 5 claim-like sentences
    const sentences = pageText.match(/[^.!?]+[.!?]+/g) || [];
    const claims = sentences
      .filter(s => s.length > 30 && s.length < 300)
      .filter(s => !s.includes('©') && !s.includes('Privacy'))
      .slice(0, 5);

    if (claims.length === 0) {
      if (tabId) {
        await sendMessageSafely(tabId, { 
          action: 'agent_error', 
          error: 'No verifiable claims found on this page.' 
        });
      }
      return { success: false, error: 'No claims found' };
    }

    if (tabId) {
      await sendMessageSafely(tabId, { 
        action: 'status_update', 
        status: 'scanning', 
        message: `📡 Scanning ${claims.length} claims...` 
      });
    }

    // Check each claim
    const results = await Promise.all(claims.map(async (claim, index) => {
      try {
        const res = await fetch(`${API_BASE}/check-agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: claim.trim() })
        });
        
        if (!res.ok) throw new Error('Check failed');
        const result = await res.json();
        
        return {
          claim: claim.trim(),
          verdict: result.verdict || 'UNCERTAIN',
          confidence: result.confidence || 0.5,
          explanation: result.explanation || 'No explanation available',
          sources: result.sources || []
        };
      } catch (err) {
        console.error(`Error checking claim ${index + 1}:`, err);
        return {
          claim: claim.trim(),
          verdict: 'UNCERTAIN',
          confidence: 0,
          explanation: 'Failed to verify this claim.',
          sources: []
        };
      }
    }));

    // Send results
    if (tabId) {
      await sendMessageSafely(tabId, { 
        action: 'scan_complete', 
        results: results
      });
    }

    return { success: true, results: results };

  } catch (error) {
    console.error("Page scan error:", error);
    if (tabId) {
      await sendMessageSafely(tabId, { 
        action: 'agent_error', 
        error: error.message 
      });
    }
    return { success: false, error: error.message };
  }
}

// --- IMAGE CAPTURE FLOW (MATCHING MAIN.PY) ---
async function handleScreenshotCapture(area, tabId) {
  try {
    // Validate inputs
    if (!tabId) {
      throw new Error('Tab ID is required for screenshot capture');
    }
    
    if (!area || !area.width || !area.height) {
      throw new Error('Invalid capture area');
    }

    // Notify UI
    if (tabId) {
      await sendMessageSafely(tabId, {
        action: 'status_update',
        status: 'capturing',
        message: '📸 Capturing screenshot...'
      });
    }

    // Capture screenshot
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    // Crop to selected area
    const croppedBase64 = await cropImage(dataUrl, area);

    if (!croppedBase64) {
      throw new Error('Failed to crop screenshot');
    }

    // STEP 1: Process Image (like main.py)
    if (tabId) {
      await sendMessageSafely(tabId, {
        action: 'status_update',
        status: 'analyzing',
        message: '🖼️ Image Agent extracting content...'
      });
    }

    const imageResponse = await fetch(`${API_BASE}/process-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Image: croppedBase64,
        userMessage: "Extract and verify all claims from this image"
      })
    });

    if (!imageResponse.ok) {
      throw new Error(`Image processing failed: ${imageResponse.status}`);
    }
    
    const imageResult = await imageResponse.json();

    if (!imageResult.combined_query || imageResult.combined_query.includes('Failed')) {
      throw new Error('No readable content found in image');
    }

    // STEP 2: Check Agent (like main.py)
    if (tabId) {
      await sendMessageSafely(tabId, {
        action: 'status_update',
        status: 'checking',
        message: '🔍 Check Agent verifying image content...'
      });
    }

    const checkResponse = await fetch(`${API_BASE}/check-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: imageResult.combined_query })
    });

    if (!checkResponse.ok) {
      throw new Error(`Check Agent failed: ${checkResponse.status}`);
    }
    
    const checkResult = await checkResponse.json();

    // STEP 3: Synthesis (like main.py)
    if (tabId) {
      await sendMessageSafely(tabId, {
        action: 'status_update',
        status: 'synthesizing',
        message: '✨ Synthesizing image analysis...'
      });
    }

    const synthesisResponse = await fetch(`${API_BASE}/synthesis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userQuery: "Image fact-check: " + (imageResult.user_message || "Verify image content"),
        checkResult: checkResult
      })
    });

    if (!synthesisResponse.ok) {
      throw new Error(`Synthesis failed: ${synthesisResponse.status}`);
    }
    
    const synthesisResult = await synthesisResponse.json();

    // Build final result
    const finalPacket = {
      claim: imageResult.extracted_content || 'Image content',
      verdict: checkResult.verdict || 'UNCERTAIN',
      confidence: checkResult.confidence || 0.5,
      sources: checkResult.sources || [],
      analysis: synthesisResult.text || 'Analysis completed.',
      extracted_content: imageResult.extracted_content
    };

    // Send to UI
    if (tabId) {
      await sendMessageSafely(tabId, {
        action: 'image_validation_complete',
        result: finalPacket
      });
    }

    return { success: true, data: finalPacket };

  } catch (error) {
    console.error("Image capture error:", error);
    if (tabId) {
      await sendMessageSafely(tabId, { 
        action: 'agent_error', 
        error: error.message 
      });
    }
    return { success: false, error: error.message };
  }
}

// Helper function to crop image
async function cropImage(dataUrl, area) {
  try {
    // Convert data URL to Blob
    const resp = await fetch(dataUrl);
    const srcBlob = await resp.blob();

    // Create ImageBitmap
    const bitmap = await createImageBitmap(srcBlob);

    // Create canvas and crop
    const canvas = new OffscreenCanvas(area.width, area.height);
    const ctx = canvas.getContext('2d');

    // Draw cropped region
    ctx.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

    // Convert to Blob
    const croppedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });

    // Convert to base64
    const arrayBuffer = await croppedBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    
    return btoa(binary);

  } catch (error) {
    console.error('Image cropping error:', error);
    return null;
  }
}