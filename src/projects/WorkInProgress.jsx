// import React, { useRef } from "react";
// import HeaderBar from "../components/HeaderBar";
// import FooterBar from "../components/FooterBar";
// import "./WorkInProgress.css";

// function WorkInProgress() {
//   const headerRef = useRef(null);
//   const footerRef = useRef(null);

//   return (
//     <div className="wip-container">
//       <HeaderBar ref={headerRef} />
//       <main className="wip-main">
//         <div className="wip-message">
//           Sorry, this page is currently under construction!<br />
//           Please check back later for more content.
//         </div>
//       </main>
//       <FooterBar ref={footerRef} />
//     </div>
//   );
// }

// export default WorkInProgress;


import React, { useRef } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import WorkInProgressBackground from "../components/WorkInProgressBackground"; // updated name
import "./WorkInProgress.css";

function WorkInProgress() {
  const headerRef = useRef(null);
  const footerRef = useRef(null);

  return (
    <div className="wip-container">
      <WorkInProgressBackground />
      <HeaderBar ref={headerRef} />
      <main className="wip-main">
        <div className="wip-message">
          Sorry, this page is currently under construction!<br />
          Please check back later for more content.
        </div>
      </main>
      <FooterBar ref={footerRef} />
    </div>
  );
}

export default WorkInProgress;
