import { motion } from "framer-motion";
import { hoverScaleTap } from "../utils/motionConfig";

const DropdownItem = ({ children, onClick, className }) => (
  <motion.button
    onClick={onClick}
    className={`px-6 py-3 w-full font-semibold text-left transition-colors ${className}`}
    {...hoverScaleTap}
  >
    {children}
  </motion.button>
);

export default DropdownItem;
