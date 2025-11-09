import { Marker } from "@react-google-maps/api";
import TooltipMarker from "./TooltipMarker";

const LocationMarker = ({
  location,
  isHovered,
  onMouseOver,
  onMouseOut,
  onLoad,
  getMarkerColor,
}) => {
  return (
    <>
      <Marker
        position={location.coordinates}
        onLoad={(marker) => {
          marker._locationId = location.id;
          onLoad?.(marker, location.id);
        }}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: getMarkerColor(location.sentiment),
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: isHovered ? 12 : 10,
        }}
      />

      {isHovered && <TooltipMarker location={location} />}
    </>
  );
};

export default LocationMarker;
