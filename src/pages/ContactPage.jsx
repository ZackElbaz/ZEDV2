// import React, { useEffect, useState, useRef } from "react";
// import HeaderBar from "../components/HeaderBar";
// import FooterBar from "../components/FooterBar";
// import ScrollIndicator from "../components/ScrollIndicator";
// import OpenMap from "../components/OpenMap";
// import LavaLampBackground from "../components/LavaLampBackground";
// import "./ContactPage.css";

// function ContactPage() {
//   const formFieldWidth = "60%";
//   const maxFieldWidth = "500px";

//   const headerRef = useRef(null);
//   const footerRef = useRef(null);
//   const layoutRef = useRef(null);

//   const [headerHeight, setHeaderHeight] = useState(0);
//   const [footerHeight, setFooterHeight] = useState(0);
//   const [sectionHeight, setSectionHeight] = useState(0);
//   const [isPortrait, setIsPortrait] = useState(
//     window.matchMedia("(orientation: portrait)").matches
//   );

//   useEffect(() => {
//     // Generate random muted neon color
//     const getRandomVibrantNeonColor = () => {
//       const hue = Math.floor(Math.random() * 360);       // full rainbow
//       const saturation = 100;                            // max color intensity
//       const lightness = 50 + Math.random() * 10;         // 50–60% = vibrant

//       const hslToHex = (h, s, l) => {
//         s /= 100;
//         l /= 100;
//         const k = n => (n + h / 30) % 12;
//         const a = s * Math.min(l, 1 - l);
//         const f = n =>
//           Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
//         return `#${[f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, "0")).join("")}`;
//       };

//       return hslToHex(hue, saturation, lightness);
//     };



//     // Invert hex color
//     const invertHexColor = (hex) => {
//       const cleanHex = hex.replace("#", "").padStart(6, "0");
//       const r = 255 - parseInt(cleanHex.slice(0, 2), 16);
//       const g = 255 - parseInt(cleanHex.slice(2, 4), 16);
//       const b = 255 - parseInt(cleanHex.slice(4, 6), 16);
//       const toHex = (n) => n.toString(16).padStart(2, "0");
//       return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
//     };

//     const blobColor = getRandomVibrantNeonColor();
//     const inverseColor = invertHexColor(blobColor);

//     const root = document.documentElement;
//     root.style.setProperty("--blob-color", blobColor);
//     root.style.setProperty("--hover-highlight", inverseColor);
//   }, []);

//   const updateLayout = () => {
//     if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
//     if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
//     if (layoutRef.current) setSectionHeight(layoutRef.current.offsetHeight);
//     setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
//   };

//   useEffect(() => {
//     updateLayout();

//     const observer = new ResizeObserver(() => {
//       updateLayout();
//     });

//     if (layoutRef.current) observer.observe(layoutRef.current);
//     if (headerRef.current) observer.observe(headerRef.current);
//     if (footerRef.current) observer.observe(footerRef.current);

//     window.addEventListener("load", updateLayout);
//     window.addEventListener("resize", updateLayout);

//     const forceScrollEvent = () => {
//       const container = layoutRef.current;
//       if (container) container.dispatchEvent(new Event("scroll"));
//     };

//     const scrollTriggerTimeout = setTimeout(forceScrollEvent, 100);

//     return () => {
//       window.removeEventListener("load", updateLayout);
//       window.removeEventListener("resize", updateLayout);
//       observer.disconnect();
//       clearTimeout(scrollTriggerTimeout);
//     };
//   }, []);

//   const sections = [
//     { id: 1, label: "About Me", className: "section-1" },
//     { id: 2, label: "Map", className: "section-2" },
//     { id: 3, label: "Message", className: "section-3" },
//   ];

//   useEffect(() => {
//     if (!isPortrait || sectionHeight === 0) return;

//     const container = layoutRef.current;
//     if (!container) return;

//     let currentIndex = 0;
//     let touchStartY = 0;
//     let isSnapping = false;
//     let isTouchingMap = false;

//     const scrollToSection = (index) => {
//       isSnapping = true;
//       const clampedIndex = Math.max(0, Math.min(sections.length - 1, index));
//       currentIndex = clampedIndex;
//       const targetOffset = clampedIndex * sectionHeight;

//       container.scrollTo({
//         top: targetOffset,
//         behavior: "smooth",
//       });

//       const checkScrollSettled = () => {
//         const distance = Math.abs(container.scrollTop - targetOffset);
//         if (distance < 2) {
//           isSnapping = false;
//         } else {
//           requestAnimationFrame(checkScrollSettled);
//         }
//       };
//       requestAnimationFrame(checkScrollSettled);
//     };

//     const handleTouchStart = (e) => {
//       const target = e.target;
//       isTouchingMap = !!target.closest(".map-container"); // Check if touching inside the map
//       if (isTouchingMap) return;

//       touchStartY = e.touches[0].clientY;
//       currentIndex = Math.round(container.scrollTop / sectionHeight);
//     };


//     const handleTouchMove = (e) => {
//       if (isTouchingMap) return; // Allow native touch handling in map
//       e.preventDefault();
//     };


//     const handleTouchEnd = (e) => {
//       if (isTouchingMap || isSnapping) return;

//       const touchEndY = e.changedTouches[0].clientY;
//       const deltaY = touchStartY - touchEndY;
//       if (Math.abs(deltaY) < 30) return;

//       if (deltaY > 0 && currentIndex < sections.length - 1) {
//         scrollToSection(currentIndex + 1);
//       } else if (deltaY < 0 && currentIndex > 0) {
//         scrollToSection(currentIndex - 1);
//       }
//     };


//     container.addEventListener("touchstart", handleTouchStart, { passive: true });
//     container.addEventListener("touchmove", handleTouchMove, { passive: false });
//     container.addEventListener("touchend", handleTouchEnd, { passive: true });

//     return () => {
//       container.removeEventListener("touchstart", handleTouchStart);
//       container.removeEventListener("touchmove", handleTouchMove);
//       container.removeEventListener("touchend", handleTouchEnd);
//     };
//   }, [isPortrait, sectionHeight, sections.length]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const name = e.target.name.value;
//     const email = e.target.email.value;
//     const message = e.target.message.value;
//     const mailto = `mailto:zackelbaz@gmail.com?subject=Message from ${name}&body=Email: ${email}%0D%0A%0D%0A${message}`;
//     window.location.href = mailto;
//   };

//   return (
//     <div className="page-container">
//       <HeaderBar ref={headerRef} />
//       <div
//         className="contact-content"
//         style={{
//           paddingBottom: `${footerHeight}px`,
//           position: "relative",
//           overflow: "hidden",
//         }}
//       >
//         <LavaLampBackground topOffset={headerHeight} bottomOffset={footerHeight} />
//         <div
//           ref={layoutRef}
//           className={isPortrait ? "portrait-layout" : "landscape-layout"}
//           style={{
//             height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
//             marginTop: `${headerHeight}px`,
//             overflowY: isPortrait ? "hidden" : "hidden",
//             overflowX: isPortrait ? "hidden" : "scroll",
//             scrollSnapType: isPortrait ? "none" : "x mandatory",
//             scrollBehavior: "smooth",
//             WebkitOverflowScrolling: "touch",
//             touchAction: "none",
//           }}
//         >
//           {sections.map(({ id, label, className }) => (
//             <div
//               key={id}
//               className={`section ${className} ${!isPortrait ? "horizontal-section" : ""}`}
//               style={{
//                 height: `${sectionHeight}px`,
//                 minHeight: `${sectionHeight}px`,
//                 width: !isPortrait ? `${100 / sections.length}%` : "100%",
//                 flexShrink: 0,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 backgroundColor: "transparent",
//                 position: "relative",
//                 zIndex: 1,
//                 scrollSnapAlign: "start",
//               }}
//             >
//               {label === "About Me" ? (
//                 <div className="contact-info">
//                   <h3 className="contact-title">Who I am:</h3>
//                   <h2>Zack El-baz</h2>
//                   <p>
//                     Design Engineer
//                     <br />
//                     [MEng-Mechanical Engineering]
//                     {/* Application Engineer at{" "}
//                     <a
//                       href="https://www.volklec.com"
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="company-link"
//                     >
//                       Volklec
//                     </a> */}
//                   </p>
//                   <div className="contact-links">
//                     <a
//                       href="https://www.linkedin.com/in/zack-el-baz"
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       LinkedIn
//                     </a>
//                     <a
//                       href="https://www.instagram.com/skip_the_beta"
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       Instagram
//                     </a>
//                   </div>
//                 </div>
//               ) : label === "Map" ? (
//                 <div className="map-container">
//                   <OpenMap
//                     scrollWheelZoom={false}
//                     dragging={false}
//                     doubleClickZoom={false}
//                     zoomControl={false}
//                     touchZoom={false}
//                     keyboard={false}
//                   />
//                 </div>
//               ) : label === "Message" ? (
//                 <form
//                   className="message-form"
//                   onSubmit={handleSubmit}
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     justifyContent: "center",
//                     alignItems: "center",
//                     height: "100%",
//                     width: "100%",
//                     gap: "20px",
//                     padding: "0 20px",
//                     boxSizing: "border-box",
//                   }}
//                 >
//                   <input
//                     type="text"
//                     name="name"
//                     placeholder="Name"
//                     required
//                     style={{ width: formFieldWidth, maxWidth: maxFieldWidth, padding: "10px" }}
//                   />
//                   <input
//                     type="email"
//                     name="email"
//                     placeholder="Your E-mail address"
//                     required
//                     style={{ width: formFieldWidth, maxWidth: maxFieldWidth, padding: "10px" }}
//                   />
//                   <textarea
//                     name="message"
//                     placeholder="Write your message here..."
//                     required
//                     style={{
//                       width: formFieldWidth,
//                       maxWidth: maxFieldWidth,
//                       padding: "10px",
//                       height: "150px",
//                     }}
//                   />
//                   <button
//                     type="submit"
//                     style={{
//                       width: formFieldWidth,
//                       maxWidth: maxFieldWidth,
//                       padding: "10px 20px",
//                       fontSize: "1rem",
//                       display: "flex",
//                       justifyContent: "center",
//                       alignItems: "center",
//                       textAlign: "center",
//                     }}
//                   >
//                     Send Message
//                   </button>
//                 </form>
//               ) : (
//                 label
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//       <FooterBar ref={footerRef} />
//       {isPortrait && (
//         <ScrollIndicator scrollContainerRef={layoutRef} sectionHeight={sectionHeight} />
//       )}
//     </div>
//   );
// }

// export default ContactPage;



import React, { useEffect, useState, useRef } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import ScrollIndicator from "../components/ScrollIndicator";
import OpenMap from "../components/OpenMap";
import LavaLampBackground from "../components/LavaLampBackground";
import "./ContactPage.css";

function ContactPage() {
  const formFieldWidth = "60%";
  const maxFieldWidth = "500px";

  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const layoutRef = useRef(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [sectionHeight, setSectionHeight] = useState(0);
  const [isPortrait, setIsPortrait] = useState(
    window.matchMedia("(orientation: portrait)").matches
  );

  const searchBarScrollLocked = useRef(false);

  useEffect(() => {
    const handleLock = (e) => {
      searchBarScrollLocked.current = e.detail;
    };
    window.addEventListener("searchbar-scroll-lock", handleLock);
    return () => window.removeEventListener("searchbar-scroll-lock", handleLock);
  }, []);

  useEffect(() => {
    const getRandomVibrantNeonColor = () => {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 100;
      const lightness = 50 + Math.random() * 10;

      const hslToHex = (h, s, l) => {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n =>
          Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
        return `#${[f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, "0")).join("")}`;
      };

      return hslToHex(hue, saturation, lightness);
    };

    const invertHexColor = (hex) => {
      const cleanHex = hex.replace("#", "").padStart(6, "0");
      const r = 255 - parseInt(cleanHex.slice(0, 2), 16);
      const g = 255 - parseInt(cleanHex.slice(2, 4), 16);
      const b = 255 - parseInt(cleanHex.slice(4, 6), 16);
      const toHex = (n) => n.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const blobColor = getRandomVibrantNeonColor();
    const inverseColor = invertHexColor(blobColor);

    const root = document.documentElement;
    root.style.setProperty("--blob-color", blobColor);
    root.style.setProperty("--hover-highlight", inverseColor);
  }, []);

  const updateLayout = () => {
    if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
    if (layoutRef.current) setSectionHeight(layoutRef.current.offsetHeight);
    setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
  };

  useEffect(() => {
    updateLayout();

    const observer = new ResizeObserver(updateLayout);
    if (layoutRef.current) observer.observe(layoutRef.current);
    if (headerRef.current) observer.observe(headerRef.current);
    if (footerRef.current) observer.observe(footerRef.current);

    window.addEventListener("load", updateLayout);
    window.addEventListener("resize", updateLayout);

    const scrollTriggerTimeout = setTimeout(() => {
      layoutRef.current?.dispatchEvent(new Event("scroll"));
    }, 100);

    return () => {
      window.removeEventListener("load", updateLayout);
      window.removeEventListener("resize", updateLayout);
      observer.disconnect();
      clearTimeout(scrollTriggerTimeout);
    };
  }, []);

  const sections = [
    { id: 1, label: "About Me", className: "section-1" },
    { id: 2, label: "Map", className: "section-2" },
    { id: 3, label: "Message", className: "section-3" },
  ];

  useEffect(() => {
    if (!isPortrait || sectionHeight === 0) return;

    const container = layoutRef.current;
    if (!container) return;

    let currentIndex = 0;
    let touchStartY = 0;
    let isSnapping = false;
    let isTouchingMap = false;

    const scrollToSection = (index) => {
      isSnapping = true;
      const clampedIndex = Math.max(0, Math.min(sections.length - 1, index));
      currentIndex = clampedIndex;
      const targetOffset = clampedIndex * sectionHeight;
      container.scrollTo({ top: targetOffset, behavior: "smooth" });

      const checkScrollSettled = () => {
        const distance = Math.abs(container.scrollTop - targetOffset);
        if (distance < 2) {
          isSnapping = false;
        } else {
          requestAnimationFrame(checkScrollSettled);
        }
      };
      requestAnimationFrame(checkScrollSettled);
    };

    const handleTouchStart = (e) => {
      if (searchBarScrollLocked.current) return;
      const target = e.target;
      isTouchingMap = !!target.closest(".map-container");
      if (isTouchingMap) return;
      touchStartY = e.touches[0].clientY;
      currentIndex = Math.round(container.scrollTop / sectionHeight);
    };

    const handleTouchMove = (e) => {
      if (searchBarScrollLocked.current || isTouchingMap) return;
      e.preventDefault();
    };

    const handleTouchEnd = (e) => {
      if (searchBarScrollLocked.current || isTouchingMap || isSnapping) return;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      if (Math.abs(deltaY) < 30) return;
      if (deltaY > 0 && currentIndex < sections.length - 1) {
        scrollToSection(currentIndex + 1);
      } else if (deltaY < 0 && currentIndex > 0) {
        scrollToSection(currentIndex - 1);
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPortrait, sectionHeight, sections.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const message = e.target.message.value;
    const mailto = `mailto:zackelbaz@gmail.com?subject=Message from ${name}&body=Email: ${email}%0D%0A%0D%0A${message}`;
    window.location.href = mailto;
  };

  return (
    <div className="page-container">
      <HeaderBar ref={headerRef} />
      <div className="contact-content" style={{ paddingBottom: `${footerHeight}px`, position: "relative", overflow: "hidden" }}>
        <LavaLampBackground topOffset={headerHeight} bottomOffset={footerHeight} />
        <div
          ref={layoutRef}
          className={isPortrait ? "portrait-layout" : "landscape-layout"}
          style={{
            height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
            marginTop: `${headerHeight}px`,
            overflowY: isPortrait ? "hidden" : "hidden",
            overflowX: isPortrait ? "hidden" : "scroll",
            scrollSnapType: isPortrait ? "none" : "x mandatory",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            touchAction: "none",
          }}
        >
          {sections.map(({ id, label, className }) => (
            <div
              key={id}
              className={`section ${className} ${!isPortrait ? "horizontal-section" : ""}`}
              style={{
                height: `${sectionHeight}px`,
                minHeight: `${sectionHeight}px`,
                width: !isPortrait ? `${100 / sections.length}%` : "100%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
                position: "relative",
                zIndex: 1,
                scrollSnapAlign: "start",
              }}
            >
              {label === "About Me" ? (
                <div className="contact-info">
                  <h3 className="contact-title">Who I am:</h3>
                  <h2>Zack El-baz</h2>
                  <p>
                    Design Engineer<br />
                    [MEng-Mechanical Engineering]
                  </p>
                  <div className="contact-links">
                    <a href="https://www.linkedin.com/in/zack-el-baz" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    <a href="https://www.instagram.com/skip_the_beta" target="_blank" rel="noopener noreferrer">Instagram</a>
                  </div>
                </div>
              ) : label === "Map" ? (
                <div className="map-container">
                  <OpenMap scrollWheelZoom={false} dragging={false} doubleClickZoom={false} zoomControl={false} touchZoom={false} keyboard={false} />
                </div>
              ) : label === "Message" ? (
                <form
                  className="message-form"
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", width: "100%", gap: "20px", padding: "0 20px", boxSizing: "border-box" }}
                >
                  <input type="text" name="name" placeholder="Name" required style={{ width: formFieldWidth, maxWidth: maxFieldWidth, padding: "10px" }} />
                  <input type="email" name="email" placeholder="Your E-mail address" required style={{ width: formFieldWidth, maxWidth: maxFieldWidth, padding: "10px" }} />
                  <textarea name="message" placeholder="Write your message here..." required style={{ width: formFieldWidth, maxWidth: maxFieldWidth, padding: "10px", height: "150px" }} />
                  <button type="submit" style={{ width: formFieldWidth, maxWidth: maxFieldWidth, padding: "10px 20px", fontSize: "1rem", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                    Send Message
                  </button>
                </form>
              ) : label}
            </div>
          ))}
        </div>
      </div>
      <FooterBar ref={footerRef} />
      {isPortrait && <ScrollIndicator scrollContainerRef={layoutRef} sectionHeight={sectionHeight} />}
    </div>
  );
}

export default ContactPage;
