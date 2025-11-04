import { InfoWindow } from "@react-google-maps/api";
import { Star } from "lucide-react";

const TooltipMarker = ({ location, pixelOffset = -70 }) => {
  return (
    <InfoWindow
      position={location.coordinates}
      options={{
        disableAutoPan: true,
        headerDisabled: true,
        maxWidth: 200,
        pixelOffset: new window.google.maps.Size(0, pixelOffset),
      }}
    >
      <div className="p-2 max-w-xs">
        <p className="mb-1 font-semibold text-gray-900 text-sm truncate">
          {location.businessName}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <Star className="fill-yellow-400 w-3 h-3 text-yellow-400" />
          <span>{location.averageRating || "N/A"}</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-600">
            {location.reviewsCount || 0} reviews
          </span>
        </div>
      </div>
    </InfoWindow>
  );
};

export default TooltipMarker;
