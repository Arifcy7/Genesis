// lib/audioUtils.js

/**
 * Downsamples audio from browser rate (e.g. 44.1kHz) to Gemini rate (16kHz)
 * This reduces bandwidth by 3x and latency significantly.
 */
export function downsampleBuffer(buffer, inputSampleRate, outputSampleRate = 16000) {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    // Simple averaging (low-pass filter effect) for better quality than dropping samples
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

/**
 * Converts Float32 audio to 16-bit PCM Base64 string
 */
export function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp values to -1 to 1
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit PCM
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  // Optimized binary to base64 conversion
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1024) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 1024, len)));
  }
  return btoa(binary);
}

/**
 * Converts Base64 PCM from Gemini back to AudioBuffer
 */
export function base64ToAudioBuffer(base64, audioContext) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const frameCount = bytes.length / 2;
  const buffer = audioContext.createBuffer(1, frameCount, 24000); // Gemini sends 24kHz
  const channelData = buffer.getChannelData(0);
  const view = new DataView(bytes.buffer);
  
  for (let i = 0; i < frameCount; i++) {
    const int16 = view.getInt16(i * 2, true);
    channelData[i] = int16 / 32768.0;
  }
  return buffer;
}

/**
 * Manages the Audio Queue to prevent choppy playback
 */
export class AudioQueue {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.nextStartTime = 0;
    this.isPlaying = false;
  }

  addToQueue(buffer) {
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

    // Schedule playback
    // If nextStartTime is in the past, reset it to now (handling network lags)
    if (this.nextStartTime < this.ctx.currentTime) {
      this.nextStartTime = this.ctx.currentTime;
    }
    
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  reset() {
    this.nextStartTime = 0;
  }
}

export class FastWebSocketManager {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.isConnected = false;
    this.onMessage = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        this.isConnected = true;
        resolve();
      };
      this.ws.onmessage = (event) => {
        if (this.onMessage) this.onMessage(event);
      };
      this.ws.onerror = (err) => reject(err);
      this.ws.onclose = () => { this.isConnected = false; };
    });
  }

  send(data) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  close() {
    if (this.ws) this.ws.close();
  }
}