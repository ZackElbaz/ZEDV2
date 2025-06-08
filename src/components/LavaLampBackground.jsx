// import React from "react";
// import "./LavaLampBackground.css";

// const LavaLampBackground = ({ topOffset = 0, bottomOffset = 0 }) => {
//   return (
//     <div
//       className="lava-lamp"
//       style={{
//         position: "absolute",
//         top: `${topOffset}px`,
//         bottom: `${bottomOffset}px`,
//         left: 0,
//         right: 0,
//         zIndex: 0,
//         overflow: "hidden"
//       }}
//     >
//       <div className="lava">
//         <div className="blob"></div>
//         <div className="blob"></div>
//         <div className="blob"></div>
//         <div className="blob"></div>
//         <div className="blob"></div>
//         <div className="blob"></div>
//         <div className="blob"></div>
//         <div className="blob"></div>
//         <div className="blob top"></div>
//         <div className="blob bottom"></div>
//       </div>
//       <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
//         <defs>
//           <filter id="goo">
//             <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
//             <feColorMatrix
//               in="blur"
//               mode="matrix"
//               values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
//               result="goo"
//             />
//             <feBlend in="SourceGraphic" in2="goo" />
//           </filter>
//         </defs>
//       </svg>
//     </div>
//   );
// };

// export default LavaLampBackground;



import React from "react";
import "./LavaLampBackground.css";

const generateRandomBlob = (index) => {
  const size = Math.floor(Math.random() * 300) + 50; // 50px to 350px
  const leftOrRight = Math.random() > 0.5 ? "left" : "right";
  const offset = Math.floor(Math.random() * 70); // percentage
  const bottom = -Math.floor(Math.random() * 80); // -80% to 0%
  const duration = Math.floor(Math.random() * 20) + 10; // 10s to 30s
  const wobbleDuration = Math.floor(Math.random() * 6) + 4; // 4s to 10s

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    [leftOrRight]: `${offset}%`,
    bottom: `${bottom}%`,
    animation: `wobble ${wobbleDuration}s ease-in-out alternate infinite, 
                blob-move-${index} ${duration}s ease-in-out infinite`,
  };

  return style;
};
const getBlobCountFromAspectRatio = () => {
  const baseBlobs = 5;
  const stepSize = 0.5;
  const maxExtraBlobs = 7;
  const aspectRatio = window.innerWidth / window.innerHeight;

  const steps = Math.floor(aspectRatio / stepSize);
  return baseBlobs + Math.min(steps, maxExtraBlobs);
};


const generateKeyframes = (index, maxHeightPercent) => {
  const keyframes = `
    @keyframes blob-move-${index} {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-${maxHeightPercent}%); }
    }
  `;
  return keyframes;
};

const LavaLampBackground = ({ topOffset = 0, bottomOffset = 0 }) => {
  const blobCount = getBlobCountFromAspectRatio();;
  const blobs = Array.from({ length: blobCount }, (_, i) => {
    const style = generateRandomBlob(i);
    const maxTranslate = Math.floor(Math.random() * 500) + 200; // 200% to 700%
    return {
      style,
      keyframe: generateKeyframes(i, maxTranslate),
    };
  });

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
      <style>
        {blobs.map((b) => b.keyframe).join("\n")}
      </style>
      <div className="lava">
        {blobs.map((blob, i) => (
          <div className="blob" key={i} style={blob.style}></div>
        ))}
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
