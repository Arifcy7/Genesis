import React from 'react';
import { Check, Rocket, Siren, FileText, Zap } from 'lucide-react';

export default function Pricing() {

  const plans = [
    {
      name: "Free",
      price: "0",
      icon: <Rocket size={20} className="text-white" />,
      badge: "Get Started",
      desc: "Perfect for individuals trying out Veritas.",
      limits: ["10 Checks/Day", "Basic Analysis"],
      features: [
        "Real-time fact checking",
        "Chrome extension access",
        "Basic misinformation detection",
        "Community support",
        "Daily usage limits"
      ]
    },
    {
      name: "Pro",
      price: "29",
      icon: <Siren size={20} className="text-white" />,
      badge: "Most Popular",
      desc: "Ideal for professionals and content creators.",
      limits: ["Unlimited Checks", "Advanced AI"],
      features: [
        "Unlimited fact checking",
        "Advanced AI analysis",
        "Priority processing",
        "Detailed reports & insights",
        "Email & chat support",
        "Custom alerts"
      ]
    },
    {
      name: "Enterprise",
      price: "Custom",
      icon: <FileText size={20} className="text-white" />,
      badge: "For Teams",
      desc: "Advanced solutions for organizations and newsrooms.",
      limits: ["Team Access", "API Integration"],
      features: [
        "Everything in Pro",
        "Team collaboration tools",
        "API access",
        "Custom AI training",
        "Dedicated account manager",
        "SLA guarantee"
      ]
    }
  ];

  return (
    <section className="bg-[#050505] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 xl:px-12 font-sans text-white">

      {/* CSS for the dot pattern background on cards */}
      <style>{`
        .bg-dot-pattern {
          background-image: radial-gradient(#ffffff 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.1;
        }
      `}</style>

      {/* --- HEADER (Centered) --- */}
      <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
        {/* Badge */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 sm:gap-4 pl-1.5 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
            <span className="bg-[#6d28d9] text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-[0_0_10px_rgba(109,40,217,0.4)] flex items-center justify-center">
              <Zap size={14} fill="white" className="sm:hidden" />
              <Zap size={16} fill="white" className="hidden sm:block" />
            </span>
            <span className="text-lg sm:text-xl text-gray-300 font-medium">Pricing</span>
          </div>
        </div>

        <h2 className="max-w-4xl mx-auto text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] font-semibold leading-[1.2] tracking-tight mb-4 sm:mb-6 text-white px-2 sm:px-4">
          Choose Your Truth Verification Plan—<span className="text-white/30">From Free to Enterprise Solutions.</span>
        </h2>
        <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
          Start fighting misinformation today with flexible plans designed for individuals, creators, and organizations of all sizes.
        </p>
      </div>

      {/* --- CARDS GRID --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {plans.map((plan, i) => (
          <div key={i} className="relative group rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 sm:p-8 overflow-hidden hover:border-[#7C3AED]/40 transition-all duration-300">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full">

              {/* Icon & Badge Row */}
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#7C3AED] flex items-center justify-center shadow-lg shadow-purple-900/20">
                  {React.cloneElement(plan.icon, {
                    size: 18,
                    className: "sm:hidden"
                  })}
                  {React.cloneElement(plan.icon, {
                    size: 20,
                    className: "hidden sm:block"
                  })}
                </div>
                <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-white/10 bg-white/5 text-[10px] sm:text-xs text-gray-300 font-medium">
                  {plan.badge}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold mb-2">{plan.name}</h3>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-3 sm:mb-4">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold">${plan.price}</span>
                <span className="text-gray-500 text-xs sm:text-sm font-medium">/ Month</span>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 min-h-[2.5rem] sm:min-h-[2.5rem]">
                {plan.desc}
              </p>

              {/* Limit Pills */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                {plan.limits.map((limit, idx) => (
                  <div key={idx} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-[#151515] border border-white/5 text-[10px] sm:text-xs font-semibold text-white">
                    {limit}
                  </div>
                ))}
              </div>

              {/* Divider Line */}
              <div className="w-full h-px bg-white/5 mb-6 sm:mb-8"></div>

              {/* Features List */}
              <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={10} className="text-white sm:hidden" strokeWidth={3} />
                      <Check size={12} className="text-white hidden sm:block" strokeWidth={3} />
                    </div>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button className="w-full py-3 sm:py-4 rounded-lg sm:rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold transition-colors shadow-lg shadow-purple-900/20 text-sm sm:text-base">
                Get Started
              </button>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
}