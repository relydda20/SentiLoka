import React from "react";
import { motion } from "framer-motion";
import { Target, Zap, Award, Lightbulb, FileDown } from "lucide-react";

const icons = { target: Target, bolt: Zap, award: Award, lightbulb: Lightbulb };

const CaseSection = () => {
  const sections = [
    {
      icon: "target",
      title: "The Challenge",
      content: (
        <>
          <p className="mb-2">
            Customers reported slow service during peak hours and frequent order inaccuracies at the drive-thru.
          </p>
          <p className="mb-2">
            Several reviews mentioned long waiting times and incorrect items, creating frustration and reducing satisfaction.
          </p>
          <p>These operational issues risk damaging customer trust and overall experience.</p>
        </>
      ),
    },
    {
      icon: "bolt",
      title: "The Solution",
      content: (
        <>
          <p>
            To overcome these challenges, KFC Lippo Cikarang introduced three key data-driven initiatives powered
            <span className="font-medium text-[#2F4B4E]"> by SentiLoka insights:</span>
          </p>
          <ul className="list-disc list-inside mb-2 font-medium text-[#2F4B4E] text-sm leading-relaxed">
            <li>Optimize staffing schedules</li>
            <li>Drive-Thru Staff Training Program</li>
            <li>Self-Service Kiosks</li>
          </ul>
          <p>This combination enhances both speed and reliability.</p>
        </>
      ),
    },
    {
      icon: "award",
      title: "The Result",
      content: (
        <>
          <p>
            With an investment of
            <span className="font-medium text-[#2F4B4E]"> Rp 26 million per month </span>
            for optimized staffing and
            <span className="font-medium text-[#2F4B4E]"> Rp 50 million </span>
            for the installation of two self-service kiosks, KFC Lippo Cikarang achieved measurable improvements:
          </p>
          <ul className="list-disc list-inside mb-2 font-medium text-[#2F4B4E] text-sm leading-relaxed">
            <li>50% reduction in negative reviews</li>
            <li>Google Maps rating increase from 4.1 to 4.5</li>
            <li>10–15% growth in monthly revenue</li>
          </ul>
          <p>
            These results translate into a
            <span className="font-medium text-[#2F4B4E]"> 3–6× return on investment (ROI) </span>
            within just the first month of implementation — a clear indicator of how data-driven decision-making can directly enhance customer satisfaction and operational efficiency.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center gap-10 mt-16 px-6">
      {sections.map((section, index) => {
        const Icon = icons[section.icon];
        return (
          <motion.div
            key={index}
            className="flex items-start gap-5 w-full max-w-4xl"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#E8F3F0] flex items-center justify-center">
              <Icon className="text-[#2F4B4E]" size={22} />
            </div>

            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
              <div className="inline-block bg-[#2F4B4E] text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
                {section.title}
              </div>
              <div className="text-gray-700 text-sm leading-relaxed">{section.content}</div>
            </div>
          </motion.div>
        );
      })}

      {/* Download Button */}
      <motion.div
        className="mt-8 mb-12"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <button
          onClick={() => window.open("/KFC-Case-Study.pdf", "_blank")}
          className="flex items-center gap-2 bg-[#2F4B4E] text-white px-6 py-3 rounded-xl font-medium shadow-md hover:bg-[#3b6668] transition-all duration-300 hover:shadow-lg"
        >
          <FileDown size={18} />
          Download Full Report (PDF)
        </button>
      </motion.div>
    </div>
  );
};

export default CaseSection;
