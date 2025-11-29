"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Zap, ShieldCheck, Trophy, Brain, Users, Globe, Clock, Layers } from 'lucide-react';
import ColorBends from './ColorBends';
import Testimonials from "./Testimonial"; // Assuming this path exists based on your snippet

export default function AboutUs() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Background images for carousel
  const backgroundImages = [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
  ];

  // Auto-change background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-[#7C3AED]/30">
      
      {/* Global CSS for Dot Pattern */}
      <style jsx global>{`
        .bg-dot-pattern {
          background-image: radial-gradient(#ffffff 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>

      {/* --- HERO SECTION --- */}
      <section className="relative h-[500px] lg:h-[600px] overflow-hidden flex items-center justify-center">
        {/* ColorBends Animated Background - Same as Hero.jsx */}
        <div className="absolute inset-0 z-0">
          <ColorBends
            colors={["#ff0066", "#9900ff", "#00ffee", "#ff3399"]}
            rotation={30}
            speed={0.15}
            scale={0.9}
            frequency={1.0}
            warpStrength={0.6}
            mouseInfluence={0.3}
            parallax={0.3}
            noise={0.005}
            transparent={false}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-[#050505]/20"></div>
        </div>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 animate-fade-in-up">
             <span className="bg-[#6d28d9] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(109,40,217,0.4)]">
               About Veritas
             </span>
             <span className="text-sm text-gray-300 font-medium">Truth Through Technology</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Multi-Agent <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-500">AI System</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Advanced fact-checking ecosystem with specialized AI agents for transcription, verification, image analysis, and real-time misinformation monitoring.
          </p>
        </div>
      </section>

      {/* --- MAIN CONTENT SECTION --- */}
      <section className="py-20 px-6 lg:px-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-stretch">
            
            {/* Image Side with Glow */}
            <div className="order-2 lg:order-1 relative group min-h-[600px]">
               <div className="absolute -inset-4 bg-[#7C3AED]/20 blur-3xl rounded-[3rem] -z-10 group-hover:bg-[#7C3AED]/30 transition-all duration-500" />
               <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl h-full min-h-[600px]">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60" />
                  <img
                    src="https://cdn.pixabay.com/photo/2024/04/09/16/30/ai-generated-8686301_1280.jpg"
                    alt="Veritas AI Technology"
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Floating Badge */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#6d28d9] flex items-center justify-center text-white">
                          <Brain size={20} />
                      </div>
                      <div>
                          <div className="text-white font-bold">AI-Powered</div>
                          <div className="text-xs text-gray-400">Truth Verification Technology</div>
                      </div>
                  </div>
               </div>
            </div>

            {/* Text Content */}
            <div className="order-1 lg:order-2 flex flex-col justify-center space-y-8 min-h-[600px]">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
                  Multi-Agent <span className="text-[#6d28d9]">AI Ecosystem</span> for Truth Verification
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                  Veritas operates a sophisticated network of specialized AI agents that work together to combat misinformation. Our system includes dedicated agents for audio transcription, main orchestration, fact-checking, image analysis, and crisis trend monitoring.
                </p>
                <p className="text-gray-400 text-lg leading-relaxed">
                  With advanced integration of Google's Gemini AI, real-time voice processing, WebSocket connectivity, and comprehensive source verification, we deliver instant, accurate fact-checking through multiple interfaces including web application and voice interaction.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                 {[
                    { label: "AI Agents", value: "5+" },
                    { label: "Voice Processing", value: "Real-time" },
                    { label: "Image Analysis", value: "24/7" },
                    { label: "Source Verification", value: "Multi-DB" }
                 ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 flex flex-col items-center justify-center text-center hover:border-[#6d28d9]/30 transition-colors">
                        <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                    </div>
                 ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/contact">
                  <button className="w-full sm:w-auto px-8 py-3.5 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(109,40,217,0.3)] hover:shadow-[0_0_30px_rgba(109,40,217,0.5)]">
                    Get Started
                  </button>
                </Link>
                <Link href="/services">
                  <button className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-all">
                    View Services
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- METHODOLOGY SECTION --- */}
      <section className="py-24 px-6 lg:px-12 relative overflow-hidden bg-[#0A0A0A] border-y border-white/5">
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             
             {/* Left Content */}
             <div className="space-y-10">
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  Our <span className="text-[#6d28d9]">AI Agent Architecture</span><br/>& Processing Pipeline
                </h2>
                
                <div className="space-y-8">
                   {[
                      { num: "01", title: "Audio Transcription Agent", desc: "Advanced speech-to-text processing using Gemini AI for accurate transcription of audio content with support for multiple audio formats and real-time processing." },
                      { num: "02", title: "Main Orchestrator Agent", desc: "Intelligent routing system that analyzes user queries and delegates to specialized agents. Handles DIRECT_REPLY, DELEGATE_TO_CHECKER, SCAN_CRISIS, and PROCESS_IMAGE actions." },
                      { num: "03", title: "Fact-Checking Agent", desc: "Comprehensive verification using Google Search tools, confidence scoring (0.0-1.0), verdict classification (REAL/FAKE/UNCERTAIN), and multi-source validation." },
                      { num: "04", title: "Image Analysis Agent", desc: "Extract and verify claims from visual content including news headlines, social media posts, and any text-based information within images for fact-checking." },
                      { num: "05", title: "Crisis Monitoring Agent", desc: "Real-time scanning for emerging misinformation trends, viral claims monitoring, and proactive identification of potential fake news spreading across platforms." }
                   ].map((step, i) => (
                      <div key={i} className="flex gap-6 group">
                         <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-[#6d28d9] font-bold text-lg group-hover:bg-[#6d28d9] group-hover:text-white transition-all duration-300 shadow-lg">
                               {step.num}
                            </div>
                         </div>
                         <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#6d28d9] transition-colors">{step.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Right Image */}
             <div className="relative h-full min-h-[400px] rounded-2xl overflow-hidden border border-white/10 group">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Methodology"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 animate-pulse">
                      <Layers size={32} className="text-white" />
                   </div>
                </div>
             </div>

          </div>
        </div>
      </section>

      {/* --- WHY CHOOSE US --- */}
      <section className="py-24 px-6 lg:px-12 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Why Choose <span className="text-[#6d28d9]">Veritas</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Advanced multi-agent AI system with specialized capabilities for comprehensive fact-checking and misinformation detection.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Brain />, title: "Multi-Agent System", desc: "Specialized AI agents working in harmony - transcription, orchestration, fact-checking, image analysis, and crisis monitoring for comprehensive verification." },
              { icon: <ShieldCheck />, title: "Real-time Voice Processing", desc: "Live WebSocket connectivity with Gemini AI for instant voice transcription and conversational fact-checking with native audio processing." },
              { icon: <Clock />, title: "Instant Verification", desc: "Lightning-fast claim verification with Google Search integration, confidence scoring, and verdict classification delivered in real-time." },
              { icon: <CheckCircle2 />, title: "Image Content Analysis", desc: "Advanced visual content processing to extract and verify claims from images, social media posts, and news headlines automatically." },
              { icon: <Globe />, title: "Crisis Trend Monitoring", desc: "Proactive scanning for emerging misinformation patterns, viral claims tracking, and trend analysis across digital platforms." },
              { icon: <Trophy />, title: "Source Verification", desc: "Multi-database cross-referencing with grounding chunks, source attribution, and transparent result explanations with confidence levels." }
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 hover:border-[#6d28d9]/40 transition-all duration-300 hover:-translate-y-1">
                 <div className="w-12 h-12 rounded-xl bg-[#6d28d9]/10 flex items-center justify-center text-[#6d28d9] mb-6 group-hover:bg-[#6d28d9] group-hover:text-white transition-all shadow-lg">
                    {React.cloneElement(item.icon, { size: 24 })}
                 </div>
                 <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#6d28d9] transition-colors">{item.title}</h3>
                 <p className="text-gray-400 text-sm leading-relaxed">
                    {item.desc}
                 </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TECHNICAL CAPABILITIES --- */}
      <section className="py-24 px-6 lg:px-12 relative bg-[#0A0A0A] border-y border-white/5">
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Technical <span className="text-[#6d28d9]">Architecture</span>
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              Built on cutting-edge technologies with FastAPI backend, Google Gemini AI integration, and real-time processing capabilities.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Backend Technologies */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">Backend Infrastructure</h3>
              <div className="space-y-4">
                {[
                  { title: "FastAPI Framework", desc: "High-performance Python API with async/await support for concurrent processing" },
                  { title: "Google Gemini AI", desc: "Advanced AI models including Gemini-2.5-Flash for text and native audio processing" },
                  { title: "WebSocket Integration", desc: "Real-time bidirectional communication for live voice processing and instant responses" },
                  { title: "Multi-Agent Orchestration", desc: "Sophisticated agent routing with specialized functions for different verification tasks" }
                ].map((tech, i) => (
                  <div key={i} className="p-4 bg-[#1A1A1A] rounded-lg border border-white/10">
                    <h4 className="text-white font-semibold mb-2">{tech.title}</h4>
                    <p className="text-gray-400 text-sm">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Frontend Technologies */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">Frontend Experience</h3>
              <div className="space-y-4">
                {[
                  { title: "Next.js 16 Framework", desc: "Modern React framework with server-side rendering and optimal performance" },
                  { title: "Real-time UI Updates", desc: "Live transcript display, agent communication visualization, and instant result rendering" },
                  { title: "Voice Interface", desc: "Seamless audio recording, PCM processing, and conversational AI interaction" },
                  { title: "Responsive Design", desc: "Mobile-first approach with adaptive layouts and cross-platform compatibility" }
                ].map((tech, i) => (
                  <div key={i} className="p-4 bg-[#1A1A1A] rounded-lg border border-white/10">
                    <h4 className="text-white font-semibold mb-2">{tech.title}</h4>
                    <p className="text-gray-400 text-sm">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Processing Pipeline Visualization */}
          <div className="mt-16 p-8 bg-[#1A1A1A] rounded-2xl border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Data Processing Pipeline</h3>
            <div className="flex flex-wrap justify-center items-center gap-4">
              {[
                "Audio/Text Input",
                "→",
                "Main Orchestrator",
                "→",
                "Specialized Agents", 
                "→",
                "Google Search",
                "→",
                "Synthesis",
                "→",
                "Verified Output"
              ].map((step, i) => (
                <div key={i} className={`${step === '→' ? 'text-[#6d28d9] text-2xl' : 'px-4 py-2 bg-[#6d28d9]/10 rounded-lg border border-[#6d28d9]/30'} text-sm text-white font-medium`}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="relative z-10 border-t border-white/5 bg-[#050505]">
        <Testimonials />
      </section>

    </div>
  );
}