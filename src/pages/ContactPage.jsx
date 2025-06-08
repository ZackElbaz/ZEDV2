// import React, { useEffect, useState, useRef } from "react";
// import HeaderBar from "../components/HeaderBar";
// import FooterBar from "../components/FooterBar";
// import ScrollIndicator from "../components/ScrollIndicator";
// import OpenMap from "../components/OpenMap";
// import LavaLampBackground from "../components/LavaLampBackground";
// import "./ContactPage.css";

// function ContactPage() {
//   const headerRef = useRef(null);
//   const footerRef = useRef(null);
//   const layoutRef = useRef(null);

//   const [headerHeight, setHeaderHeight] = useState(0);
//   const [footerHeight, setFooterHeight] = useState(0);
//   const [isPortrait, setIsPortrait] = useState(window.matchMedia("(orientation: portrait)").matches);

//   const updateLayout = () => {
//     if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
//     if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
//     setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
//   };

//   useEffect(() => {
//     setTimeout(updateLayout, 50);
//     window.addEventListener("resize", updateLayout);
//     return () => window.removeEventListener("resize", updateLayout);
//   }, []);

//   const sectionHeight = window.innerHeight - headerHeight - footerHeight;

//   const sections = [
//     { id: 1, label: "About Me", className: "section-1" },
//     { id: 2, label: "Map", className: "section-2" },
//     { id: 3, label: "Message", className: "section-3" },
//   ];

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
//           overflow: "hidden"
//         }}
//       >
//         <LavaLampBackground
//           topOffset={headerHeight}
//           bottomOffset={footerHeight}
//         />
//         <div
//           ref={layoutRef}
//           className={isPortrait ? "portrait-layout" : "landscape-layout"}
//           style={{
//             height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
//             marginTop: `${headerHeight}px`
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
//                 zIndex: 1
//               }}
//             >
//               {label === "About Me" ? (
//                 <div className="contact-info">
//                   <h3 className="contact-title">Who I am:</h3>
//                   <h2>Zack El-baz</h2>
//                   <p>
//                     Application Engineer at{" "}
//                     <a
//                       href="https://www.volklec.com"
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="company-link"
//                     >
//                       Volklec
//                     </a>
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
//                 <div style={{ height: "100%", width: "100%" }}>
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
//                     boxSizing: "border-box"
//                   }}
//                 >
//                   <input
//                     type="text"
//                     name="name"
//                     placeholder="Name"
//                     required
//                     style={{
//                       width: "100%",
//                       maxWidth: "500px",
//                       padding: "10px"
//                     }}
//                   />
//                   <input
//                     type="email"
//                     name="email"
//                     placeholder="Your E-mail address"
//                     required
//                     style={{
//                       width: "100%",
//                       maxWidth: "500px",
//                       padding: "10px"
//                     }}
//                   />
//                   <textarea
//                     name="message"
//                     placeholder="Write your message here..."
//                     required
//                     style={{
//                       width: "100%",
//                       maxWidth: "500px",
//                       padding: "10px",
//                       height: "150px"
//                     }}
//                   />
//                   <button type="submit" style={{ padding: "10px 20px", fontSize: "1rem" }}>
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
  const [isPortrait, setIsPortrait] = useState(window.matchMedia("(orientation: portrait)").matches);

  const updateLayout = () => {
    if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
    setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
  };

  useEffect(() => {
    setTimeout(updateLayout, 50);
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  const sectionHeight = window.innerHeight - headerHeight - footerHeight;

  const sections = [
    { id: 1, label: "About Me", className: "section-1" },
    { id: 2, label: "Map", className: "section-2" },
    { id: 3, label: "Message", className: "section-3" },
  ];

  // Enhanced scroll snapping logic
  useEffect(() => {
    if (!isPortrait) return;

    const container = layoutRef.current;
    if (!container) return;

    let lastScrollTop = 0;
    let isSnapping = false;

    const handleScroll = () => {
      if (isSnapping) return;

      const scrollTop = container.scrollTop;
      const direction = scrollTop > lastScrollTop ? "down" : "up";
      lastScrollTop = scrollTop;

      isSnapping = true;

      const currentIndex = Math.round(scrollTop / sectionHeight);
      const nextIndex = direction === "down"
        ? Math.min(sections.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

      const targetScroll = nextIndex * sectionHeight;

      container.scrollTo({
        top: targetScroll,
        behavior: "smooth"
      });

      setTimeout(() => {
        isSnapping = false;
        lastScrollTop = container.scrollTop;
      }, 500);
    };

    const debounce = (fn, delay = 100) => {
      let timer;
      return () => {
        clearTimeout(timer);
        timer = setTimeout(fn, delay);
      };
    };

    const debouncedScroll = debounce(handleScroll, 100);
    container.addEventListener("scroll", debouncedScroll);

    return () => container.removeEventListener("scroll", debouncedScroll);
  }, [isPortrait, sectionHeight]);

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
      <div
        className="contact-content"
        style={{
          paddingBottom: `${footerHeight}px`,
          position: "relative",
          overflow: "hidden"
        }}
      >
        <LavaLampBackground
          topOffset={headerHeight}
          bottomOffset={footerHeight}
        />
        <div
          ref={layoutRef}
          className={isPortrait ? "portrait-layout" : "landscape-layout"}
          style={{
            height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
            marginTop: `${headerHeight}px`,
            overflowY: isPortrait ? "scroll" : "hidden",
            overflowX: isPortrait ? "hidden" : "scroll",
            scrollSnapType: isPortrait ? "none" : "x mandatory",
            scrollBehavior: "smooth"
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
                    Application Engineer at{" "}
                    <a
                      href="https://www.volklec.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="company-link"
                    >
                      Volklec
                    </a>
                  </p>
                  <div className="contact-links">
                    <a
                      href="https://www.linkedin.com/in/zack-el-baz"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                    <a
                      href="https://www.instagram.com/skip_the_beta"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Instagram
                    </a>
                  </div>
                </div>
              ) : label === "Map" ? (
                <div className="map-container">
                  <OpenMap
                    scrollWheelZoom={false}
                    dragging={false}
                    doubleClickZoom={false}
                    zoomControl={false}
                    touchZoom={false}
                    keyboard={false}
                  />
                </div>
              ) : label === "Message" ? (
                <form
                  className="message-form"
                  onSubmit={handleSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    width: "100%",
                    gap: "20px",
                    padding: "0 20px",
                    boxSizing: "border-box"
                  }}
                >
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    required
                    style={{
                      width: formFieldWidth,
                      maxWidth: "500px",
                      padding: "10px"
                    }}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your E-mail address"
                    required
                    style={{
                      width: formFieldWidth,
                      maxWidth: "500px",
                      padding: "10px"
                    }}
                  />
                  <textarea
                    name="message"
                    placeholder="Write your message here..."
                    required
                    style={{
                      width: formFieldWidth,
                      maxWidth: "500px",
                      padding: "10px",
                      height: "150px"
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      width: formFieldWidth,
                      maxWidth: maxFieldWidth,
                      padding: "10px 20px",
                      fontSize: "1rem",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center"
                    }}
                  >
                    Send Message
                  </button>
                </form>
              ) : (
                label
              )}
            </div>
          ))}
        </div>
      </div>
      <FooterBar ref={footerRef} />
      {isPortrait && (
        <ScrollIndicator scrollContainerRef={layoutRef} sectionHeight={sectionHeight} />
      )}
    </div>
  );
}

export default ContactPage;


