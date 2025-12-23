"use client";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Hexagon, User, LogOut, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check authentication status
  useEffect(() => {
    checkAuth();
  }, []);

  // Handle click outside to close profile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileMenuOpen && !event.target.closest('.profile-menu-container')) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setUser(null);
        setIsProfileMenuOpen(false);
        router.push('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Dynamic navigation based on auth status
  const navLinks = user ? [
    { name: 'Home', href: '/main' },
    { name: 'Dashboard', href: '/dashboard' },
  ] : [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#050505]/80 backdrop-blur-md py-3 sm:py-4' : 'bg-transparent py-4 sm:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
            <Hexagon size={16} fill="white" className="rotate-90 sm:hidden" />
            <Hexagon size={18} fill="white" className="rotate-90 hidden sm:block" />
          </div>
          <span className="text-lg sm:text-xl font-medium tracking-tight text-white">Genesis</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm lg:text-base text-gray-400 hover:text-white transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* CTA Button / User Profile */}
        <div className="hidden md:block">
          {isLoading ? (
            <div className="animate-pulse bg-gray-700 h-10 w-24 rounded-lg"></div>
          ) : user ? (
            <div className="relative profile-menu-container">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-400/50 overflow-hidden flex items-center justify-center group-hover:border-purple-400 transition-colors">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-purple-400" />
                  )}
                </div>
                <span className="font-medium text-sm">{user.name?.split(' ')[0]}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] backdrop-blur-xl rounded-lg shadow-xl border border-white/10 py-2 z-[60]">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      router.push('/profile');
                      setIsProfileMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <User size={16} className="mr-3" />
                    <span>Profile</span>
                  </button>

                  <div className="border-t border-white/10 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <LogOut size={16} className="mr-3" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg text-sm lg:text-base font-medium transition-all duration-300 shadow-[0_0_15px_rgba(109,40,217,0.5)] hover:shadow-[0_0_25px_rgba(109,40,217,0.6)]"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-300 hover:text-white transition-colors p-1"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} className="sm:hidden" /> : <Menu size={20} className="sm:hidden" />}
            {isMobileMenuOpen ? <X size={24} className="hidden sm:block" /> : <Menu size={24} className="hidden sm:block" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 shadow-2xl">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-gray-300 hover:text-white py-2 sm:py-3 block text-center transition-colors text-sm sm:text-base"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}

          {user ? (
            <div className="border-t border-white/10 pt-4 mt-2">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-400/50 overflow-hidden flex items-center justify-center">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-purple-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  router.push('/profile');
                  setIsMobileMenuOpen(false);
                }}
                className="bg-[#1a1a1a] hover:bg-[#252525] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium w-full mb-2 transition-all duration-300 border border-white/10"
              >
                Profile
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium w-full transition-all duration-300 border border-red-500/20"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                router.push('/login');
                setIsMobileMenuOpen(false);
              }}
              className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium w-full mt-2 transition-all duration-300 shadow-[0_0_15px_rgba(109,40,217,0.5)]"
            >
              Get Started
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;