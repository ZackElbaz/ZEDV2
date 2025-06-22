import React, { useMemo } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import Dither from "../components/MaintenanceBackground";
import "./UnderMaintenance.css";

function UnderMaintenance() {
  // Generate a pastel/neon color
  const randomWaveColor = useMemo(() => {
    // High saturation neon using HSV -> RGB conversion
    const hue = Math.random(); // Hue: 0 to 1
    const sat = 1.0;           // Full saturation
    const val = 1.0;           // Full brightness

    const k = (n) => (n + hue * 6) % 6;
    const f = (n) => val - val * sat * Math.max(Math.min(Math.min(k(n), 4 - k(n)), 1), 0);

    return [f(5), f(3), f(1)]; // Convert HSV to RGB
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

