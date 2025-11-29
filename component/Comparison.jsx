"use client";
import React from 'react';
import { Check, X, BarChart3, Grip } from 'lucide-react';

export default function Comparison() {
  const negatives = [
    "Manual fact-checking takes hours",
    "No real-time verification",
    "Limited source coverage",
    "Prone to human bias & error",
    "No browser integration"
  ];

  const positives = [
    "Instant AI-powered verification",
    "Real-time misinformation detection",
    "Multi-source cross-referencing",
    "Unbiased algorithmic analysis",
    "Seamless Chrome extension"
  ];

  return (
    <section className="bg-[#050505] py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 xl:px-12 font-sans text-white">
      <div className="max-w-4xl mx-auto">

        {/* --- HEADER --- */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Badge */}
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 sm:gap-4 pl-1.5 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
              <span className="bg-[#6d28d9] text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-[0_0_10px_rgba(109,40,217,0.4)] flex items-center justify-center">
                <BarChart3 size={14} className="sm:hidden" />
                <BarChart3 size={16} className="hidden sm:block" />
              </span>
              <span className="text-lg sm:text-xl text-gray-300 font-medium">Comparison</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] font-semibold leading-[1.2] tracking-tight mb-4 sm:mb-6 text-white px-2 sm:px-0">
            Veritas vs. Traditional Methods<span className="text-white/30">—See the Difference</span>
          </h2>

          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
            Stop relying on manual fact-checking and outdated methods. Veritas brings AI-powered truth verification to your fingertips.
          </p>

          {/* Divider Dot */}
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mx-auto opacity-20"></div>
        </div>

        {/* --- COMPARISON CARD --- */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
           {/* Top Glow on the Right Side */}
           <div className="absolute top-0 right-0 w-1/2 h-px bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent opacity-50"></div>
           <div className="absolute top-0 right-0 w-1/2 h-16 sm:h-20 bg-[#7C3AED]/5 blur-3xl pointer-events-none"></div>

           <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* LEFT COLUMN (Negatives) */}
              <div className="p-6 sm:p-8 lg:p-12 border-b md:border-b-0 md:border-r border-white/5 bg-black/20">
                 <div className="space-y-4 sm:space-y-6">
                    {negatives.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 sm:gap-4 group opacity-60 hover:opacity-100 transition-opacity">
                         {/* Red 'X' Badge */}
                         <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0">
                             {/* The jagged seal shape simulated by a rounded square rotated */}
                             <div className="absolute inset-0 bg-red-600 rounded-sm sm:rounded-md rotate-45 scale-75"></div>
                             <div className="absolute inset-0 bg-red-600 rounded-sm sm:rounded-md -rotate-12 scale-75"></div>
                             <X size={10} className="relative z-10 text-white font-bold sm:hidden" strokeWidth={4} />
                             <X size={12} className="relative z-10 text-white font-bold hidden sm:block" strokeWidth={4} />
                         </div>
                         <span className="text-gray-400 font-medium text-sm sm:text-base leading-relaxed">{item}</span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* RIGHT COLUMN (Positives) */}
              <div className="p-6 sm:p-8 lg:p-12 bg-white/[0.02]">
                 <div className="space-y-4 sm:space-y-6">
                    {positives.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 sm:gap-4">
                         {/* Purple 'Check' Badge */}
                         <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0">
                             <div className="absolute inset-0 bg-[#7C3AED] rounded-sm sm:rounded-md rotate-45 scale-75 shadow-[0_0_10px_#7C3AED]"></div>
                             <div className="absolute inset-0 bg-[#7C3AED] rounded-sm sm:rounded-md -rotate-12 scale-75"></div>
                             <Check size={10} className="relative z-10 text-white font-bold sm:hidden" strokeWidth={4} />
                             <Check size={12} className="relative z-10 text-white font-bold hidden sm:block" strokeWidth={4} />
                         </div>
                         <span className="text-white font-semibold tracking-wide text-sm sm:text-base leading-relaxed">{item}</span>
                      </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>

      </div>
    </section>
  );
}