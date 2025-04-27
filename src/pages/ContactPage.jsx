import React, { useEffect, useState, useRef } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import GoogleMapComponent from "../components/GoogleMapComponent";
import "./ContactPage.css";

function ContactPage() {
  const [headerHeight, setHeaderHeight] = useState(80);
  const [footerHeight, setFooterHeight] = useState(60);
  const [isPortrait, setIsPortrait] = useState(window.matchMedia("(orientation: portrait)").matches);

  const headerRef = useRef(null);
  const footerRef = useRef(null);

  const updateHeights = () => {
    if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
  };

  const updateOrientation = () => {
    setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
  };

  useEffect(() => {
    updateHeights();
    updateOrientation();

    window.addEventListener("resize", updateHeights);
    window.addEventListener("resize", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateHeights);
      window.removeEventListener("resize", updateOrientation);
    };
  }, []);

  const portraitSectionStyle = {
    height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
  };

  const sections = [
    { id: 1, title: "Contact Info List", className: "section-1" },
    { id: 2, title: "Map", className: "section-2" },
    { id: 3, title: "Email Submission", className: "section-3" },
  ];

  return (
    <div>
      <HeaderBar ref={headerRef} />
      <div className="contact-content" style={{ paddingTop: `${headerHeight}px` }}>
        <div className={isPortrait ? "portrait-layout" : "landscape-layout"} style={isPortrait ? undefined : { height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)` }}>
          {sections.map(({ id, title, className }) => (
            <div
              key={id}
              className={`section ${className} ${isPortrait ? "" : "horizontal-section"}`}
              style={isPortrait ? portraitSectionStyle : {}}
            >
              {title === "Map" ? (
                <GoogleMapComponent />
              ) : title === "Email Submission" ? (
                <div className="email-submission">
                  <div className="input-container">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="NAME"
                    />
                  </div>
                  <div className="input-container">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="EMAIL"
                    />
                  </div>
                  <div className="input-container">
                    <textarea
                      id="message"
                      name="message"
                      placeholder="MESSAGE"
                    ></textarea>
                  </div>
                  <div className="send-container">
                    <a href="mailto:zackelbaz@gmail.com" className="send-button">
                      SEND
                    </a>
                  </div>
                </div>
              ) : (
                title
              )}
            </div>
          ))}
        </div>
        {isPortrait && <div style={{ height: `${footerHeight}px` }} />}
      </div>
      <FooterBar ref={footerRef} />
    </div>
  );
}

export default ContactPage;
