import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Bot, TrendingUp } from 'lucide-react';

const FeaturesSection = () => {
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

  const features = [
    {
      icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#5F7F7A]" />,
      title: "Map-Based Analytics",
      description:
        "Visualize customer sentiment across all your business locations on an interactive map.",
      image: "https://images.unsplash.com/photo-1736117703416-f260ee174bac?auto=format&fit=crop&q=80&w=600",
    },
    {
      icon: <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-[#5F7F7A]" />,
      title: "AI Powered Replies",
      description:
        "Generate perfect, context-aware responses to reviews in seconds with customizable tones.",
      image: "https://images.unsplash.com/photo-1659018966820-de07c94e0d01?auto=format&fit=crop&q=80&w=1200",
    },
    {
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#5F7F7A]" />,
      title: "Sentiment Tracking",
      description:
        "Understand customer feelings at a glance with real-time positive, neutral, and negative feedback analysis.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
    },
  ];

  return (
    <section 
      ref={sectionRef}
      id="features" 
      className="min-h-screen bg-gray-50 flex items-center py-12 sm:py-16 lg:py-20 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        {/* Header */}
        <div className={`text-center mb-8 sm:mb-10 lg:mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            Powerful Features, Effortless Control
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[#858585] px-4">
            Everything you need to manage your online reputation in one place.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden transition-all duration-500 h-full flex flex-col group ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{
                transitionDelay: `${index * 100}ms`
              }}
            >
              {/* Image */}
              <div className="h-40 sm:h-48 overflow-hidden bg-gray-200 relative">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="bg-[#E8E5D5] w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#CED7B0] group-hover:scale-110">
                    <div className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight group-hover:text-[#5F7F7A] transition-colors duration-300">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-[#858585] text-sm sm:text-[15px] text-justify leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;