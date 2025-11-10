import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from 'lucide-react';
import logoImage from '../../assets/sentiloka_logo.png';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // fungsi bantu buat navigasi + scroll
  const handleNavigation = (id) => {
    if (location.pathname !== "/") {
      // pindah dulu ke landing
      navigate("/");
      // tunggu sedikit supaya halaman sempat render baru scroll
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 400);
    } else {
      // kalau udah di landing, langsung scroll aja
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 shadow-[1px_2px_40px_rgba(0,0,0,0.15)]">
      <div className="relative max-w-full mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 z-10 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logoImage} alt="SentiLoka Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
          <span className="text-lg sm:text-xl text-emerald-900 font-semibold" style={{ fontFamily: 'var(--font-mate)' }}>
            SentiLoka
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-10 absolute left-1/2 transform -translate-x-1/2">
          <button onClick={() => handleNavigation('features')} className="text-gray-800 hover:text-emerald-700 transition-colors text-base font-medium whitespace-nowrap">
            Features
          </button>
          <button onClick={() => handleNavigation('how-it-works')} className="text-gray-800 hover:text-emerald-700 transition-colors text-base font-medium whitespace-nowrap">
            How It Works
          </button>
          <button onClick={() => handleNavigation('stories')} className="text-gray-800 hover:text-emerald-700 transition-colors text-base font-medium whitespace-nowrap">
            Stories
          </button>
          <button onClick={() => handleNavigation('subscribe')} className="text-gray-800 hover:text-emerald-700 transition-colors text-base font-medium whitespace-nowrap">
            Subscribe
          </button>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
          <button
            onClick={() => handleNavigation('subscribe')}
            className="group relative px-5 xl:px-6 py-2 xl:py-2.5 rounded-full font-medium cursor-pointer
                       bg-gradient-to-r from-[#3E3E3E] to-[#4B7068] text-[#FAF6E9]
                       shadow-lg overflow-hidden transition-all duration-500 text-sm xl:text-base"
          >
            <span className="absolute inset-0 bg-[#4B7068] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            <span className="relative z-10 whitespace-nowrap">Get Started</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden z-10 p-2 text-gray-800 hover:text-emerald-700 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed top-16 left-0 right-0 bg-white/98 backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col p-6 space-y-4">
          <button onClick={() => handleNavigation('features')} className="text-left text-gray-800 hover:text-emerald-700 transition-colors text-base font-medium py-2">
            Features
          </button>
          <button onClick={() => handleNavigation('how-it-works')} className="text-left text-gray-800 hover:text-emerald-700 transition-colors text-base font-medium py-2">
            How It Works
          </button>
          <button onClick={() => handleNavigation('stories')} className="text-left text-gray-800 hover:text-emerald-700 transition-colors text-base font-medium py-2">
            Stories
          </button>
          <button onClick={() => handleNavigation('subscribe')} className="text-left text-gray-800 hover:text-emerald-700 transition-colors text-base font-medium py-2">
            Subscribe
          </button>
          <button
            onClick={() => {
              navigate('/case-studies');
              setIsMobileMenuOpen(false);
            }}
            className="text-left text-gray-800 hover:text-emerald-700 transition-colors text-base font-medium py-2"
          >
            Case Studies
          </button>

          <button
            onClick={() => handleNavigation('subscribe')}
            className="group relative px-6 py-3 rounded-full font-medium cursor-pointer
                       bg-gradient-to-r from-[#3E3E3E] to-[#4B7068] text-[#FAF6E9]
                       shadow-lg overflow-hidden transition-all duration-500 text-center mt-2"
          >
            <span className="absolute inset-0 bg-[#4B7068] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            <span className="relative z-10">Get Started</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;