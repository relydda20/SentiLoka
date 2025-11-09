import React, { useEffect, useRef, useState } from 'react';

const HowItWorks = () => {
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

  const steps = [
    {
      number: '1',
      title: 'Add Locations',
      description:
        'Connect your business by searching for it on Google Maps. Add one or multiple locations to your dashboard.',
    },
    {
      number: '2',
      title: 'Analyze Reviews',
      description:
        'Our AI automatically fetches and analyzes your Google reviews, assigning sentiment scores to each one.',
    },
    {
      number: '3',
      title: 'Generate Replies',
      description:
        'Get insights, track sentiment trends, and generate personalized replies with the click of a button.',
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="min-h-screen snap-start bg-white flex items-center py-12 sm:py-16 lg:py-20 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        {/* Header */}
        <div className={`text-center mb-10 sm:mb-14 lg:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[#858585] px-4">
            From setup to insights in just a few minutes.
          </p>
        </div>

        {/* Steps with animated connecting line */}
        <div className="relative max-w-5xl mx-auto">
          {/* Animated connecting line - desktop only */}
          <div className="hidden md:block absolute top-10 left-0 right-0 h-1 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E8E5D5] via-[#CED7B0] to-[#E8E5D5] rounded-full"></div>
            <div 
              className={`absolute inset-0 bg-gradient-to-r from-[#5F7F7A] to-[#CED7B0] rounded-full transition-all duration-2000 ease-out ${
                isVisible ? 'scale-x-100' : 'scale-x-0'
              }`}
              style={{ transformOrigin: 'left' }}
            ></div>
            
            {/* Animated dot moving along the line */}
            {isVisible && (
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#5F7F7A] rounded-full shadow-lg animate-move-along-line"></div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 relative z-10">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex flex-col items-center text-center px-4 transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{
                  transitionDelay: `${index * 150}ms`
                }}
              >
                {/* Step Number with pulse effect */}
                <div className="relative mb-4 sm:mb-5 lg:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#3E3E3E] to-[#5F7F7A] text-[#FAF6E9] rounded-full flex items-center justify-center text-xl sm:text-2xl lg:text-3xl font-bold shadow-lg transition-transform duration-300 hover:scale-110 relative z-10">
                    {step.number}
                  </div>
                  
                  {/* Subtle pulse ring */}
                  {isVisible && (
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-[#5F7F7A]/30 animate-pulse-ring"
                      style={{ animationDelay: `${index * 0.5}s` }}
                    ></div>
                  )}
                </div>

                {/* Step Title */}
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {step.title}
                </h3>

                {/* Step Description */}
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;