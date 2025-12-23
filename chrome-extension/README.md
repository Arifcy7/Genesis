# Genesis Chrome Extension

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Make sure your FastAPI backend is running on `http://localhost:8000`

## Usage

### Method 1: Page Scan
- Click the Genesis extension icon
- Click "Scan This Page"
- View results overlay on the page

### Method 2: Text Selection  
- Highlight any text on a webpage
- Right-click and select "Verify with Genesis Agent"
- View verification results in overlay

## Features
- ✅ Real-time fact checking
- 🔍 Full page content scanning
- 📊 Multi-claim analysis
- 🌐 Works on any website
- 🚀 Uses your existing FastAPI backend

## Backend Connection
The extension connects to your existing Genesis backend at `http://localhost:8000` and uses the same agents:
- Check Agent (`/api/check-agent`)
- Synthesis Agent (`/api/synthesis`)

No changes needed to your backend code!