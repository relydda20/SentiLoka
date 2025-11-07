import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ThumbsUp } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);

  const reviewData = [
    { name: "Sarah M.", text: "Excellent service! Very responsive", rating: 5 },
    { name: "John D.", text: "Great experience, highly recommend", rating: 5 },
    { name: "Emily R.", text: "Good quality products", rating: 4 },
    { name: "Michael K.", text: "Fast delivery and good support", rating: 5 },
    { name: "Lisa P.", text: "Amazing customer service!", rating: 5 },
    { name: "David W.", text: "Very satisfied with my purchase", rating: 4 },
    { name: "Anna T.", text: "Professional and friendly staff", rating: 5 },
    { name: "Chris B.", text: "Exceeded my expectations", rating: 5 },
  ];

  useEffect(() => {
    const generateReviews = () => {
      const newReviews = reviewData.map((review, i) => ({
        ...review,
        id: i,
        x: 5 + Math.random() * 90,
        delay: i * 2,
        duration: 15 + Math.random() * 5,
      }));
      setReviews(newReviews);
    };

    generateReviews();
  }, []);

  // Komponen tombol simpel tanpa variant
  const Button = ({ children, className = '', onClick }) => {
    const baseStyles =
      "px-6 py-2.5 sm:px-7 sm:py-3 rounded-full font-medium transition-all duration-300 cursor-pointer text-sm sm:text-base";
    return (
      <button
        onClick={onClick}
        className={`${baseStyles} ${className}`}
      >
        {children}
      </button>
    );
  };

  return (
    <section className="min-h-screen snap-start bg-gradient-to-b from-gray-50 to-white flex items-center pt-20 sm:pt-16 pb-10 sm:pb-0 relative overflow-hidden">
      {/* Floating Review Cards Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="absolute w-56 sm:w-64"
            style={{
              left: `${review.x}%`,
              bottom: '-100px',
              animation: `float-up ${review.duration}s linear infinite`,
              animationDelay: `${review.delay}s`,
              opacity: 0.7
            }}
          >
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-100 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {review.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{review.name}</span>
                </div>
                <ThumbsUp className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < review.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              <p className="text-gray-700 text-xs leading-relaxed">
                "{review.text}"
              </p>

              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-medium text-emerald-700">Positive</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white pointer-events-none"></div>

      {/* Original Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20 w-full">
        <div className="text-center max-w-4xl mx-auto">
          {/* Judul Hero */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in-up">
            <div className="text-gray-900">Transform Customer Reviews</div>
            <div style={{ color: '#CED7B0' }} className="drop-shadow-lg mt-1 sm:mt-0">
              Into Business Growth
            </div>
          </h1>

          {/* Deskripsi */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4 animate-fade-in animation-delay-200">
            AI-powered sentiment analysis and reply generation for your Google Maps reviews.
            Save time, understand customers, and grow your brand.
          </p>

          {/* Tombol CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 animate-fade-in-up animation-delay-400">
            <Button
              onClick={() => navigate('/register')}
              className="relative overflow-hidden w-full sm:w-auto text-base sm:text-lg px-8 py-3 rounded-full text-[#FAF6E9] bg-gradient-to-r from-[#3E3E3E] to-[#4B7068] transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span className="absolute inset-0 bg-[#4B7068] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="text-[#FAF6E9] relative z-10">Get Started for Free</span>
            </Button>

            <Button
              onClick={() => navigate('/login')}
              className="text-base sm:text-lg px-8 py-3 w-full sm:w-auto bg-[#E1E6C3] text-[#2F4B4E] hover:bg-[#CED7B0] shadow-md hover:shadow-lg hover:scale-105"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;