// src/pages/HomePage.jsx
import React, { useEffect, useState, useRef } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import HomePagePattern from "../components/HomePagePattern";
import HomePageProject from "../components/HomePageProject"; // <- new import
import ScrollIndicator from "../components/ScrollIndicator";
import "./HomePage.css"; // optional

function HomePage() {
  const [headerHeight, setHeaderHeight] = useState(80);
  const [footerHeight, setFooterHeight] = useState(60);

  const headerRef = useRef(null);
  const footerRef = useRef(null);

  const updateHeights = () => {
    if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
  };

  useEffect(() => {
    updateHeights();
    window.addEventListener("resize", updateHeights);

    return () => {
      window.removeEventListener("resize", updateHeights);
    };
  }, []);

  const singleSectionHeight = `calc(100vh - ${headerHeight}px - ${footerHeight}px)`;

  return (
    <div style={{ minHeight: "100vh", overflowY: "auto", position: "relative" }}>
      <HeaderBar ref={headerRef} />
      <div style={{ paddingTop: `${headerHeight}px`, position: "relative", zIndex: 0 }}>
        <div style={{ width: "100%", height: singleSectionHeight, position: "relative" }}>
          <HomePagePattern />
          <img
            src="/LogoSVG.svg"
            className="inverting-logo"
            alt="Logo Inverting"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              height: "auto",
              filter: "invert(1)",
              mixBlendMode: "difference",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        </div>
  
        {/* Project section */}
        <div style={{ width: "100%", height: singleSectionHeight, backgroundColor: "transparent" }}>
          <HomePageProject />
        </div>
  
        {/* Spacer for footer */}
        <div style={{ width: "100%", height: `${footerHeight}px` }} />
      </div>
      <FooterBar ref={footerRef} />
  
      {/* Add scroll indicator here */}
      <ScrollIndicator />
    </div>
  );
  
}

export default HomePage;
