"use client";
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Zap, ArrowRight, Github, Chrome, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CompanyLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  // Check for success message from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    if (message) {
      setSuccessMessage(message);
      // Clear the URL parameter
      window.history.replaceState({}, '', '/company-login');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/company-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to company main page after successful login
        router.push('/company-main');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Company login error:', error);
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

      {/* --- LEFT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-[100dvh] lg:h-screen px-6 sm:px-8 lg:px-16 relative z-10 py-4 lg:py-6">
        
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
           <div className="absolute top-[-10%] right-[-10%] w-[200px] h-[200px] bg-[#7C3AED]/20 blur-[80px] rounded-full" />
        </div>

        {/* 1. Header/Logo */}
        <div className="flex-none lg:absolute lg:top-8 lg:left-16">
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center shadow-[0_0_15px_#7C3AED]">
                    <Building2 size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">Genesis Business</span>
            </div>
        </div>

        {/* 2. Form Container */}
        <div className="flex-1 flex flex-col justify-center py-6">
            <div className="max-w-[360px] w-full mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Company Login</h1>
                <p className="text-gray-400 mb-6 text-sm">Access your company dashboard and analytics.</p>

                {/* Social Login */}
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
                        <span className="bg-[#050505] px-3 text-gray-500">Or continue with email</span>
                    </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                    <p className="text-green-400 text-sm text-center">{successMessage}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Form Fields */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300 ml-1">Company Email</label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                                <Mail size={16} />
                            </div>
                            <input
                            type="email"
                            name="email"
                            placeholder="company@business.com"
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
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              name="rememberMe"
                              checked={formData.rememberMe}
                              onChange={handleChange}
                              className="w-3.5 h-3.5 rounded border border-white/20 bg-[#1A1A1A] group-hover:border-[#7C3AED] transition-colors text-[#7C3AED] focus:ring-[#7C3AED]"
                            />
                            <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                        </label>
                        <a href="#" className="text-[#7C3AED] hover:text-[#6D28D9] font-medium transition-colors">Forgot password?</a>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                        <ArrowRight size={16} />
                    </button>
                </form>

                {/* Switch to User Login */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-center text-xs text-blue-300">
                    Not a company?{' '}
                    <Link href="/login" className="text-white font-medium hover:text-blue-200 transition-colors">Sign in as User</Link>
                  </p>
                </div>

                <p className="mt-6 text-center text-xs text-gray-500">
                    Don't have a company account?{' '}
                    <Link href="/company-register" className="text-white font-medium hover:text-[#7C3AED] transition-colors">Register your company</Link>
                </p>
            </div>
        </div>
        
        {/* 3. Footer Links */}
        <div className="flex-none flex gap-6 text-[10px] sm:text-xs text-gray-600 lg:absolute lg:bottom-8 lg:left-16">
           <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
           <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* --- RIGHT SIDE: VISUAL (Hidden on Mobile) --- */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0A0A0A] items-center justify-center p-12 overflow-hidden border-l border-white/5">
         
         {/* Background Effects */}
         <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7C3AED]/10 blur-[120px] rounded-full" />
         
         {/* Floating Card Visual */}
         <div className="relative w-full max-w-lg">
            {/* Main Glass Card */}
            <div className="relative bg-[#111]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#7C3AED] flex items-center justify-center text-white shadow-lg">
                     <Building2 size={24} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Enterprise Dashboard</h3>
                     <p className="text-sm text-[#7C3AED]">Real-time Business Analytics</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  {[
                     { label: "Team Performance", status: "98% Uptime", time: "Live" },
                     { label: "Security Compliance", status: "Verified", time: "Updated" },
                     { label: "API Monitoring", status: "Active", time: "Real-time" }
                  ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full bg-green-500`} />
                           <span className="text-sm text-gray-300">{item.label}</span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{item.time}</span>
                     </div>
                  ))}
               </div>

               <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-gray-400 text-sm italic">
                     "Trusted by leading enterprises for mission-critical verification and compliance."
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-gray-600" />
                     <span className="text-xs text-gray-500">Enterprise Solutions Team</span>
                  </div>
               </div>
            </div>

            {/* Decorative Floating Elements */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#7C3AED] rounded-2xl opacity-20 blur-xl animate-pulse" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-600 rounded-full opacity-20 blur-2xl" />
         </div>

      </div>

    </div>
  );
}
