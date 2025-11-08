import { motion } from "framer-motion";
import { hoverShadow } from "../../utils/motionConfig";

const DashboardSectionCard = ({ title, children, className = "" }) => {
  return (
    <motion.div
      className={`flex flex-col bg-white p-4 border border-gray-200 rounded-xl ${className}`}
      {...hoverShadow}
    >
      {title && <h2 className="mb-4 font-semibold text-lg">{title}</h2>}
      {children}
    </motion.div>
  );
};

export default DashboardSectionCard;
