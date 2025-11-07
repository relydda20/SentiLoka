import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { springTransition } from "../../../utils/motionConfig";

const ChatbotFab = ({ onClick }) => {
  // State to track if the item is being dragged
  const [isDragging, setIsDragging] = useState(false);
  const dragEndTimeout = useRef(null);

  // This handler prevents the click if a drag was just completed
  const handleClick = (e) => {
    if (isDragging) {
      e.preventDefault();
      return; // Ignore click
    }
    onClick();
  };

  // When drag ends, we set isDragging to true for a moment
  // to prevent the underlying onClick from firing.
  const handleDragEnd = () => {
    clearTimeout(dragEndTimeout.current);
    setIsDragging(true);
    dragEndTimeout.current = setTimeout(() => {
      setIsDragging(false);
    }, 150); // A small delay
  };

  return (
    <motion.button
      // Add drag props
      drag
      dragMomentum={false}
      dragElastic={0} // Optional: makes it stick to the cursor
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      // Use the new click handler
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={springTransition}
      className="right-6 bottom-6 z-20 fixed flex justify-center items-center bg-linear-to-r from-[#2F4B4E] to-[#4B7069] shadow-lg hover:shadow-xl rounded-full w-16 h-16 text-white cursor-grab active:cursor-grabbing"
      title="Open SentiAI Chatbot"
    >
      <Bot size={28} />
    </motion.button>
  );
};

export default ChatbotFab;
