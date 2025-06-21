import React, { useMemo } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import Dither from "../components/MaintenanceBackground";
import "./UnderMaintenance.css";

function UnderMaintenance() {
  // Generate a pastel/neon color
  const randomWaveColor = useMemo(() => {
    // Pastel: base RGB in [0.7, 1.0] with slight variance
    const base = 0.7 + Math.random() * 0.3;
    const hue = Math.random() * 2 * Math.PI;
    return [
      base * (0.6 + 0.4 * Math.cos(hue)),   // red component
      base * (0.6 + 0.4 * Math.cos(hue + 2)), // green
      base * (0.6 + 0.4 * Math.cos(hue + 4)), // blue
    ];
  }, []);

  return (
    <div className="Maintenance-wrapper">
      <div className="Maintenance-background">
        <Dither
          waveColor={randomWaveColor}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.38}
          waveFrequency={3.5}
          waveSpeed={0.02}
        />
      </div>

      <div className="Maintenance-foreground">
        <HeaderBar />
        <main className="Maintenance-main">
          <div className="Maintenance-message">
            Sorry, this page wasn't working how it was supposed to and is currently being fixed!
            <br />
            Please check back later for a better version, and in the meantime, enjoy the other projects!
          </div>
        </main>
        <FooterBar />
      </div>
    </div>
  );
}

export default UnderMaintenance;

