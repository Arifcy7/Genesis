"use client";
import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to login page after successful registration
        router.push('/login?message=Registration successful! Please log in.');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex relative overflow-hidden">
      
      {/* Global CSS for Dot Pattern */}
      <style jsx global>{`
        .bg-dot-pattern {
          background-image: radial-gradient(#ffffff 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>

      {/* --- LEFT SIDE: VISUAL (Hidden on Mobile) --- */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0A0A0A] items-center justify-center p-12 overflow-hidden border-r border-white/5">
         
         {/* Background Effects */}
         <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7C3AED]/10 blur-[120px] rounded-full" />
         
         {/* Floating Card Visual */}
         <div className="relative w-full max-w-lg">
            {/* Main Glass Card */}
            <div className="relative bg-[#111]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#7C3AED] flex items-center justify-center text-white shadow-lg">
                     <Zap size={24} fill="white" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Unlock Full Access</h3>
                     <p className="text-sm text-[#7C3AED]">Join thousands of creators</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  {[
                     { label: "Unlimited AI Credits", status: "Active", icon: "✨" },
                     { label: "Advanced Analytics", status: "Included", icon: "📊" },
                     { label: "Priority Support", status: "24/7", icon: "💬" }
                  ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                              {item.icon}
                           </div>
                           <span className="text-sm text-gray-300 font-medium">{item.label}</span>
                        </div>
                        <span className="text-xs text-[#7C3AED] font-bold bg-[#7C3AED]/10 px-2 py-1 rounded-md border border-[#7C3AED]/20">{item.status}</span>
                     </div>
                  ))}
               </div>

               <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex -space-x-3 mb-3">
                     {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#111] bg-gray-600 overflow-hidden">
                           <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                        </div>
                     ))}
                     <div className="w-8 h-8 rounded-full border-2 border-[#111] bg-[#7C3AED] flex items-center justify-center text-[10px] font-bold text-white">
                        +2k
                     </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                     Join a community of forward-thinking innovators.
                  </p>
               </div>
            </div>

            {/* Decorative Floating Elements */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500 rounded-full opacity-10 blur-3xl" />
            <div className="absolute -top-8 -left-8 w-24 h-24 bg-indigo-500 rounded-full opacity-10 blur-2xl animate-pulse" />
         </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-[100dvh] lg:h-screen px-6 sm:px-8 lg:px-16 relative z-10 py-4 lg:py-6">
        
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
           <div className="absolute bottom-[-10%] left-[-10%] w-[200px] h-[200px] bg-[#7C3AED]/20 blur-[80px] rounded-full" />
        </div>

        {/* 1. Header/Logo */}
        {/* Adjusted positioning to be on the right side logic contextually, but physically top-left of this container */}
        <div className="flex-none lg:absolute lg:top-8 lg:right-16">
            <div className="flex items-center gap-2 flex-row-reverse lg:flex-row">
                <span className="text-lg font-bold tracking-tight">Veritas</span>
                <div className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center shadow-[0_0_15px_#7C3AED]">
                    <Zap size={16} fill="white" className="text-white" />
                </div>
            </div>
        </div>

        {/* 2. Form Container */}
        <div className="flex-1 flex flex-col justify-center py-6">
            <div className="max-w-[360px] w-full mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Create an account</h1>
                <p className="text-gray-400 mb-6 text-sm">Start your 14-day free trial. No credit card required.</p>

                {/* Social Signup */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button className="flex items-center justify-center gap-2.5 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 rounded-lg py-2.5 text-xs sm:text-sm font-medium transition-all hover:border-white/20">
                        <Chrome size={16} />
                        Google
                    </button>
                    <button className="flex items-center justify-center gap-2.5 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 rounded-lg py-2.5 text-xs sm:text-sm font-medium transition-all hover:border-white/20">
                        <Github size={16} />
                        GitHub
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                        <span className="bg-[#050505] px-3 text-gray-500">Or register with email</span>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Form Fields */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300 ml-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                                <User size={16} />
                            </div>
                            <input
                            type="text"
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300 ml-1">Email</label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                                <Mail size={16} />
                            </div>
                            <input
                            type="email"
                            name="email"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300 ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                                <Lock size={16} />
                            </div>
                            <input
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-xs text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-white font-medium hover:text-[#7C3AED] transition-colors">Log in</Link>
                </p>
            </div>
        </div>
        
        {/* 3. Footer Links */}
        <div className="flex-none flex gap-6 text-[10px] sm:text-xs text-gray-600 lg:absolute lg:bottom-8 lg:right-16 justify-end">
           <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
           <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
        </div>
      </div>

    </div>
  );
}