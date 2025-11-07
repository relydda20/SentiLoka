import React from 'react';
import { useNavigate } from 'react-router-dom';

const PricingSection = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '0',
      period: '/Month',
      features: ['1 Location', '1x Data Check', 'SentiAI'],
      buttonText: 'Get Started',
      highlight: false,
    },
    {
      name: 'Starter',
      price: '100.000',
      period: '/Month',
      features: ['3 Locations', 'SentiAI'],
      buttonText: 'Buy Now',
      highlight: false,
    },
    {
      name: 'Business',
      price: '500.000',
      period: '/Month',
      features: ['10 Locations', 'Reply Generator', 'Business Insight', 'SentiAI'],
      buttonText: 'Buy Now',
      highlight: true,
    },
  ];

  return (
    <section
      id="subscribe"
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F6FAF8] via-[#FFFFFF] to-[#F5F8F7] py-20 px-6 overflow-hidden"
    >
      {/* background pattern lembut */}
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,#4B7068_1px,transparent_0)] bg-[size:20px_20px]" />

      <div className="relative z-10 max-w-7xl w-full text-center">
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1C1C1C] mb-4 tracking-tight">
            Choose Your Plan
          </h2>
          <p className="text-[#6B7280] text-lg sm:text-xl max-w-2xl mx-auto">
            Unlock powerful insights from your customer feedback — no manual work required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`
                relative bg-white rounded-3xl p-8 border
                flex flex-col justify-between
                transition-transform duration-500 transform hover:-translate-y-1
                ${plan.highlight ? 'border-[#4B7068]' : 'border-gray-200'}
              `}
            >
              {/* Ribbon for Highlighted Plan */}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#4B7068] text-[#FAF6E9] text-xs font-semibold px-3 py-1 rounded-full">
                  Best Value
                </div>
              )}

              <div>
                <h3
                  className={`text-2xl font-bold mb-4 ${
                    plan.highlight ? 'text-[#4B7068]' : 'text-gray-800'
                  }`}
                >
                  {plan.name}
                </h3>

                <div className="mb-6">
                  <span
                    className="block font-extrabold text-gray-900"
                    style={{
                      fontSize: 'clamp(2rem, 5vw, 3rem)',
                    }}
                  >
                    Rp{plan.price}
                  </span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center justify-center gap-2 text-gray-700">
                      <svg
                        className="w-5 h-5 text-emerald-600 flex-shrink-0"
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
                      <span
                        className={`text-sm sm:text-base ${
                          feature === 'SentiAI' ? 'font-semibold text-[#1C1C1C]' : ''
                        }`}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/login')}
                className={`relative overflow-hidden text-base font-medium px-8 py-3 rounded-full transition-all duration-500 group w-full 
                  ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-[#4B7068] to-[#3E3E3E] text-[#FAF6E9]'
                      : 'bg-[#E6EDEB] text-[#1C1C1C] hover:bg-[#DDE4E2]'
                  }`}
              >
                <span
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    plan.highlight ? 'bg-[#3E3E3E]' : 'bg-[#4B7068]'
                  }`}
                ></span>
                <span className="relative z-10">{plan.buttonText}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
