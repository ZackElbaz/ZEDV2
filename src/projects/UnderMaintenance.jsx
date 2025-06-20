import React, { useRef } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import "./UnderMaintenance.css";

function UnderMaintenance() {
  const headerRef = useRef(null);
  const footerRef = useRef(null);

  return (
    <div className="Maintenance-container">
      <HeaderBar ref={headerRef} />
      <main className="Maintenance-main">
        <div className="Maintenance-message">
          Sorry, this page wasn't working how it was supposed to and is currently being fixed!<br />
          Please check back later for a better version, and in the meantime, enjoy the other projects!
        </div>
      </main>
      <FooterBar ref={footerRef} />
    </div>
  );
}

export default UnderMaintenance;
