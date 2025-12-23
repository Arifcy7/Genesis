"use client";
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Mic, Send, StopCircle, Activity, ShieldCheck, Bot, Terminal, User, AlertTriangle, Loader2, MicOff, ImageIcon, X } from 'lucide-react';

// --- AUDIO UTILS (Inline for simplicity) ---
function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp values to -1 to 1 and convert to 16-bit PCM
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  // Convert to base64 for transmission
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1024) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 1024, len)));
  }
  return btoa(binary);
}

function base64ToAudioBuffer(base64, audioContext) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const frameCount = bytes.length / 2;
  const buffer = audioContext.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  const view = new DataView(bytes.buffer);
  
  for (let i = 0; i < frameCount; i++) {
    const int16 = view.getInt16(i * 2, true);
    channelData[i] = int16 / 32768.0;
  }
  return buffer;
}

class AudioQueue {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.nextStartTime = 0;
  }

  addToQueue(buffer) {
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

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

// --- Chat Interface Component (UI) ---
const ChatInterface = ({ 
  messages = [], 
  onSendMessage, 
  onToggleVoiceMode,
  onStartVoiceRecording,
  onStopVoiceRecording,
  onImageUpload,
  isTyping, 
  agentStatus,
  isVoiceMode,
  isVoiceRecording,
  uploadedImage
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages, isTyping, agentStatus]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !uploadedImage) || isTyping) return;
    
    onSendMessage(inputText, uploadedImage);
    setInputText('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1]; // Remove data URL prefix
        onImageUpload(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const getModeDisplay = () => {
    if (isVoiceMode) return 'VOICE MODE - LIVE SESSION';
    return 'TEXT MODE';
  };

  const getModeColor = () => {
    if (isVoiceMode) return 'bg-red-500 animate-ping';
    return 'bg-emerald-500 animate-pulse';
  };

  return (
    <div className="flex flex-col w-full bg-[#050505] relative font-sans text-white overflow-hidden border-t border-white/10 md:border md:rounded-2xl md:mx-4 md:mb-4 h-[calc(100dvh-64px)] md:h-[calc(100vh-120px)] mt-20 md:mt-28">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      {/* Header */}
      <div className="flex-none bg-[#050505]/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-blue-600 flex items-center justify-center shadow-lg shadow-[#7C3AED]/20">
             <Activity size={16} className="text-white" />
           </div>
           <div>
             <h1 className="font-mono font-bold text-white text-sm tracking-tight">GENESIS <span className="text-[#7C3AED]">AI</span></h1>
             <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
               <span className={`w-1.5 h-1.5 rounded-full ${getModeColor()}`}></span>
               {getModeDisplay()}
             </p>
           </div>
        </div>
        
        {/* Mode Toggle Button */}
        <button 
          onClick={onToggleVoiceMode} 
          disabled={isTyping} 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wide ${
            isVoiceMode 
            ? 'bg-red-500/10 border-red-500 text-red-400' 
            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          } ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isVoiceMode ? <Activity size={12} /> : <Bot size={12} />}
          {isVoiceMode ? 'Voice Mode' : 'Text Mode'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
            
            {/* AGENT-TO-AGENT COMMUNICATION */}
            {msg.sender === 'agent-to-agent' && (
               <div className="w-full flex justify-center my-4">
                 <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-3 max-w-sm w-full flex flex-col gap-2 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-[#7C3AED]"></div>
                   <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
                     <span className="flex items-center gap-1"><Terminal size={10} /> Agent Communication</span>
                     <span className="text-[#7C3AED] flex items-center gap-1 animate-pulse">●</span>
                   </div>
                   <p className="text-xs text-gray-300 font-mono leading-relaxed">
                     <span className="text-[#7C3AED] mr-2">&gt;</span>{msg.text}
                   </p>
                 </div>
               </div>
            )}

            {/* SYSTEM MESSAGES */}
            {msg.sender === 'system' && (
               <div className="w-full flex justify-center my-4">
                 <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2 backdrop-blur-sm">
                   <p className="text-xs text-blue-400 font-medium flex items-center gap-2">
                     <ShieldCheck size={12} /> {msg.text}
                   </p>
                 </div>
               </div>
            )}

            {/* CHAT BUBBLES */}
            {(msg.sender === 'user' || msg.sender === 'bot') && (
              <div className={`flex items-end gap-3 max-w-[90%] sm:max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.sender === 'user' ? 'bg-[#7C3AED] border-[#7C3AED]' : 'bg-[#1A1A1A] border-white/10'}`}>
                  {msg.sender === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-[#7C3AED]" />}
                </div>

                <div className="flex flex-col gap-1 w-full">
                  {msg.sender === 'bot' && msg.agentUsed && (
                    <div className="flex items-center gap-2 ml-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        msg.agentUsed === 'CHECKER' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                        msg.agentUsed === 'SWARM' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                        'bg-[#7C3AED]/10 border-[#7C3AED]/30 text-[#7C3AED]'
                      }`}>
                        {msg.agentUsed}
                      </span>
                      {msg.metadata?.verdict && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          msg.metadata.verdict === 'REAL' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          msg.metadata.verdict === 'FAKE' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                          'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        }`}>
                          {msg.metadata.verdict === 'FAKE' && <AlertTriangle size={8} />}
                          {msg.metadata.verdict}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl shadow-lg backdrop-blur-sm text-sm sm:text-base leading-relaxed ${ 
                    msg.sender === 'user'
                      ? 'bg-[#7C3AED] text-white rounded-br-none'
                      : 'bg-[#1A1A1A] border border-white/10 text-gray-200 rounded-bl-none'
                  }`}>
                    {/* Main message content */}
                    <div className="whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                    
                    {/* Image display for user messages */}
                    {msg.image && (
                      <div className="mt-3">
                        <img 
                          src={`data:image/jpeg;base64,${msg.image}`} 
                          alt="User uploaded" 
                          className="max-w-sm rounded-lg border border-white/10"
                        />
                      </div>
                    )}

                    {/* Verdict badge */}
                    {msg.metadata?.verdict && (
                      <div className="flex items-center gap-2 mt-3">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            msg.metadata.verdict === 'REAL' ? 'bg-green-500/20 text-green-400' :
                            msg.metadata.verdict === 'FAKE' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {msg.metadata.verdict}
                        </span>
                        {msg.metadata.confidence && (
                          <span className="text-xs text-gray-400">
                            {Math.round(msg.metadata.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    )}

                    {/* Sources section - ALWAYS show for bot messages with sources */}
                    {msg.sender === 'bot' && msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-black/30 to-black/20 rounded-xl border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <ShieldCheck size={18} className="text-blue-400" />
                          <span className="text-sm font-semibold text-blue-400">Evidence from {msg.metadata.sources.length} Verified Sources</span>
                        </div>
                        <div className="space-y-3">
                          {msg.metadata.sources.slice(0, 15).map((source, idx) => (
                            <div
                              key={idx}
                              className="group relative p-4 bg-black/30 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all duration-200"
                            >
                              {/* Source header */}
                              <div className="flex items-start gap-3 mb-2">
                                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-300 hover:text-blue-200 font-medium line-clamp-2 underline decoration-dotted underline-offset-2"
                                  >
                                    {source.title}
                                  </a>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                    <span className="truncate">{new URL(source.uri).hostname}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Snippet section - beautiful quote display */}
                              {source.snippet && source.snippet !== "Snippet unavailable" && source.snippet !== "Snippet extraction failed" && (
                                <div className="mt-3 pl-9 pr-2">
                                  <div className="relative p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border-l-4 border-blue-400/50">
                                    <div className="absolute -left-2 top-2 text-blue-400/40 text-4xl leading-none">"</div>
                                    <p className="text-sm text-gray-300 leading-relaxed italic">
                                      {source.snippet}
                                    </p>
                                    <div className="absolute -right-1 bottom-1 text-blue-400/40 text-4xl leading-none">"</div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Snippet status indicators */}
                              {source.snippet === "Snippet unavailable" && (
                                <div className="mt-2 pl-9 text-xs text-gray-500 italic">
                                  Source verification available, snippet not extracted
                                </div>
                              )}
                              {source.snippet === "Snippet extraction failed" && (
                                <div className="mt-2 pl-9 text-xs text-yellow-500/70 italic">
                                  Could not extract snippet from this source
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
           <div className="flex justify-start w-full animate-fade-in-up">
             <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-lg">
               <Loader2 size={16} className="text-[#7C3AED] animate-spin" />
               <span className="text-xs font-mono font-medium text-[#7C3AED] animate-pulse">{agentStatus}</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="flex-none bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 p-3 sm:p-5 z-40">
        {/* Image Preview */}
        {uploadedImage && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-[#1A1A1A] border border-white/10 rounded-xl">
            <img 
              src={`data:image/jpeg;base64,${uploadedImage}`} 
              alt="Uploaded" 
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-300">📸 Image attached for analysis</p>
            </div>
            <button 
              onClick={() => onImageUpload(null)}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center gap-2 sm:gap-4">
          
          {/* Text Mode: Mic button for voice recording OR Voice Mode: Toggle button */}
          {!isVoiceMode ? (
            // Text Mode - Mic button for recording
            <button 
              type="button" 
              onMouseDown={onStartVoiceRecording}
              onMouseUp={onStopVoiceRecording}
              onMouseLeave={onStopVoiceRecording}
              disabled={isTyping} 
              className={`
                relative p-3 sm:p-4 rounded-xl shadow-lg transition-all active:scale-95 border select-none
                ${isVoiceRecording 
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' 
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/50 hover:bg-gray-500/20 hover:text-white'
                }
                ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title="Hold to record voice message"
            >
              {isVoiceRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          ) : (
            // Voice Mode - Stop session button  
            <button 
              type="button" 
              onClick={onToggleVoiceMode} 
              disabled={isTyping} 
              className={`
                relative p-3 sm:p-4 rounded-xl shadow-lg transition-all active:scale-95 border
                bg-red-500/10 text-red-500 border-red-500/50 animate-pulse hover:bg-red-500/20
                ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title="Stop voice session"
            >
              <StopCircle size={20} />
            </button>
          )}

          {/* Image Upload Button (only in text mode) */}
          {!isVoiceMode && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping} 
                className={`
                  relative p-3 sm:p-4 rounded-xl shadow-lg transition-all active:scale-95 border
                  ${uploadedImage 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/50' 
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/50 hover:bg-gray-500/20 hover:text-white'
                  }
                  ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title="Upload image for fact-checking"
              >
                <ImageIcon size={20} />
              </button>
            </>
          )}

          <div className="flex-1 relative">
            <input 
              type="text" 
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50 transition-all placeholder-gray-600" 
              placeholder={
                isVoiceMode ? "Voice mode active - speak to interact..." : 
                uploadedImage ? "Ask about the uploaded image or leave blank to analyze..." :
                "Type a claim to verify or hold mic to record..."
              } 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              disabled={isTyping || isVoiceMode} 
            />
          </div>

          <button 
            type="submit" 
            disabled={(!inputText.trim() && !uploadedImage) || isTyping || isVoiceMode} 
            className="p-3 sm:p-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl shadow-lg disabled:opacity-50 transition-all active:scale-95"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function Main() {
  const [messages, setMessages] = useState([
    { 
        id: 1, 
        sender: 'bot', 
        text: 'Hello! I\'m your AI fact-checker. I can verify claims, check news, monitor trends, and more. What would you like me to verify?', 
        timestamp: new Date(), 
        agentUsed: 'SYSTEM' 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false); // Voice mode (live session)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false); // Voice recording state for mic in text mode
  const [agentStatus, setAgentStatus] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  // Voice recording refs
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Live voice session refs
  const websocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef(null);

  // Backend URL
  const API_BASE_URL = 'http://localhost:8000';

  // --- TEXT MODE: Complete Agent Workflow ---
  const handleSendMessage = async (text, imageData = null) => {
    const userMsg = { 
      id: Date.now(), 
      sender: 'user', 
      text, 
      timestamp: new Date(),
      image: imageData // Add image data if present
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setAgentStatus("🧠 Main Agent routing...");

    try {
        let responseText = '';

        if (imageData) {
          // STEP 1: Process image first
          setAgentStatus("🖼️ Image Agent processing...");
          
          const imageRes = await fetch(`${API_BASE_URL}/api/process-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              base64Image: imageData, 
              userMessage: text 
            })
          });
          
          if (!imageRes.ok) throw new Error('Image processing failed');
          const imageResult = await imageRes.json();
          
          // Add image agent communication
          setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'agent-to-agent',
            text: `Image Agent → Check Agent: "${imageResult.combined_query}"`,
            timestamp: new Date()
          }]);

          // STEP 2: Send extracted content to Check Agent
          setAgentStatus("🔍 Check Agent verifying image content...");
          
          const checkRes = await fetch(`${API_BASE_URL}/api/check-agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: imageResult.combined_query })
          });
          
          if (!checkRes.ok) throw new Error('Check agent failed');
          const checkResult = await checkRes.json();

          // STEP 3: Synthesis
          setAgentStatus("✨ Synthesizing image analysis...");
          const synthRes = await fetch(`${API_BASE_URL}/api/synthesis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userQuery: `Image analysis: ${text || 'Verify content in uploaded image'}`, 
              checkResult: checkResult 
            })
          });
          
          if (!synthRes.ok) throw new Error('Synthesis failed');
          const synthData = await synthRes.json();

          responseText = `📸 Image Analysis Complete\n\n🔍 Extracted Content: ${imageResult.extracted_content}\n\n${synthData.text}`;

          setMessages(prev => [...prev, { 
            id: Date.now(), 
            sender: 'bot', 
            text: responseText, 
            timestamp: new Date(), 
            agentUsed: 'IMAGE_CHECKER', 
            metadata: { 
              verdict: checkResult.verdict, 
              confidence: checkResult.confidence, 
              sources: checkResult.sources,
              extracted_content: imageResult.extracted_content
            } 
          }]);

        } else {
          // Regular text processing (existing logic)
          // STEP 1: Main Agent decides what to do
          const mainRes = await fetch(`${API_BASE_URL}/api/main-agent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userText: text })
          });
          
          if (!mainRes.ok) throw new Error('Main agent failed');
          const plan = await mainRes.json();

          if (plan.action === "DELEGATE_TO_CHECKER") {
              setAgentStatus("🔍 Check Agent verifying...");

              // Add agent communication message
              setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'agent-to-agent',
                text: `Main Agent → Check Agent: "${plan.checker_query}"`,
                timestamp: new Date()
              }]);

              // STEP 2: Check Agent verification
              const checkRes = await fetch(`${API_BASE_URL}/api/check-agent`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: plan.checker_query })
              });
              
              if (!checkRes.ok) throw new Error('Check agent failed');
              const checkResult = await checkRes.json();

              // STEP 3: Synthesis
              setAgentStatus("✨ Synthesizing response...");
              const synthRes = await fetch(`${API_BASE_URL}/api/synthesis`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      userQuery: text, 
                      checkResult: checkResult 
                  })
              });
              
              if (!synthRes.ok) throw new Error('Synthesis failed');
              const synthData = await synthRes.json();

              responseText = synthData.text;

              setMessages(prev => [...prev, { 
                  id: Date.now(), 
                  sender: 'bot', 
                  text: responseText, 
                  timestamp: new Date(), 
                  agentUsed: 'CHECKER', 
                  metadata: { 
                      verdict: checkResult.verdict, 
                      confidence: checkResult.confidence, 
                      sources: checkResult.sources 
                  } 
              }]);

          } else if (plan.action === "SCAN_CRISIS") {
              setAgentStatus("📡 Crisis Scanner deploying...");
              
              setMessages(prev => [...prev, { 
                  id: Date.now(), 
                  sender: 'agent-to-agent', 
                  text: `Main Agent → Crisis Scanner: Monitoring "${plan.scan_topic}"`, 
                  timestamp: new Date() 
              }]);

              // Crisis Scanner
              const scanRes = await fetch(`${API_BASE_URL}/api/scan-crisis`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ topic: plan.scan_topic })
              });
              
              if (!scanRes.ok) throw new Error('Scanner failed');
              const trends = await scanRes.json();

              // Format results with detailed information and sources
              responseText = `📊 Crisis Scan Complete: ${trends.length} trending claims found\n\n`;
              
              trends.forEach((t, idx) => {
                  const icon = t.verdict === 'FAKE' ? '❌' : t.verdict === 'REAL' ? '✅' : '⚠️';
                  responseText += `${idx + 1}. ${icon} [${t.verdict}] ${t.claim}\n`;
                  responseText += `   📈 Severity: ${t.severity} | Volume: ${t.volume} mentions\n`;
                  if (t.confidence) {
                      responseText += `   🎯 Confidence: ${(t.confidence * 100).toFixed(1)}%\n`;
                  }
                  if (t.explanation) {
                      responseText += `   📝 ${t.explanation.substring(0, 200)}...\n`;
                  }
                  responseText += '\n';
              });

              setMessages(prev => [...prev, { 
                  id: Date.now(), 
                  sender: 'bot', 
                  text: responseText, 
                  timestamp: new Date(), 
                  agentUsed: 'SWARM', 
                  metadata: { 
                      trends: trends,
                      // Collect all sources from all trends
                      sources: trends.flatMap(t => t.sources || []).slice(0, 10)
                  } 
              }]);

          } else {
              // Direct reply
              responseText = plan.reply_text || "I'm ready to help verify information.";
              setMessages(prev => [...prev, { 
                  id: Date.now(), 
                  sender: 'bot', 
                  text: responseText, 
                  timestamp: new Date(), 
                  agentUsed: 'ORCHESTRATOR' 
              }]);
          }
        }

        return responseText;

    } catch (error) {
        console.error('Error in agent workflow:', error);
        const errorText = `⚠️ Error: ${error.message}. Make sure the backend is running on ${API_BASE_URL}`;
        setMessages(prev => [...prev, { 
            id: Date.now(), 
            sender: 'bot', 
            text: errorText, 
            timestamp: new Date(), 
            agentUsed: 'SYSTEM_ERROR' 
        }]);
        return errorText;
    } finally {
        setIsTyping(false);
        setAgentStatus(null);
        setUploadedImage(null); // Clear uploaded image after processing
    }
  };

  // --- VOICE RECORDING IN TEXT MODE ---
  const handleStartVoiceRecording = async () => {
    if (isVoiceRecording || isVoiceMode) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordedChunksRef.current.length > 0) {
          setAgentStatus('🎤 Transcribing speech...');
          
          try {
            const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            // Call transcribe API
            const transcribeRes = await fetch(`${API_BASE_URL}/api/transcribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                base64Audio: base64Audio, 
                mimeType: 'audio/webm' 
              })
            });
            
            if (!transcribeRes.ok) throw new Error('Transcription failed');
            const transcribeData = await transcribeRes.json();
            
            if (transcribeData.text && transcribeData.text.trim()) {
              // Process transcribed text through the normal agent workflow
              await handleSendMessage(transcribeData.text.trim());
            } else {
              setAgentStatus('❌ No speech detected');
              setTimeout(() => setAgentStatus(null), 2000);
            }
            
          } catch (error) {
            console.error('Transcription error:', error);
            setAgentStatus('❌ Transcription failed');
            setTimeout(() => setAgentStatus(null), 2000);
          }
        }
        
        // Cleanup
        recordedChunksRef.current = [];
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsVoiceRecording(true);
      setAgentStatus('🎤 Recording... (release to stop)');

    } catch (error) {
      console.error('Voice recording error:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'system',
        text: `❌ Voice recording failed: ${error.message}`
      }]);
    }
  };

  const handleStopVoiceRecording = () => {
    if (!isVoiceRecording) return;
    
    setIsVoiceRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // --- IMAGE UPLOAD HANDLING ---
  const handleImageUpload = (base64Image) => {
    setUploadedImage(base64Image);
  };

  // --- VOICE MODE (Live Session) ---
  const handleToggleVoiceMode = async () => {
    if (isVoiceMode) {
      // Stop voice mode session
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setIsVoiceMode(false);
      setAgentStatus(null);
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'system',
        text: '🔌 Voice mode ended'
      }]);
      
      return;
    }

    // Start voice mode session
    setIsVoiceMode(true);
    setAgentStatus('🎤 Starting voice mode...');

    try {
      // Initialize audio context for playback (24kHz for Gemini output)
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass({ 
        latencyHint: 'interactive',
        sampleRate: 24000 // Gemini outputs at 24kHz
      });
      audioContextRef.current = ctx;
      audioQueueRef.current = new AudioQueue(ctx);

      // Connect to WebSocket
      const ws = new WebSocket(`ws://localhost:8000/ws/live-session`);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('🎤 WebSocket connected');
        setAgentStatus('🎤 Voice mode active - speak naturally!');
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'system',
          text: '🎤 Voice mode started - speak naturally!'
        }]);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'transcript':
              if (data.role === 'user') {
                setMessages(prev => [...prev, {
                  id: Date.now(),
                  sender: 'user',
                  text: data.text,
                  timestamp: new Date()
                }]);
              } else if (data.role === 'agent') {
                setMessages(prev => [...prev, {
                  id: Date.now(),
                  sender: 'bot',
                  text: data.text,
                  timestamp: new Date(),
                  agentUsed: 'LIVE_VOICE'
                }]);
              }
              break;

            case 'audio':
              // Play 24kHz PCM audio response from Gemini
              if (audioContextRef.current && audioQueueRef.current) {
                try {
                  const audioBuffer = base64ToAudioBuffer(data.audio, audioContextRef.current);
                  audioQueueRef.current.addToQueue(audioBuffer);
                } catch (audioError) {
                  console.error('Audio playback error:', audioError);
                }
              }
              break;

            case 'agent_communication':
              setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'agent-to-agent',
                text: data.text,
                timestamp: new Date()
              }]);
              break;

            case 'agent_result':
              console.log('Agent result:', data);
              break;

            case 'connected':
              console.log('Backend connected to Gemini Live API');
              break;

            case 'error':
              console.error('Voice mode error:', data.message);
              setAgentStatus(`❌ Error: ${data.message}`);
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setAgentStatus('❌ Voice mode error');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsVoiceMode(false);
        setAgentStatus(null);
      };

      // Setup microphone for live session (16kHz PCM for Gemini input)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000, // Browser capture rate
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // Use ScriptProcessor for real-time PCM conversion and streaming
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1); // 4096 sample buffer
      
      let audioBuffer = new Float32Array(0);
      const targetSampleRate = 16000; // Gemini expects 16kHz input
      const sourceSampleRate = ctx.sampleRate;
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Accumulate audio data
        const newBuffer = new Float32Array(audioBuffer.length + inputData.length);
        newBuffer.set(audioBuffer);
        newBuffer.set(inputData, audioBuffer.length);
        audioBuffer = newBuffer;
        
        // Send chunks when we have enough data (about 100ms worth)
        const chunkSize = Math.floor(targetSampleRate * 0.1); // 100ms at 16kHz
        
        while (audioBuffer.length >= chunkSize * (sourceSampleRate / targetSampleRate)) {
          // Extract chunk and downsample to 16kHz
          const sourceChunkSize = Math.floor(chunkSize * (sourceSampleRate / targetSampleRate));
          const sourceChunk = audioBuffer.slice(0, sourceChunkSize);
          audioBuffer = audioBuffer.slice(sourceChunkSize);
          
          // Downsample to 16kHz
          const downsampledChunk = new Float32Array(chunkSize);
          const ratio = sourceChunk.length / chunkSize;
          
          for (let i = 0; i < chunkSize; i++) {
            const sourceIndex = Math.floor(i * ratio);
            downsampledChunk[i] = sourceChunk[sourceIndex] || 0;
          }
          
          // Convert to 16-bit PCM and send
          const pcmData = floatTo16BitPCM(downsampledChunk);
          
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'audio',
              audio: pcmData
            }));
          }
        }
      };

      source.connect(processor);
      
      // Connect to destination with gain = 0 to prevent feedback
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      processor.connect(gainNode);
      gainNode.connect(ctx.destination);

    } catch (error) {
      console.error('Voice mode error:', error);
      setIsVoiceMode(false);
      setAgentStatus(null);
      
      let errorMessage = '❌ Voice mode failed: ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Microphone permission denied. Please allow microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone.';
      } else {
        errorMessage += error.message;
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'system',
        text: errorMessage
      }]);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <ChatInterface 
        messages={messages}
        onSendMessage={handleSendMessage}
        onToggleVoiceMode={handleToggleVoiceMode}
        onStartVoiceRecording={handleStartVoiceRecording}
        onStopVoiceRecording={handleStopVoiceRecording}
        onImageUpload={handleImageUpload}
        isTyping={isTyping}
        agentStatus={agentStatus}
        isVoiceMode={isVoiceMode}
        isVoiceRecording={isVoiceRecording}
        uploadedImage={uploadedImage}
      />
    </div>
  );
}