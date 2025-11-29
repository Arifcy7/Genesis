"use client";
import React from 'react';
import { Mail, MapPin, Phone, Send, MessageSquare } from 'lucide-react';
import ColorBends from './ColorBends';

export default function Contact() {
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
        {/* ColorBends Animated Background */}
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
               Contact Us
             </span>
             <span className="text-sm text-gray-300 font-medium">Get in Touch</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-500">Connect</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Have questions about our AI-powered fact-checking system? We'd love to hear from you and help you get started with Veritas.
          </p>
        </div>
      </section>

    <section className="bg-[#050505] py-10 px-6 md:px-12 font-sans text-white relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#7C3AED]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#7C3AED]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* CSS for Dot Pattern */}
      <style>{`
        .bg-dot-pattern {
          background-image: radial-gradient(#ffffff 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        
        {/* --- CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
          
          {/* Left: Contact Info */}
          <div className="lg:col-span-2 flex flex-col gap-6 mx-auto max-w-md lg:max-w-none">
            <div className="p-6 rounded-3xl bg-[#0A0A0A] border border-white/10 relative overflow-hidden group hover:border-[#7C3AED]/30 transition-colors duration-300">
               <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
               <h3 className="text-xl font-bold mb-5 relative z-10 text-center lg:text-left">Contact Information</h3>
               
               <div className="space-y-5 relative z-10">
                 <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:items-start lg:text-left lg:gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-[#7C3AED] shrink-0">
                        <Mail size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Email us at</p>
                        <a href="mailto:support@veritas.com" className="text-sm text-white font-medium hover:text-[#7C3AED] transition-colors">support@veritas.com</a>
                    </div>
                 </div>

                 <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:items-start lg:text-left lg:gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-[#7C3AED] shrink-0">
                        <Phone size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Call us</p>
                        <a href="tel:+1555000000" className="text-sm text-white font-medium hover:text-[#7C3AED] transition-colors">+1 (555) 000-0000</a>
                    </div>
                 </div>

                 <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:items-start lg:text-left lg:gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-[#7C3AED] shrink-0">
                        <MapPin size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Visit us</p>
                        <p className="text-sm text-white font-medium">100 Innovation Dr,<br/>San Francisco, CA</p>
                    </div>
                 </div>
               </div>
            </div>

            {/* Support Card */}
            <div className="p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 relative overflow-hidden text-center flex-1 flex flex-col justify-center min-h-[200px] group hover:border-[#7C3AED]/30 transition-colors duration-300">
               <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
               <div className="relative z-10">
                  <h4 className="text-xl font-bold mb-3">Need live support?</h4>
                  <p className="text-gray-400 text-sm mb-6">Our support team is online 24/7 to help you with any issues.</p>
                  <button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]">
                    Start Live Chat
                  </button>
               </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3 flex mx-auto max-w-md lg:max-w-none">
             <form className="p-6 md:p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 relative overflow-hidden w-full flex flex-col">
                <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 ml-1">First Name</label>
                        <input type="text" placeholder="John" className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/50 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 ml-1">Last Name</label>
                        <input type="text" placeholder="Doe" className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/50 transition-all" />
                    </div>
                </div>

                <div className="relative z-10 space-y-1.5 mb-5">
                    <label className="text-xs font-medium text-gray-400 ml-1">Email Address</label>
                    <input type="email" placeholder="john@company.com" className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/50 transition-all" />
                </div>

                <div className="relative z-10 space-y-1.5 mb-6 flex-1">
                    <label className="text-xs font-medium text-gray-400 ml-1">Message</label>
                    <textarea rows="5" placeholder="Tell us how we can help..." className="w-full h-full min-h-[120px] bg-[#151515] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/50 transition-all resize-none" />
                </div>

                <button type="button" className="relative z-10 w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:-translate-y-1">
                    Send Message
                    <Send size={16} />
                </button>
             </form>
          </div>

        </div>

        {/* --- MAP SECTION --- */}
        <div className="mt-8 mx-auto max-w-md lg:max-w-none">
          <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-white/10 bg-[#050505]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.086728465932!2d-122.41941492346644!3d37.77492971796607!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085809c6c8f4459%3A0xb10ed6d9b5050fa5!2sTwitter%20HQ!5e0!3m2!1sen!2sus!4v1732723200000!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>

    </div>
  );
}