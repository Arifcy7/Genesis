"use client";
import React from 'react';
import { Twitter, Github, Linkedin, Instagram, ArrowRight, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-16 sm:pt-20 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 xl:px-12 font-sans text-white relative overflow-hidden">
      
       {/* CSS for Dot Pattern */}
       <style>{`
        .bg-dot-pattern {
          background-image: radial-gradient(#ffffff 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
      
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[200px] sm:h-[300px] bg-[#7C3AED]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* --- TOP CTA SECTION --- */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 relative overflow-hidden mb-16 sm:mb-20 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
           <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />
           <div className="absolute right-0 top-0 w-48 h-48 sm:w-64 sm:h-64 bg-[#7C3AED]/10 blur-[80px] rounded-full pointer-events-none" />

           <div className="relative z-10 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight">Ready to verify the truth?</h2>
              <p className="text-gray-400 text-sm sm:text-base">Join thousands of users using Genesis today.</p>
           </div>

           <div className="relative z-10 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full md:w-auto">
              <button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-bold transition-all shadow-lg hover:shadow-[#7C3AED]/25 hover:-translate-y-1 text-sm sm:text-base">
                 Get Started Now
              </button>
              <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-bold transition-all text-sm sm:text-base">
                 Contact Sales
              </button>
           </div>
        </div>

        {/* --- MAIN FOOTER LINKS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 mb-12 sm:mb-16">

           {/* Brand Column */}
           <div className="sm:col-span-2 lg:col-span-4 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center">
                    <Zap size={16} className="text-white fill-white sm:hidden" />
                    <Zap size={18} className="text-white fill-white hidden sm:block" />
                  </div>
                  Genesis
              </div>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-xs">
                 The world's leading AI-powered verification platform. We help you separate fact from fiction in real-time.
              </p>
              <div className="flex gap-3 sm:gap-4">
                 <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#7C3AED] hover:bg-[#7C3AED] transition-all duration-300">
                    <Twitter size={14} className="sm:hidden" />
                    <Twitter size={18} className="hidden sm:block" />
                 </a>
                 <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#7C3AED] hover:bg-[#7C3AED] transition-all duration-300">
                    <Github size={14} className="sm:hidden" />
                    <Github size={18} className="hidden sm:block" />
                 </a>
                 <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#7C3AED] hover:bg-[#7C3AED] transition-all duration-300">
                    <Linkedin size={14} className="sm:hidden" />
                    <Linkedin size={18} className="hidden sm:block" />
                 </a>
                 <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#7C3AED] hover:bg-[#7C3AED] transition-all duration-300">
                    <Instagram size={14} className="sm:hidden" />
                    <Instagram size={18} className="hidden sm:block" />
                 </a>
              </div>
           </div>

           {/* Links Column 1 */}
           <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <h4 className="text-white font-bold text-sm sm:text-base">Product</h4>
              <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-400">
                 <li><a href="#" className="hover:text-[#7C3AED] transition-colors">Features</a></li>
                 <li><a href="#" className="hover:text-[#7C3AED] transition-colors">Integrations</a></li>
                 <li><a href="#" className="hover:text-[#7C3AED] transition-colors">Pricing</a></li>
                 <li><a href="#" className="hover:text-[#7C3AED] transition-colors">Changelog</a></li>
                 <li><a href="#" className="hover:text-[#7C3AED] transition-colors">Docs</a></li>
              </ul>
           </div>

           {/* Links Column 2 */}
           <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <h4 className="text-white font-bold text-sm sm:text-base">Company</h4>
              <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-400">
                 <li><a href="#" className="hover:text-[#7C3AED] transition-colors">About Us</a></li>
                 <li><a href="#" className="hover:text-[#7C3AED] transition-colors">Careers</a></li>
                 <li><a href="#" className="hover:text-[#7C3AED] transition-colors">Blog</a></li>
                 <li><a href="#" className="hover:text-[#7C3AED] transition-colors">Contact</a></li>
                 <li><a href="#" className="hover:text-[#7C3AED] transition-colors">Partners</a></li>
              </ul>
           </div>

           {/* Newsletter Column */}
           <div className="sm:col-span-2 lg:col-span-4 space-y-4 sm:space-y-6">
              <h4 className="text-white font-bold text-sm sm:text-base">Stay Updated</h4>
              <p className="text-gray-400 text-xs sm:text-sm">Subscribe to our newsletter for the latest AI updates.</p>
              <form className="relative">
                 <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg sm:rounded-xl pl-3 sm:pl-4 pr-10 sm:pr-12 py-2.5 sm:py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#7C3AED] transition-colors"
                 />
                 <button className="absolute right-1 sm:right-1.5 top-1 sm:top-1.5 p-1.5 bg-[#7C3AED] rounded-md sm:rounded-lg text-white hover:bg-[#6D28D9] transition-colors">
                    <ArrowRight size={14} className="sm:hidden" />
                    <ArrowRight size={16} className="hidden sm:block" />
                 </button>
              </form>
           </div>
        </div>

        {/* --- COPYRIGHT --- */}
        <div className="pt-6 sm:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
           <p className="text-gray-500 text-xs sm:text-sm text-center md:text-left">
              &copy; 2024 Genesis AI Inc. All rights reserved.
           </p>
           <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
           </div>
        </div>

      </div>
    </footer>
  );
}