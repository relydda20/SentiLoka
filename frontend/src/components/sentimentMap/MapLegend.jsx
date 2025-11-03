const MapLegend = ({ className = "", title = "Sentiment Legend" }) => {
  return (
    <div className={`${className}`}>
      <h4 className="mb-3 font-semibold text-gray-900 text-sm">{title}</h4>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="bg-green-500 rounded-full w-3 h-3"></div>
          <span className="text-gray-800 text-xs">Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-yellow-500 rounded-full w-3 h-3"></div>
          <span className="text-gray-800 text-xs">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-red-500 rounded-full w-3 h-3"></div>
          <span className="text-gray-800 text-xs">Negative</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-400 rounded-full w-3 h-3"></div>
          <span className="text-gray-800 text-xs">No Data</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
