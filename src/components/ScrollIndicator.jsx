import React, { useEffect, useState } from 'react';
import './ScrollIndicator.css';

const ScrollIndicator = () => {
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const checkScroll = () => {
    const scrollTop = window.scrollY;
    const scrollBottom = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    setCanScrollDown(scrollBottom < pageHeight - 5);
    setCanScrollUp(scrollTop > 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  return (
    <>
      {canScrollDown && (
        <div className="scroll-indicator down">
          <img
            src="/Arrow2.svg"
            alt="Scroll Down"
            className="scroll-arrow down-arrow"
          />
        </div>
      )}
      {canScrollUp && (
        <div className="scroll-indicator up">
          <img
            src="/Arrow2.svg"
            alt="Scroll Up"
            className="scroll-arrow up-arrow"
          />
        </div>
      )}
    </>
  );
};

export default ScrollIndicator;
