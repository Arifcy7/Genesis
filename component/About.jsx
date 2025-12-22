"use client";
import React from 'react';
import { Users, Zap, ShieldCheck, Mic, Apple, Music, ShoppingCart, Slack, Chrome, Github, Layers, Check, Clock, Eye, Layout, TrendingUp } from 'lucide-react';
import CircularGallery from './CircularGallery';

export default function About() {
  return (
    <>
      {/* --- ANIMATION STYLES --- */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px #7C3AED; transform: scale(1); }
          50% { box-shadow: 0 0 25px #7C3AED; transform: scale(1.05); }
        }
        @keyframes wave {
          0%, 100% { height: 20%; opacity: 0.5; }
          50% { height: 70%; opacity: 1; }
        }
        @keyframes flow {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-wave { animation: wave 1s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s infinite; }
        .animate-flow {
          stroke-dasharray: 10 190; /* 10px dash, 190px gap */
          animation: flow 2s linear infinite;
        }
      `}</style>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-2 pb-0 flex flex-col items-center text-center overflow-hidden bg-[#050505] px-4 sm:px-6 lg:px-8">

        {/* Badge */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 sm:gap-4 pl-1.5 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
            <span className="bg-[#6d28d9] text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-[0_0_10px_rgba(109,40,217,0.4)] flex items-center justify-center">
              <Users size={14} className="sm:hidden" />
              <Users size={16} className="hidden sm:block" />
            </span>
            <span className="text-lg sm:text-xl text-gray-300 font-medium">About Us</span>
          </div>
        </div>

        {/* Text */}
        <h1 className="max-w-4xl mx-auto text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] font-semibold leading-[1.2] tracking-tight mb-6 sm:mb-8 px-2 sm:px-4 text-white">
          Built on creativity, collaboration, and top excellence, Genesis is a dynamic team committed to <span className="text-white/30">exceptional results...</span>
        </h1>

        <button className="bg-gray-100 hover:bg-white text-black px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-medium transition-colors duration-200 mb-12 sm:mb-16 text-sm sm:text-base">
          Get Started
        </button>

        {/* Circular Gallery */}
        <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px]">
          <CircularGallery
            bend={3}
            textColor="#ffffff"
            borderRadius={0.05}
            scrollSpeed={2}
            scrollEase={0.05}
          />
        </div>

        {/* Bottom Text */}
        <div className="relative z-10 mt-12 sm:mt-16 mb-8 sm:mb-10 px-2 sm:px-4">
          <div className="inline-flex items-center gap-2 sm:gap-4 pl-1.5 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm mb-6 sm:mb-8">
            <span className="bg-[#6d28d9] text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-[0_0_10px_rgba(109,40,217,0.4)] flex items-center justify-center">
              <Zap size={14} fill="currentColor" className="sm:hidden" />
              <Zap size={16} fill="currentColor" className="hidden sm:block" />
            </span>
            <span className="text-lg sm:text-xl text-gray-300 font-medium">Features</span>
          </div>
          <h2 className="max-w-4xl mx-auto text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] font-semibold leading-[1.2] tracking-tight mb-4 sm:mb-6 text-white">
            Packed with Innovation.
          </h2>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-6 sm:mb-8 px-2 sm:px-4 leading-relaxed">
            Genesis is packed with cutting-edge features designed to <br className="hidden sm:block" /> elevate truth verification and misinformation detection.
          </p>
          <button className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-medium backdrop-blur-md transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] text-sm sm:text-base">
            View Documentation
          </button>
        </div>
      </section>


      {/* --- FEATURES GRID SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-16 sm:pb-20 lg:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* --- CARD 1: API INTEGRATIONS (FIXED) --- */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center h-[450px] sm:h-[500px] lg:h-[550px] group hover:border-[#7C3AED]/50 transition-colors duration-500">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.4)] mb-6 sm:mb-8">
              <Zap size={20} fill="white" className="text-white sm:hidden" />
              <Zap size={24} fill="white" className="text-white hidden sm:block" />
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-white leading-tight">Seamless API<br/>Integrations</h3>
            <p className="text-gray-400 text-sm sm:text-base mb-auto leading-relaxed">Nublen supports a wide range of third-party integrations.</p>

            {/* Visual: API Node Tree */}
            <div className="w-full h-40 sm:h-48 lg:h-56 bg-[#111] rounded-xl sm:rounded-2xl border border-white/5 relative flex flex-col justify-end p-3 sm:p-4 lg:p-6 overflow-hidden mt-6 sm:mt-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(124,58,237,0.15),transparent_70%)]"></div>
              
              {/* FIXED SVG: Using viewBox and proper Bezier curves */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                   {/* Define the path geometries */}
                   <path id="line1" d="M 40 40 C 40 120, 200 120, 200 180" />
                   <path id="line2" d="M 100 40 C 100 120, 200 120, 200 180" />
                   <path id="line3" d="M 160 40 C 160 120, 200 120, 200 180" />
                   <path id="line4" d="M 240 40 C 240 120, 200 120, 200 180" />
                   <path id="line5" d="M 300 40 C 300 120, 200 120, 200 180" />
                   <path id="line6" d="M 360 40 C 360 120, 200 120, 200 180" />
                </defs>

                {/* Layer 1: Solid Faint Lines (Always visible) */}
                <g className="stroke-white/20" strokeWidth="1.5" fill="none">
                  <use href="#line1" />
                  <use href="#line2" />
                  <use href="#line3" />
                  <use href="#line4" />
                  <use href="#line5" />
                  <use href="#line6" />
                </g>

                {/* Layer 2: Animated Flowing Dashes */}
                <g className="stroke-[#7C3AED]" strokeWidth="2" fill="none">
                  <use href="#line1" className="animate-flow" style={{ animationDelay: '0s' }} />
                  <use href="#line2" className="animate-flow" style={{ animationDelay: '0.5s' }} />
                  <use href="#line3" className="animate-flow" style={{ animationDelay: '1s' }} />
                  <use href="#line4" className="animate-flow" style={{ animationDelay: '1.2s' }} />
                  <use href="#line5" className="animate-flow" style={{ animationDelay: '0.8s' }} />
                  <use href="#line6" className="animate-flow" style={{ animationDelay: '0.3s' }} />
                </g>
              </svg>

              {/* Top Icons - Aligned to SVG paths */}
              <div className="absolute top-4 sm:top-6 lg:top-8 left-0 right-0 flex justify-between px-2 sm:px-4 lg:px-6 z-10">
                <Apple size={16} className="text-gray-400 hover:text-white transition-colors sm:hidden" />
                <Apple size={18} className="text-gray-400 hover:text-white transition-colors hidden sm:block lg:hidden" />
                <Apple size={20} className="text-gray-400 hover:text-white transition-colors hidden lg:block" />

                <Music size={16} className="text-gray-400 hover:text-white transition-colors sm:hidden" />
                <Music size={18} className="text-gray-400 hover:text-white transition-colors hidden sm:block lg:hidden" />
                <Music size={20} className="text-gray-400 hover:text-white transition-colors hidden lg:block" />

                <ShoppingCart size={16} className="text-gray-400 hover:text-white transition-colors sm:hidden" />
                <ShoppingCart size={18} className="text-gray-400 hover:text-white transition-colors hidden sm:block lg:hidden" />
                <ShoppingCart size={20} className="text-gray-400 hover:text-white transition-colors hidden lg:block" />

                <Slack size={16} className="text-gray-400 hover:text-white transition-colors sm:hidden" />
                <Slack size={18} className="text-gray-400 hover:text-white transition-colors hidden sm:block lg:hidden" />
                <Slack size={20} className="text-gray-400 hover:text-white transition-colors hidden lg:block" />

                <Chrome size={16} className="text-gray-400 hover:text-white transition-colors sm:hidden" />
                <Chrome size={18} className="text-gray-400 hover:text-white transition-colors hidden sm:block lg:hidden" />
                <Chrome size={20} className="text-gray-400 hover:text-white transition-colors hidden lg:block" />

                <Github size={16} className="text-gray-400 hover:text-white transition-colors sm:hidden" />
                <Github size={18} className="text-gray-400 hover:text-white transition-colors hidden sm:block lg:hidden" />
                <Github size={20} className="text-gray-400 hover:text-white transition-colors hidden lg:block" />
              </div>

              {/* Bottom Hub */}
              <div className="relative z-10 mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#111] border border-white/20 flex items-center justify-center shadow-[0_0_15px_#7C3AED] animate-pulse-glow">
                <Layers size={20} className="text-[#7C3AED] sm:hidden" />
                <Layers size={24} className="text-[#7C3AED] hidden sm:block" />
              </div>
            </div>
          </div>


          {/* --- CARD 2: AUTHENTICATION --- */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center h-[450px] sm:h-[500px] lg:h-[550px] group hover:border-[#7C3AED]/50 transition-colors duration-500">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.4)] mb-6 sm:mb-8">
              <ShieldCheck size={20} fill="white" className="text-white sm:hidden" />
              <ShieldCheck size={24} fill="white" className="text-white hidden sm:block" />
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-white leading-tight">Trusted<br/>Authentication</h3>
            <p className="text-gray-400 text-sm sm:text-base mb-auto leading-relaxed">Quickly integrate with major platforms to workflows.</p>

            {/* Visual: Tag Cloud & Check */}
            <div className="w-full h-40 sm:h-48 lg:h-56 bg-[#111] rounded-xl sm:rounded-2xl border border-white/5 relative flex items-center justify-center overflow-hidden mt-6 sm:mt-8">
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent z-10"></div>
              
              {/* Floating Tag Cloud */}
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center opacity-40 p-2 sm:p-3 lg:p-4 scale-75 sm:scale-90">
                {['Cognitive', 'Data Analysis', 'Chatbot', 'Intelligent', 'Infrastructure', 'Capabilities', 'Chatbots', 'Infrastructure', 'Intelligent', 'Data Analysis', 'Cognitive'].map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 rounded-full border border-white/20 bg-white/5 text-[10px] sm:text-xs text-gray-300 animate-float"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Pulsing Checkmark Badge */}
              <div className="absolute z-20 w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.6)] animate-pulse-glow">
                <div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 rounded-full bg-[#7C3AED] flex items-center justify-center">
                  <Check size={24} className="text-white sm:hidden" strokeWidth={3} />
                  <Check size={28} className="text-white hidden sm:block lg:hidden" strokeWidth={3} />
                  <Check size={32} className="text-white hidden lg:block" strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>


          {/* --- CARD 3: SPEECH RECOGNITION --- */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center h-[450px] sm:h-[500px] lg:h-[550px] group hover:border-[#7C3AED]/50 transition-colors duration-500">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.4)] mb-6 sm:mb-8">
              <Mic size={20} fill="white" className="text-white sm:hidden" />
              <Mic size={24} fill="white" className="text-white hidden sm:block" />
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-white leading-tight">AI-Speech<br/>Recognition</h3>
            <p className="text-gray-400 text-sm sm:text-base mb-auto leading-relaxed">Enable your user to control or navigate your site using speech.</p>

            {/* Visual: Voice UI */}
            <div className="w-full h-40 sm:h-48 lg:h-56 bg-[#111] rounded-xl sm:rounded-2xl border border-white/5 relative flex flex-col items-center justify-center gap-4 sm:gap-6 overflow-hidden mt-6 sm:mt-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(124,58,237,0.1),transparent_70%)]"></div>
              
              {/* Speech Bubble */}
              <div className="relative bg-[#7C3AED] text-white text-xs sm:text-sm font-bold px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-2.5 rounded-full rounded-bl-none shadow-lg animate-float">
                Speech Recognition
              </div>

              {/* Player UI */}
              <div className="relative w-[95%] sm:w-[90%] h-12 sm:h-14 lg:h-16 bg-[#0A0A0A] border border-white/10 rounded-full flex items-center px-3 sm:px-4 gap-2 sm:gap-3 lg:gap-4 shadow-2xl">
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-[#7C3AED] flex items-center justify-center shrink-0 shadow-[0_0_10px_#7C3AED] animate-pulse">
                  <Mic size={16} className="text-white sm:hidden" />
                  <Mic size={18} className="text-white hidden sm:block lg:hidden" />
                  <Mic size={20} className="text-white hidden lg:block" />
                </div>

                {/* Animated Waveform */}
                <div className="flex items-center gap-[2px] sm:gap-[3px] h-full flex-1 justify-center overflow-hidden">
                  {[0.9, 1.1, 0.85, 1.0, 1.15, 0.95, 1.05, 0.88, 1.12, 0.92, 1.08, 0.98, 1.02, 0.87, 1.13, 0.91, 1.09, 0.96, 1.04, 0.89].slice(0, 12).map((duration, i) => (
                    <div
                      key={i}
                      className="w-[2px] sm:w-[3px] bg-white rounded-full animate-wave"
                      style={{
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: `${duration}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- FOOTER STRIP SECTION --- */}
      <section className="w-full pt-4 py-16 sm:py-20 bg-black px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
          <div className="flex flex-col text-left group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Clock size={18} className="text-white group-hover:text-[#7C3AED] transition-colors sm:hidden" />
              <Clock size={20} className="text-white group-hover:text-[#7C3AED] transition-colors hidden sm:block lg:hidden" />
              <Clock size={22} className="text-white group-hover:text-[#7C3AED] transition-colors hidden lg:block" />
              <h4 className="font-bold text-lg sm:text-xl text-white">Real-Time Data</h4>
            </div>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">Instant insights for faster decision-making.</p>
          </div>
          <div className="flex flex-col text-left group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Eye size={18} className="text-white group-hover:text-[#7C3AED] transition-colors sm:hidden" />
              <Eye size={20} className="text-white group-hover:text-[#7C3AED] transition-colors hidden sm:block lg:hidden" />
              <Eye size={22} className="text-white group-hover:text-[#7C3AED] transition-colors hidden lg:block" />
              <h4 className="font-bold text-lg sm:text-xl text-white">Vision Capabilities</h4>
            </div>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">AI-powered image and video recognition.</p>
          </div>
          <div className="flex flex-col text-left group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Layout size={18} className="text-white group-hover:text-[#7C3AED] transition-colors sm:hidden" />
              <Layout size={20} className="text-white group-hover:text-[#7C3AED] transition-colors hidden sm:block lg:hidden" />
              <Layout size={22} className="text-white group-hover:text-[#7C3AED] transition-colors hidden lg:block" />
              <h4 className="font-bold text-lg sm:text-xl text-white">Optimized UX/UI</h4>
            </div>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">Smart design that enhances user experience.</p>
          </div>
          <div className="flex flex-col text-left group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <TrendingUp size={18} className="text-white group-hover:text-[#7C3AED] transition-colors sm:hidden" />
              <TrendingUp size={20} className="text-white group-hover:text-[#7C3AED] transition-colors hidden sm:block lg:hidden" />
              <TrendingUp size={22} className="text-white group-hover:text-[#7C3AED] transition-colors hidden lg:block" />
              <h4 className="font-bold text-lg sm:text-xl text-white">Predictive Analytics</h4>
            </div>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">Make data-driven decisions with AI insights.</p>
          </div>
        </div>
      </section>
    </>
  );
}