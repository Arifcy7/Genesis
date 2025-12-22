"use client";
import React from 'react';
import { Play, Star, ShieldCheck, Quote } from 'lucide-react';

// --- Reusable Components ---

const VideoCard = ({ image, logo, company, tagColor, className = "" }) => (
  <div className={`relative group rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer min-h-[250px] sm:min-h-[300px] border border-white/10 hover:border-[#7C3AED]/40 transition-all duration-500 ${className}`}>
    {/* Dot Pattern Overlay */}
    <div className="absolute inset-0 bg-dot-pattern opacity-[0.05] pointer-events-none z-10" />

    <img src={image} alt={company} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />

    {/* Dark Overlay */}
    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />

    {/* Play Button */}
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-[#7C3AED]/20 group-hover:border-[#7C3AED]/50 transition-all shadow-2xl">
        <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white ml-0.5 sm:ml-1" />
      </div>
    </div>

    {/* Bottom Label */}
    <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-5 z-20 bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-full pl-1 sm:pl-1.5 pr-3 sm:pr-4 py-1 sm:py-1.5 flex items-center gap-2 sm:gap-3 shadow-lg">
      {logo && (
        <div className={`w-6 h-6 sm:w-8 sm:h-8 ${tagColor} rounded-full flex items-center justify-center text-xs text-white font-bold shadow-inner`}>
          {logo}
        </div>
      )}
      <span className="text-white text-xs sm:text-sm font-medium tracking-wide">{company}</span>
    </div>
  </div>
);

const ReviewCard = ({ avatar, name, role, text, stars, logo }) => (
  <div className="relative group bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl hover:border-[#7C3AED]/40 transition-all duration-300 h-fit overflow-hidden">
    {/* Dot Pattern Background */}
    <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />

    <div className="relative z-10">
        <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
            {avatar && <img src={avatar} alt={name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-white/10" />}
            {logo && (
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1A1A1A] border border-white/5 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-inner">
                    <span className="bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">{logo}</span>
                </div>
            )}
            <div className="min-w-0 flex-1">
            {name && <h4 className="font-bold text-white text-xs sm:text-sm tracking-wide truncate">{name}</h4>}
            {role && <p className="text-gray-500 text-[10px] sm:text-xs font-medium">{role}</p>}
            </div>
        </div>
        {stars && (
            <div className="flex gap-0.5 sm:gap-1 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-white/5 shrink-0">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#7C3AED] fill-[#7C3AED]" />
            ))}
            </div>
        )}
        </div>
        <p className="text-gray-400 text-xs sm:text-sm leading-6 sm:leading-7 font-medium">
        "{text}"
        </p>
    </div>
  </div>
);

const QuoteCard = () => (
  <div className="relative bg-[#7C3AED] p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_0_40px_rgba(124,58,237,0.15)] flex flex-col items-center justify-center text-center overflow-hidden min-h-[280px] sm:min-h-[320px] group">
    {/* Dot Pattern Background (Lighter here) */}
    <div className="absolute inset-0 bg-dot-pattern opacity-[0.1] pointer-events-none" />

    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

    <div className="relative z-10">
        <div className="mb-4 sm:mb-6 opacity-30 transform group-hover:scale-110 transition-transform duration-500">
             <Quote size={36} className="text-white fill-white sm:hidden" />
             <Quote size={48} className="text-white fill-white hidden sm:block" />
        </div>
        <p className="text-white text-lg sm:text-xl font-medium leading-relaxed italic tracking-wide">
        "Genesis has completely transformed how we verify information. The real-time fact-checking is an essential tool for modern journalism."
        </p>
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20 w-full flex justify-center">
            <span className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-wider">Editor-in-Chief, Global News</span>
        </div>
    </div>
  </div>
);

// --- Main Component ---

const TestimonialSection = () => {
  return (
    <section className="bg-[#050505] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 xl:px-12 font-sans text-white overflow-hidden">

      {/* CSS for the dot pattern */}
      <style jsx global>{`
        .bg-dot-pattern {
          background-image: radial-gradient(#ffffff 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 sm:gap-4 pl-1.5 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
              <span className="bg-[#6d28d9] text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-[0_0_10px_rgba(109,40,217,0.4)] flex items-center justify-center">
                <ShieldCheck size={14} className="sm:hidden" />
                <ShieldCheck size={16} className="hidden sm:block" />
              </span>
              <span className="text-lg sm:text-xl text-gray-300 font-medium">Testimonials</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] font-semibold leading-[1.2] tracking-tight mb-4 sm:mb-6 text-white px-2 sm:px-0">
            1,000+ Users Trust Genesis<br/>
            <span className="text-white/30">Join the Fight Against Misinformation</span>
          </h2>

          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2 sm:px-0">
            See how journalists, researchers, and everyday users leverage Genesis to verify truth in real-time.
          </p>

        </div>

        {/* Masonry Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Column 1 */}
          <div className="space-y-4 sm:space-y-6 flex flex-col">
            <VideoCard 
              image="https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              company="NewsHub Daily"
              logo="N"
              tagColor="bg-[#7C3AED]"
            />
            
            <ReviewCard 
              logo="V"
              stars={true}
              text="As a journalist, Genesis is my secret weapon. The Chrome extension works seamlessly while I browse, instantly flagging suspicious claims."
            />

            <ReviewCard 
              avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
              name="David Martinez"
              role="Senior Editor"
              text="The AI-powered analysis is incredibly accurate. Genesis cross-references multiple sources instantly, something that would take our team hours to do manually."
            />
          </div>

          {/* Column 2 */}
          <div className="space-y-4 sm:space-y-6 flex flex-col">
            <ReviewCard 
              avatar="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
              name="Sarah Chen"
              role="Research Analyst"
              text="Genesis has become essential for my research work. The detailed reports with source citations make it easy to verify claims."
            />

            <QuoteCard />

            <VideoCard 
              image="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              company="Global Media"
              logo="G"
              tagColor="bg-orange-500"
              className="flex-1" 
            />
          </div>

          {/* Column 3 */}
          <div className="space-y-4 sm:space-y-6 flex flex-col">
            <ReviewCard 
              logo="T"
              stars={true}
              text="What impressed me most is the real-time detection. During election coverage, Genesis helped us fact-check statements live. The speed is unmatched."
            />

            <VideoCard 
              image="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              company="Academic Research"
              logo="A"
              tagColor="bg-green-600"
            />

            <ReviewCard 
              avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
              name="Michael Thompson"
              role="Content Creator"
              text="As someone who creates educational content, Genesis gives me confidence that I'm sharing accurate information. A game-changer."
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;