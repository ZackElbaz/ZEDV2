// // src/pages/HomePage.jsx
// import React, { useEffect, useRef, useState } from "react";
// import HeaderBar from "../components/HeaderBar";
// import FooterBar from "../components/FooterBar";
// import HomePagePattern from "../components/HomePagePattern";
// import HomePageProject from "../components/HomePageProject";
// import ScrollIndicator from "../components/ScrollIndicator";
// import "./HomePage.css";

// function HomePage() {
//   const [headerHeight, setHeaderHeight] = useState(80);
//   const [footerHeight, setFooterHeight] = useState(60);

//   const headerRef = useRef(null);
//   const footerRef = useRef(null);
//   const scrollContainerRef = useRef(null);
//   const isScrolling = useRef(false);
//   const currentSection = useRef(0);

//   const sectionRefs = [useRef(null), useRef(null)];
//   const touchStartY = useRef(null);
//   const touchStartTime = useRef(null);

//   const lockScroll = () => {
//     document.body.classList.add("scroll-lock");
//     window.addEventListener("wheel", blockScroll, { passive: false });
//     window.addEventListener("touchmove", blockScroll, { passive: false });
//   };

//   const unlockScroll = () => {
//     document.body.classList.remove("scroll-lock");
//     window.removeEventListener("wheel", blockScroll);
//     window.removeEventListener("touchmove", blockScroll);
//   };

//   const blockScroll = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     return false;
//   };

//   const updateHeights = () => {
//     if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
//     if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
//   };

//   useEffect(() => {
//     updateHeights();
//     window.addEventListener("resize", updateHeights);
//     return () => window.removeEventListener("resize", updateHeights);
//   }, []);

//   useEffect(() => {
//     scrollToSection(0); // Default to first section on load
//   }, [headerHeight, footerHeight]);

//   useEffect(() => {
//     const container = scrollContainerRef.current;
//     if (!container) return;
//     container.addEventListener("touchmove", handleTouchMove, { passive: false });
//     return () => container.removeEventListener("touchmove", handleTouchMove);
//   }, []);

//   const handleTouchStart = (e) => {
//     if (e.touches.length > 1) return; // Ignore multi-touch
//     touchStartY.current = e.touches[0].clientY;
//     touchStartTime.current = Date.now();
//   };

//   const handleTouchMove = (e) => {
//     e.preventDefault();
//   };

//   const handleTouchEnd = (e) => {
//     if (e.changedTouches.length > 1) return;
//     const touchEndY = e.changedTouches[0].clientY;
//     const deltaY = touchEndY - touchStartY.current;
//     const deltaTime = Date.now() - touchStartTime.current;

//     const velocity = Math.abs(deltaY / deltaTime); // px per ms

//     if (velocity > 0.3 || Math.abs(deltaY) > 80) {
//       if (deltaY < 0 && currentSection.current === 0) {
//         scrollToSection(1);
//       } else if (deltaY > 0 && currentSection.current === 1) {
//         scrollToSection(0);
//       } else {
//         scrollToSection(currentSection.current);
//       }
//     } else {
//       scrollToSection(currentSection.current); // Snap back if insufficient swipe
//     }
//   };

//   const handleWheel = (e) => {
//     e.preventDefault();
//     if (isScrolling.current) return;

//     if (e.deltaY > 0 && currentSection.current === 0) {
//       scrollToSection(1);
//     } else if (e.deltaY < 0 && currentSection.current === 1) {
//       scrollToSection(0);
//     }
//   };

//   const scrollToSection = (index) => {
//     if (isScrolling.current || index === currentSection.current) return;
//     isScrolling.current = true;
//     lockScroll();

//     const ref = sectionRefs[index];
//     if (ref.current) {
//       const scrollTop =
//         index === 0
//           ? ref.current.offsetTop - headerHeight
//           : ref.current.offsetTop - (window.innerHeight - footerHeight - ref.current.offsetHeight);
//       window.scrollTo({ top: scrollTop, behavior: "smooth" });
//       currentSection.current = index;
//     }

//     setTimeout(() => {
//       isScrolling.current = false;
//       unlockScroll();
//       window.scrollTo({
//         top:
//           index === 0
//             ? sectionRefs[0].current.offsetTop - headerHeight
//             : sectionRefs[1].current.offsetTop - (window.innerHeight - footerHeight - sectionRefs[1].current.offsetHeight),
//         behavior: "auto",
//       });
//     }, 900);
//   };

//   return (
//     <div
//       ref={scrollContainerRef}
//       style={{ minHeight: "100vh", overflow: "hidden", scrollBehavior: "smooth" }}
//       onTouchStart={handleTouchStart}
//       onTouchEnd={handleTouchEnd}
//       onWheel={handleWheel}
//     >
//       <HeaderBar ref={headerRef} />

//       <div style={{ position: "relative", zIndex: 0 }}>
//         <div
//           ref={sectionRefs[0]}
//           style={{
//             width: "100%",
//             height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
//             paddingTop: `${headerHeight}px`,
//             position: "relative",
//           }}
//         >
//           <HomePagePattern />
//           <img
//             src={process.env.PUBLIC_URL + "/LogoSVG.svg"}
//             className="inverting-logo"
//             alt="Logo Inverting"
//             style={{
//               position: "absolute",
//               top: "50%",
//               left: "50%",
//               transform: "translate(-50%, -50%)",
//               width: "90%",
//               height: "auto",
//               maxHeight: "60%",
//               filter: "invert(1)",
//               mixBlendMode: "difference",
//               pointerEvents: "none",
//               zIndex: 10,
//             }}
//           />
//         </div>

//         <div
//           ref={sectionRefs[1]}
//           style={{
//             width: "100%",
//             height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
//             paddingBottom: `${footerHeight}px`,
//             backgroundColor: "transparent",
//           }}
//         >
//           <HomePageProject />
//         </div>
//       </div>

//       <FooterBar ref={footerRef} />
//       <ScrollIndicator publicUrl={process.env.PUBLIC_URL} />
//     </div>
//   );
// }

// export default HomePage;















import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import HomePagePattern from "../components/HomePagePattern";
import HomePageProject from "../components/HomePageProject";
import ScrollIndicator from "../components/ScrollIndicator";
import "./HomePage.css";

function HomePage() {
  const [headerHeight, setHeaderHeight] = useState(80);
  const [footerHeight, setFooterHeight] = useState(60);

  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isScrolling = useRef(false);
  const currentSection = useRef(0);

  const sectionRefs = [useRef(null), useRef(null)];
  const touchStartY = useRef(null);
  const touchStartTime = useRef(null);

  const searchBarScrollLocked = useRef(false); // 🔒

  useEffect(() => {
    const updateHeights = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
      if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
    };

    updateHeights();
    window.addEventListener("resize", updateHeights);
    return () => window.removeEventListener("resize", updateHeights);
  }, []);

  useEffect(() => {
    scrollToSection(0);
  }, [headerHeight, footerHeight]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => container.removeEventListener("touchmove", handleTouchMove);
  }, []);

  useEffect(() => {
    const handleLock = (e) => {
      searchBarScrollLocked.current = e.detail;
    };
    window.addEventListener("searchbar-scroll-lock", handleLock);
    return () => window.removeEventListener("searchbar-scroll-lock", handleLock);
  }, []);

  const lockScroll = () => {
    document.body.classList.add("scroll-lock");
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });
  };

  const unlockScroll = () => {
    document.body.classList.remove("scroll-lock");
    window.removeEventListener("wheel", blockScroll);
    window.removeEventListener("touchmove", blockScroll);
  };

  const blockScroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const handleTouchStart = (e) => {
    if (searchBarScrollLocked.current) return; // 🔒
    if (e.touches.length > 1) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e) => {
    if (searchBarScrollLocked.current) return; // 🔒
    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    if (searchBarScrollLocked.current) return; // 🔒
    if (e.changedTouches.length > 1) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = Math.abs(deltaY / deltaTime);

    if (velocity > 0.3 || Math.abs(deltaY) > 80) {
      if (deltaY < 0 && currentSection.current === 0) {
        scrollToSection(1);
      } else if (deltaY > 0 && currentSection.current === 1) {
        scrollToSection(0);
      }
    } else {
      scrollToSection(currentSection.current);
    }
  };

  const handleWheel = (e) => {
    if (searchBarScrollLocked.current) return; // 🔒
    e.preventDefault();
    if (isScrolling.current) return;

    if (e.deltaY > 0 && currentSection.current === 0) {
      scrollToSection(1);
    } else if (e.deltaY < 0 && currentSection.current === 1) {
      scrollToSection(0);
    }
  };

  const scrollToSection = (index) => {
    if (isScrolling.current || index === currentSection.current) return;
    isScrolling.current = true;
    lockScroll();

    const ref = sectionRefs[index];
    if (ref.current) {
      const scrollTop =
        index === 0
          ? ref.current.offsetTop - headerHeight
          : ref.current.offsetTop -
            (window.innerHeight - footerHeight - ref.current.offsetHeight);
      window.scrollTo({ top: scrollTop, behavior: "smooth" });
      currentSection.current = index;
    }

    setTimeout(() => {
      isScrolling.current = false;
      unlockScroll();
      window.scrollTo({
        top:
          index === 0
            ? sectionRefs[0].current.offsetTop - headerHeight
            : sectionRefs[1].current.offsetTop -
              (window.innerHeight - footerHeight - sectionRefs[1].current.offsetHeight),
        behavior: "auto",
      });
    }, 900);
  };

  return (
    <div
      ref={scrollContainerRef}
      style={{ minHeight: "100vh", overflow: "hidden", scrollBehavior: "smooth" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <HeaderBar ref={headerRef} />

      <div style={{ position: "relative", zIndex: 0 }}>
        <div
          ref={sectionRefs[0]}
          style={{
            width: "100%",
            height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
            paddingTop: `${headerHeight}px`,
            position: "relative",
          }}
        >
          <HomePagePattern />
          <img
            src={process.env.PUBLIC_URL + "/LogoSVG.svg"}
            className="inverting-logo"
            alt="Logo Inverting"
            style={{
              position: "absolute",
              top: "55%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              height: "auto",
              maxHeight: "60%",
              filter: "invert(1)",
              mixBlendMode: "difference",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        </div>

        <div
          ref={sectionRefs[1]}
          style={{
            width: "100%",
            height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
            paddingBottom: `${footerHeight}px`,
            backgroundColor: "transparent",
          }}
        >
          <HomePageProject />
        </div>
      </div>

      <FooterBar ref={footerRef} />
      <ScrollIndicator publicUrl={process.env.PUBLIC_URL} />
    </div>
  );
}

export default HomePage;

// npm run build && npm run deploy

// git add . && git commit -m "Glyphs are Introduced!" && git push origin main && npm run build && npm run deploy

