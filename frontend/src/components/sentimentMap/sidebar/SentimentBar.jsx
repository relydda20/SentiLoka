import { motion } from "framer-motion";

const SentimentBar = ({ label, count, percentage, color }) => {
  const colorClasses = {
    green: "bg-green-500",
    gray: "bg-gray-400",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  const textColorClasses = {
    green: "text-green-600",
    gray: "text-gray-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="text-[#42676B]">{label}</span>
        <span className={`font-medium ${textColorClasses[color]}`}>
          {count} ({percentage?.toFixed(1) || 0}%)
        </span>
      </div>
      <div className="relative bg-[#E1E6C3] rounded-full w-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage || 0, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${colorClasses[color]} h-2 rounded-full`}
        ></motion.div>
      </div>
    </div>
  );
};

export default SentimentBar;
