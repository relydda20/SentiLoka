import { Marker } from "@react-google-maps/api";

const SelectedMarker = ({
  position,
  fillColor = "#3b82f6",
  fillOpacity = 0.8,
  strokeColor = "#ffffff",
  strokeWeight = 3,
  scale = 14,
  animated = true,
}) => {
  return (
    <Marker
      position={position}
      icon={{
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor,
        fillOpacity,
        strokeColor,
        strokeWeight,
        scale,
      }}
      animation={animated ? window.google.maps.Animation.BOUNCE : null}
    />
  );
};

export default SelectedMarker;
