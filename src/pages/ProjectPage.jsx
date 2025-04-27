// // src/pages/ProjectPage.jsx
// import React from "react";
// import { Link } from "react-router-dom";
// import HeaderBar from "../components/HeaderBar";
// import FooterBar from "../components/FooterBar";

// function ProjectPage({ title }) {
// return (
//     <div>
//       <HeaderBar />
//       <div style={{ paddingTop: "1rem" }}>
//         <h1>{title}</h1>
//         <Link to="/">Go to Home Page</Link><br />
//         <Link to="/contact">Go to Contact Page</Link><br />
//       </div>
//       <FooterBar />
//     </div>
//   );
// }
// export default ProjectPage;


// src/pages/ProjectPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";

function ProjectPage({ title }) {
  const [headerHeight, setHeaderHeight] = useState(60); // Default height
  const headerRef = useRef(null);

  // Update header height on window resize or orientation change
  const updateHeaderHeight = () => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  };

  useEffect(() => {
    // Initial calculation
    updateHeaderHeight();

    // Add event listener for resize or orientation change
    window.addEventListener("resize", updateHeaderHeight);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  return (
    <div>
      <HeaderBar ref={headerRef} />
      <div style={{ paddingTop: `${headerHeight}px` }}>
        <h1>{title}</h1>
        <Link to="/">Go to Home Page</Link><br />
        <Link to="/contact">Go to Contact Page</Link><br />
      </div>
      <FooterBar />
    </div>
  );
}

export default ProjectPage;
