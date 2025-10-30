import { motion } from "framer-motion";
import { hoverShadow } from "../../utils/motionConfig";

const StatCard = ({
  title,
  value,
  icon,
  footnote,
  className = "",
  footnoteClassName = "text-gray-600",
}) => {
  return (
    <motion.section
      className={`flex justify-between items-center bg-white 
        px-3 py-3 sm:px-4 sm:py-4 
        border border-gray-200 rounded-2xl ${className}`}
      {...hoverShadow}
    >
      <div className="flex flex-col flex-1 justify-center gap-1.5 sm:gap-2 min-w-0">
        {/* Title */}
        <div className="font-medium text-gray-600 text-sm sm:text-base truncate tracking-wide">
          {title}
        </div>

        {/* Value */}
        <div className="font-semibold text-black text-2xl sm:text-4xl lg:text-5xl leading-tight">
          {value}
        </div>

        {/* Footnote */}
        {footnote && (
          <div className={`text-xs sm:text-sm ${footnoteClassName}`}>
            {footnote}
          </div>
        )}
      </div>

      {/* Icon */}
      {icon && (
        <div className="ml-3 sm:ml-4 shrink-0">
          <img
            src={icon}
            alt={`${title} Icon`}
            className="w-12 sm:w-16 lg:w-20 max-w-full"
          />
        </div>
      )}
    </motion.section>
  );
};

export default StatCard;
