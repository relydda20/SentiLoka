import React from "react";
import { motion } from "framer-motion";
import kfcLogo from "../../assets/kfc.jpg";

const CaseHeader = () => {
  return (
    <section className="text-center max-w-4xl mx-auto px-6">
      <motion.h1
        className="text-2xl md:text-3xl font-semibold text-gray-900 leading-snug mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        What Made KFC Pull Ahead of McDonald’s in Lippo Cikarang?
      </motion.h1>

      <motion.div
        className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-5 border border-[#2F4B4E]/10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <img
          src={kfcLogo}
          alt="KFC"
          className="w-32 h-32 object-contain mb-4"
        />
        <h2 className="text-lg font-semibold text-[#2F4B4E] mb-2">
          About KFC Indonesia
        </h2>
        <p className="text-gray-600 text-sm max-w-2xl">
          KFC Indonesia is one of the country’s leading quick-service restaurant chains, operating over 600 outlets nationwide and serving millions of customers every month. Competing in a highly saturated fast-food market alongside brands like McDonald’s,
          KFC continues to focus on speed, service accuracy, and digital innovation to maintain customer loyalty and brand leadership.
        </p>
        <div className="flex gap-4 text-sm text-gray-700 mt-4">
          <span className="bg-[#E8F3F0] text-[#2F4B4E] px-3 py-1 rounded-full">
            Industry: Food Service
          </span>
          <span className="bg-[#E8F3F0] text-[#2F4B4E] px-3 py-1 rounded-full">
            Business Type: Restaurant
          </span>
        </div>
      </motion.div>
    </section>
  );
};

export default CaseHeader;
