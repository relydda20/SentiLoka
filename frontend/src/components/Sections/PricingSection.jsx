import React from 'react';
import { useNavigate } from 'react-router-dom';

const PricingSection = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '0',
      period: '/Month',
      features: ['1 Location', '100 Reviews'],
      buttonText: 'Get Started',
    },
    {
      name: 'Starter',
      price: '100.000',
      period: '/Month',
      features: ['3 Locations', '300 Reviews'],
      buttonText: 'Buy Now',
    },
    {
      name: 'Business',
      price: '500.000',
      period: '/Month',
      features: ['10 Locations', '8000 Reviews', 'Business Insight'],
      buttonText: 'Buy Now',
    },
  ];

  return (
    <section id="subscribe" className="min-h-screen bg-gray-50 flex items-center py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header - Responsif */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            Choose Your Plan
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[#858585] px-4">
            Get started today and turn customer feedback into actionable insights.
          </p>
        </div>

        {/* Cards - Responsif Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col text-center"
            >
              {/* Plan Name - Responsif */}
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-800 mb-4 sm:mb-5">
                {plan.name}
              </h3>

              {/* Harga - Responsif dengan clamp */}
              <div className="mb-5 sm:mb-6">
                <span
                  className="block font-bold text-gray-900 leading-tight break-words"
                  style={{
                    fontSize: 'clamp(1.5rem, 5vw, 2.8rem)',
                  }}
                >
                  Rp{plan.price}
                </span>
                <span className="text-gray-600 text-xs sm:text-sm">{plan.period}</span>
              </div>

              {/* Features - Responsif */}
              <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center justify-center gap-2">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700 text-xs sm:text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Button - Responsif */}
              <button
                onClick={() => navigate('/login')}
                className="relative overflow-hidden text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-[#FAF6E9] bg-gradient-to-r from-[#3E3E3E] to-[#4B7068] transition-all duration-300 group w-full"
              >
                <span className="absolute inset-0 bg-[#4B7068] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="text-[#FAF6E9] relative z-10">{plan.buttonText}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;