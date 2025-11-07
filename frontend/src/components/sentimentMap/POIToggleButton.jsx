import { Eye, EyeOff } from "lucide-react";
export default function POIToggleButton({
  onClick,
  poiVisible,
  textShow = "Show Places",
  textHide = "Hide Places",
  className = "",
}) {
  return (
    <div className={` ${className}`}>
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg font-medium transition-all ${
          poiVisible
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        {poiVisible ? (
          <>
            <Eye className="w-4 h-4" />
            {textHide}
          </>
        ) : (
          <>
            <EyeOff className="w-4 h-4" />
            {textShow}
          </>
        )}
      </button>
    </div>
  );
}
