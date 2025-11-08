import React from "react";
import { motion } from "framer-motion";

const CaseAbout = () => {
  return (
    <section className="max-w-4xl mx-auto mt-16 px-6 text-center">
      <motion.h2
        className="text-xl md:text-2xl font-semibold text-[#2F4B4E] mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Overwiew
      </motion.h2>

      <motion.p
        className="text-gray-600 leading-relaxed text-sm md:text-base max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        KFC Lippo Cikarang, a 24-hour outlet located in a high-traffic industrial area, faced key challenges: slow drive-thru service, long queues, and frequent order inaccuracies. Based on 
        <span className="font-medium text-[#2F4B4E]"> 976 Google Maps reviews analyzed by SentiLoka, </span>
        around
        <span className="font-medium"> 15% of customer feedback was negative, </span>
        mostly concerning service speed and drive-thru performance.
      </motion.p>
    </section>
  );
};

export default CaseAbout;
