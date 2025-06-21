// import React, { useRef, useEffect } from "react";
// import maplibregl from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";
// import "./OpenMap.css";

// const OpenMap = () => {
//   const mapContainerRef = useRef(null);

//   useEffect(() => {
//     const map = new maplibregl.Map({
//       container: mapContainerRef.current,
//       style: "https://api.maptiler.com/maps/toner/style.json?key=t3B5MfN7JyTEddhBUu0M",
//       center: [-1.5359, 52.2916], // [lng, lat] for Leamington Spa
//       zoom: 13,
//       scrollZoom: true,
//       dragPan: true,
//       doubleClickZoom: true,
//       touchZoomRotate: true,
//       keyboard: false,
//       attributionControl: false, // Disable default attribution
//     });

//     return () => {
//       map.remove();
//     };
//   }, []);

//   return <div ref={mapContainerRef} className="map-container" />;
// };

// export default OpenMap;


import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./OpenMap.css";

const OpenMap = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://api.maptiler.com/maps/toner/style.json?key=t3B5MfN7JyTEddhBUu0M",
      center: [-1.5359, 52.2916],
      zoom: 13,
      scrollZoom: true,
      dragPan: true,
      doubleClickZoom: true,
      touchZoomRotate: true,
      keyboard: false,
      attributionControl: false,
    });

    mapRef.current = map;

    const handleSearchLock = (e) => {
      const locked = e.detail;
      if (map) {
        if (locked) {
          map.scrollZoom.disable();
          map.dragPan.disable();
          map.doubleClickZoom.disable();
          map.touchZoomRotate.disable();
        } else {
          map.scrollZoom.enable();
          map.dragPan.enable();
          map.doubleClickZoom.enable();
          map.touchZoomRotate.enable();
        }
      }
    };

    window.addEventListener("searchbar-scroll-lock", handleSearchLock);

    return () => {
      map.remove();
      window.removeEventListener("searchbar-scroll-lock", handleSearchLock);
    };
  }, []);

  return <div ref={mapContainerRef} className="map-container" />;
};

export default OpenMap;
