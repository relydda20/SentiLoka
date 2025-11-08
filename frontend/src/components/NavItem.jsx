import { motion } from "framer-motion";
import {
  hoverLift,
  fadeInScale,
  springTransition,
} from "../utils/motionConfig";

const NavItem = ({ children, active }) => (
  <motion.div className="relative px-9 py-5" {...hoverLift}>
    <span className="relative pointer-events-none">{children}</span>
    {active && (
      <motion.div
        className="right-9 bottom-3 left-9 absolute bg-[#CCD5AE] h-0.5 pointer-events-none"
        layoutId="underline"
        initial={false}
        transition={{ ...springTransition, damping: 30 }}
      />
    )}
    <motion.div
      className="absolute inset-0 bg-white/10 rounded-lg pointer-events-none"
      {...fadeInScale}
    />
  </motion.div>
);

export default NavItem;
