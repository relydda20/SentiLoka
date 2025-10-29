import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const center = { lat: -6.2088, lng: 106.8456 }; // Jakarta

const locations = [
  { lat: -6.2088, lng: 106.8456, title: "Jakarta" },
  { lat: -6.9147, lng: 107.6098, title: "Bandung" },
  { lat: -7.2504, lng: 112.7688, title: "Surabaya" },
];

const SentimentMap = () => {
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={6}>
        {locations.map((loc, index) => (
          <Marker
            key={index}
            position={{ lat: loc.lat, lng: loc.lng }}
            title={loc.title}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default SentimentMap;
