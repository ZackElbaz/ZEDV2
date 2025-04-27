import React from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 52.2901, // Latitude for Leamington Spa
  lng: -1.5357, // Longitude for Leamington Spa
};

function GoogleMapComponent() {
  return (
    <LoadScript googleMapsApiKey="YOUR_API_KEY">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
      >
        {/* Optional: add markers or other map features here */}
      </GoogleMap>
    </LoadScript>
  );
}

export default GoogleMapComponent;
