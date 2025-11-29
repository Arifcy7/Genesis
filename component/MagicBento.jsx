"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { 
  LayoutDashboard, 
  Users, 
  Zap, 
  Link2, 
  ShieldCheck, 
  BarChart3, 
  Box,
  Clock
} from 'lucide-react';

// --- Constants ---
const DEFAULT_SPOTLIGHT_RADIUS = 300;
// Converted #7C3AED to RGB for the spotlight function
const GLOW_COLOR_RGB = '124, 58, 237'; 

const cardData = [
  {
    icon: <BarChart3 size={24} />,
    title: 'Analytics',
    description: 'Track user behavior with precision. Get real-time insights into your data streams.',
    label: 'Insights',
    colSpan: "md:col-span-2" // Special sizing for bento effect
  },
  {
    icon: <LayoutDashboard size={24} />,
    title: 'Dashboard',
    description: 'Centralized view for all your metrics.',
    label: 'Overview',
    colSpan: "md:col-span-1"
  },
  {
    icon: <Users size={24} />,
    title: 'Collaboration',
    description: 'Work together seamlessly with your team in real-time.',
    label: 'Teamwork',
    colSpan: "md:col-span-1"
  },
  {
    icon: <Zap size={24} />,
    title: 'Automation',
    description: 'Streamline workflows and save valuable time.',
    label: 'Efficiency',
    colSpan: "md:col-span-1"
  },
  {
    icon: <Link2 size={24} />,
    title: 'Integration',
    description: 'Connect your favorite tools instantly via our API.',
    label: 'Connectivity',
    colSpan: "md:col-span-1"
  },
  {
    icon: <Clock size={24} />,
    title: 'Real-Time Updates',
    description: 'Stay synchronized with instant notifications.',
    label: 'Live',
    colSpan: "md:col-span-1"
  },
  {
    icon: <ShieldCheck size={24} />,
    title: 'Security',
    description: 'Enterprise-grade protection for your most sensitive data assets.',
    label: 'Protection',
    colSpan: "md:col-span-2 md:col-start-2"
  }

];

// --- Helper Functions for Spotlight ---
const calculateSpotlightValues = (radius) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

// --- Components ---

const GlobalSpotlight = ({ gridRef, enabled = true, spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS }) => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    if (!gridRef?.current || !enabled) return;

    const spotlight = document.createElement('div');
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${GLOW_COLOR_RGB}, 0.15) 0%,
        rgba(${GLOW_COLOR_RGB}, 0.08) 15%,
        rgba(${GLOW_COLOR_RGB}, 0.04) 25%,
        rgba(${GLOW_COLOR_RGB}, 0.02) 40%,
        transparent 70%
      );
      z-index: 50;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e) => {
      if (!spotlightRef.current || !gridRef.current) return;

      const rect = gridRef.current.getBoundingClientRect();
      const mouseInside =
        e.clientX >= rect.left && e.clientX <= rect.right && 
        e.clientY >= rect.top && e.clientY <= rect.bottom;

      const cards = gridRef.current.querySelectorAll('.magic-card');

      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3 });
        cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);

      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        opacity: 0.8,
        duration: 0.1,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
        if(spotlightRef.current) gsap.to(spotlightRef.current, { opacity: 0 });
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.remove();
    };
  }, [gridRef, enabled, spotlightRadius]);

  return null;
};

const MagicCard = ({ item, className }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Tilt Effect
      const rotateX = ((y - centerY) / centerY) * -5; // Subtle tilt
      const rotateY = ((x - centerX) / centerX) * 5;

      gsap.to(el, {
        rotateX,
        rotateY,
        duration: 0.1,
        ease: 'power2.out',
        transformPerspective: 1000
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`magic-card relative group rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 sm:p-8 overflow-hidden hover:border-[#7C3AED]/40 transition-colors duration-300 ${className}`}
      style={{
        '--glow-x': '50%',
        '--glow-y': '50%',
        '--glow-intensity': '0',
        '--glow-radius': '300px',
      }}
    >
      {/* Background Dot Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />

      {/* Border Glow Effect (CSS generated) */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-screen"
           style={{
             background: `radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
             rgba(${GLOW_COLOR_RGB}, calc(var(--glow-intensity) * 0.3)) 0%,
             transparent 60%)`
           }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
            <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-300 shadow-lg">
                    {React.cloneElement(item.icon, {
                      size: 20,
                      className: "sm:hidden"
                    })}
                    {React.cloneElement(item.icon, {
                      size: 24,
                      className: "hidden sm:block"
                    })}
                </div>
                <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-white/10 bg-white/5 text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    {item.label}
                </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-[#7C3AED] transition-colors leading-tight">{item.title}</h3>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{item.description}</p>
        </div>
      </div>
    </div>
  );
};

export default function MagicBento() {
  const gridRef = useRef(null);

  return (
    <section className="bg-[#050505] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 xl:px-12 font-sans text-white">

      {/* Global CSS for dot pattern */}
      <style jsx global>{`
        .bg-dot-pattern {
          background-image: radial-gradient(#ffffff 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>

      {/* Spotlight Controller */}
      <GlobalSpotlight gridRef={gridRef} />

      <div className="max-w-7xl mx-auto">

        {/* --- HEADER --- */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 sm:gap-4 pl-1.5 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
              <span className="bg-[#6d28d9] text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-[0_0_10px_rgba(109,40,217,0.4)] flex items-center justify-center">
                <Zap size={14} className="sm:hidden" />
                <Zap size={16} className="hidden sm:block" />
              </span>
              <span className="text-lg sm:text-xl text-gray-300 font-medium">Core Capabilities</span>
            </div>
          </div>

          <h2 className="max-w-4xl mx-auto text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] font-semibold leading-[1.2] tracking-tight mb-4 sm:mb-6 text-white px-2 sm:px-4">
            Everything You Need <span className="text-white/30">To Build Faster & Better</span>
          </h2>

          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed px-2 sm:px-4 mb-6 sm:mb-8">
            Our platform provides a comprehensive suite of tools designed to elevate your workflow and secure your data.
          </p>
        </div>

        {/* --- BENTO GRID --- */}
        <div
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-[minmax(240px,auto)] sm:auto-rows-[minmax(280px,auto)]"
        >
          {cardData.map((item, index) => (
            <MagicCard 
                key={index} 
                item={item} 
                className={item.colSpan || "md:col-span-1"}
            />
          ))}
        </div>

      </div>
    </section>
  );
}