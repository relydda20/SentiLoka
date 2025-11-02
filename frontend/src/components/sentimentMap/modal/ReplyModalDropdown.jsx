import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const ReplyModalDropdown = ({ label, value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className="block mb-2 font-medium text-[#2F4B4E] text-sm">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex justify-between items-center bg-white shadow-sm hover:shadow-md px-4 py-2.5 border-[#CED7B0] border-2 hover:border-[#4B7069] focus:border-[#4B7069] rounded-lg focus:outline-none w-full font-medium text-[#2F4B4E] text-left transition-all"
        >
          <span>{value}</span>
          <ChevronDown
            className={`w-5 h-5 text-[#42676B] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="z-10 fixed inset-0"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown Menu */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="z-20 absolute bg-white shadow-xl mt-2 border-[#CED7B0] border-2 rounded-lg w-full overflow-hidden"
              >
                <div className="py-1 max-h-60 overflow-y-auto">
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        onChange(option);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left transition-all ${
                        value === option
                          ? "bg-[#4B7069] text-white font-semibold"
                          : "text-[#2F4B4E] hover:bg-[#FAF6E9] font-medium"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReplyModalDropdown;
