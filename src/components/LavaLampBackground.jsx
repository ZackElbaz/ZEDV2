import React from "react";
import "./LavaLampBackground.css";

const LavaLampBackground = ({ topOffset = 0, bottomOffset = 0 }) => {
  return (
    <div
      className="lava-lamp"
      style={{
        position: "absolute",
        top: `${topOffset}px`,
        bottom: `${bottomOffset}px`,
        left: 0,
        right: 0,
        zIndex: 0,
        overflow: "hidden"
      }}
    >
      <div className="lava">
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob top"></div>
        <div className="blob bottom"></div>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default LavaLampBackground;
