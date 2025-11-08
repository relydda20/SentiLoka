import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import kfcLogo from '../../assets/kfc.jpg';

const StoriesSection = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/case-studies');
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-[#F2F8F6] via-[#FFFFFF] to-[#F7F9F8] px-6 py-24 flex flex-col items-center justify-center overflow-hidden">
      {/* 🌿 Gradient background accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#A7D1C3]/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#2F4B4E]/20 rounded-full blur-[120px]" />

      {/* ✨ Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-[#2F4B4E]/20 rounded-full"
          style={{
            width: Math.random() * 10 + 6,
            height: Math.random() * 10 + 6,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* 🧭 Title */}
      <motion.h2
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4 text-center relative"
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Real Stories, Real Insight
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        className="text-gray-600 text-center text-base sm:text-lg max-w-2xl mb-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Discover how leading brands transform{' '}
        <span className="text-[#2F4B4E] font-medium">AI-powered insights</span>{' '}
        into smarter decisions and customer loyalty that lasts.
      </motion.p>

      {/* 🌸 Case Study Card */}
      <motion.div
        className="relative bg-white/70 backdrop-blur-md border border-[#2F4B4E]/10 rounded-3xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row items-center hover:border-[#4B7068]/30 transition-all duration-500"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{
          scale: 1.02,
          y: -4,
          boxShadow: '0 20px 60px rgba(47,75,78,0.15)',
          transition: {
            type: 'spring',
            stiffness: 180,
            damping: 18,
          },
        }}
      >
        {/* Left content */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center items-center md:items-start text-center md:text-left space-y-5">
          <motion.h3
            className="text-lg md:text-2xl font-semibold text-gray-900 leading-snug"
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            KFC is More Popular than Mc’Donalds
          </motion.h3>

          <p className="text-gray-500 text-sm md:text-base max-w-md leading-relaxed">
            Discover how{' '}
            <span className="font-medium text-[#2F4B4E]">KFC Lippo Cikarang</span> used
            <span className="font-medium text-[#2F4B4E]"> SentiLoka AI </span>
            to transform thousands of customer reviews into actionable insights — improving service speed, boosting satisfaction, and outperforming McDonald’s in local popularity.
          </p>

          {/* Button with gradient animation */}
          <motion.button
            onClick={handleNavigate}
            className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#2F4B4E] to-[#4B7068] text-white rounded-full font-medium transition-all duration-500 hover:opacity-90"
            whileHover={{
              scale: 1.05,
              x: 5,
              transition: { type: 'spring', stiffness: 300, damping: 20 },
            }}
          >
            View More
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          {/* Tags */}
          <div className="flex gap-2 mt-4 flex-wrap justify-center md:justify-start">
            <span className="text-xs bg-[#E8F3F0] text-[#2F4B4E] px-3 py-1 rounded-full font-medium">
              Food Industry
            </span>
            <span className="text-xs bg-[#E8F3F0] text-[#2F4B4E] px-3 py-1 rounded-full font-medium">
              Customer Experience
            </span>
            <span className="text-xs bg-[#E8F3F0] text-[#2F4B4E] px-3 py-1 rounded-full font-medium">
              AI Insights
            </span>
          </div>
        </div>

        {/* Right image (no green bg, larger logo) */}
        <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-10">
          <motion.img
            src={kfcLogo}
            alt="KFC Logo"
            className="w-80 md:w-[300px] h-auto object-contain rounded-xl drop-shadow-md"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          />
        </div>

        {/* Subtle glow border */}
        <motion.div
          className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-[#4B7068]/10 to-[#A7D1C3]/10 opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none"
        />
      </motion.div>
    </section>
  );
};

export default StoriesSection;
