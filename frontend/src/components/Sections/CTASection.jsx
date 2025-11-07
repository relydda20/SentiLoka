import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const Button = ({ children, className = '', onClick }) => (
    <button
      onClick={onClick}
      className={`px-8 sm:px-10 py-3 sm:py-4 rounded-full font-medium transition-all duration-300 cursor-pointer bg-emerald-800 text-white hover:bg-emerald-900 shadow-lg hover:shadow-xl text-base sm:text-lg ${className}`}
    >
      {children}
    </button>
  );

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen snap-start bg-gray-50 flex items-center py-12 sm:py-16 lg:py-20 relative overflow-hidden"
    >
      {/* Animated gradient background with blink-blink effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F7F7A]/5 via-[#CED7B0]/10 to-[#E8E5D5]/5 animate-gradient-shift"></div>
        
        {/* Subtle twinkling dots */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#CED7B0] rounded-full animate-twinkle"></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-[#5F7F7A] rounded-full animate-twinkle-delay-1"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-[#CED7B0] rounded-full animate-twinkle-delay-2"></div>
        <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-[#5F7F7A] rounded-full animate-twinkle-delay-3"></div>
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-[#E8E5D5] rounded-full animate-twinkle"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="text-center">
          {/* Heading */}
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-4 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            Ready to Elevate Your Customer Experience?
          </h2>
          
          {/* Description */}
          <p className={`text-base sm:text-lg lg:text-xl text-[#858585] mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto px-4 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '150ms' }}>
            Join hundreds of businesses using SentiLoka to build stronger customer relationships.
          </p>

          {/* CTA Button */}
          <div className={`transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '300ms' }}>
            <Button
              onClick={() => navigate('/login')}
              className="relative overflow-hidden text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-[#FAF6E9] bg-gradient-to-r from-[#3E3E3E] to-[#5F7F7A] transition-all duration-300 group w-full max-w-xs sm:max-w-none sm:w-auto mx-auto hover:-translate-y-1"
            >
              <span className="absolute inset-0 bg-[#5F7F7A] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="text-[#FAF6E9] relative z-10">Start Your Free Trial</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-4 sm:left-6 lg:left-8 text-gray-400 text-xs sm:text-sm">
        © 2025 SentiLoka
      </div>
    </section>
  );
};

export default CTASection;