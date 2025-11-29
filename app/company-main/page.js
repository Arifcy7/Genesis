"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CompanyNavbar from '@/component/CompanyNavbar';
import ReactMarkdown from 'react-markdown';
import { Mic, Send, Bot, User, Loader2, MicOff, MessageSquare, X } from 'lucide-react';

export default function CompanyMainPage() {
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);
  const router = useRouter();

  const API_BASE_URL = 'http://localhost:8001';

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/company-auth/company', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        
        // Add welcome message
        setMessages([{
          id: 1,
          sender: 'bot',
          text: `Hello ${data.company.name}! 👋\n\nI'm your AI data assistant. I can help you:\n\n• Query your news database\n• Get statistics and insights\n• Find specific news items\n• Analyze trends\n\nWhat would you like to know about your data?`,
          timestamp: new Date()
        }]);
      } else {
        router.push('/company-login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/company-login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || isTyping || !company) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/data-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          userQuery: text
        })
      });

      if (!response.ok) throw new Error('Query failed');

      const result = await response.json();

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: result.response,
        timestamp: new Date(),
        metadata: result.data_summary
      }]);

    } catch (error) {
      console.error('Query error:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: `⚠️ Error: ${error.message}. Make sure the data service is running on ${API_BASE_URL}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleStartVoiceRecording = async () => {
    if (isVoiceRecording) return;

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
          setIsTyping(true);

          try {
            const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
              await handleSendMessage(transcribeData.text.trim());
            }

          } catch (error) {
            console.error('Transcription error:', error);
            setMessages(prev => [...prev, {
              id: Date.now(),
              sender: 'bot',
              text: '❌ Voice transcription failed. Please try again.',
              timestamp: new Date()
            }]);
          } finally {
            setIsTyping(false);
          }
        }

        recordedChunksRef.current = [];
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsVoiceRecording(true);

    } catch (error) {
      console.error('Voice recording error:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: `❌ Voice recording failed: ${error.message}`,
        timestamp: new Date()
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

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <CompanyNavbar />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-7xl font-bold mb-4">
              Welcome to <span className="text-purple-500">{company?.name}</span>
            </h1>
            <p className="text-gray-400 text-xl mb-8">
              Your trusted news verification platform.
            </p>
            
            {/* Chat Toggle Button */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105"
            >
              <MessageSquare size={24} />
              {isChatOpen ? 'Close Data Assistant' : 'Open Data Assistant'}
            </button>
          </div>

          {/* Chat Interface */}
          {isChatOpen && (
            <div className="max-w-4xl mx-auto bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Chat Header */}
              <div className="bg-[#1a1a1a] border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">AI Data Assistant</h2>
                    <p className="text-xs text-gray-400">Chat with your news database</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Messages */}
              <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-[#0a0a0a]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start gap-3 max-w-[80%] ${
                        msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          msg.sender === 'user'
                            ? 'bg-purple-600'
                            : 'bg-[#1a1a1a] border border-white/10'
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          <User size={16} className="text-white" />
                        ) : (
                          <Bot size={16} className="text-purple-400" />
                        )}
                      </div>

                      <div
                        className={`p-4 rounded-2xl ${
                          msg.sender === 'user'
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-[#1a1a1a] border border-white/10 text-gray-200 rounded-bl-none'
                        }`}
                      >
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>

                        {msg.metadata && (
                          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
                            <div className="flex flex-wrap gap-2">
                              <span>Query: {msg.metadata.query_type}</span>
                              <span>•</span>
                              <span>Company: {msg.metadata.company_name}</span>
                              {msg.metadata.data_points > 0 && (
                                <>
                                  <span>•</span>
                                  <span>📊 Total: {msg.metadata.data_points}</span>
                                  {msg.metadata.real_count !== undefined && (
                                    <>
                                      <span>•</span>
                                      <span className="text-green-400">✅ Real: {msg.metadata.real_count}</span>
                                    </>
                                  )}
                                  {msg.metadata.fake_count !== undefined && (
                                    <>
                                      <span>•</span>
                                      <span className="text-red-400">❌ Fake: {msg.metadata.fake_count}</span>
                                    </>
                                  )}
                                  {msg.metadata.uncertain_count !== undefined && (
                                    <>
                                      <span>•</span>
                                      <span className="text-yellow-400">⚠️ Uncertain: {msg.metadata.uncertain_count}</span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex items-center gap-3">
                      <Loader2 size={16} className="text-purple-500 animate-spin" />
                      <span className="text-sm text-gray-400">AI is thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-[#1a1a1a] border-t border-white/10 p-4">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                  {/* Voice Recording Button */}
                  <button
                    type="button"
                    onMouseDown={handleStartVoiceRecording}
                    onMouseUp={handleStopVoiceRecording}
                    onMouseLeave={handleStopVoiceRecording}
                    disabled={isTyping}
                    className={`p-3 rounded-xl transition-all ${
                      isVoiceRecording
                        ? 'bg-red-500/20 text-red-400 animate-pulse'
                        : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 hover:text-white'
                    } ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Hold to record voice message"
                  >
                    {isVoiceRecording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder-gray-600"
                    placeholder="Ask about your news data..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isTyping}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                    className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </form>

                {/* Quick Suggestions */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[
                    'Show latest news',
                    'How many fake news?',
                    'Top sources',
                    'Statistics summary'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInputText(suggestion);
                        handleSendMessage(suggestion);
                      }}
                      disabled={isTyping}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
