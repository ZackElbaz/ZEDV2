import React, { useEffect, useState } from 'react';
import './ScrollIndicator.css';

const ScrollIndicator = ({ scrollContainerRef = null, sectionHeight = null }) => {
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const debounce = (func, wait = 100) => {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait);
    };
  };

  const checkScroll = () => {
    const el = scrollContainerRef?.current;
    if (el) {
      setCanScrollUp(el.scrollTop > 5);
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 5);
    } else {
      const scrollTop = window.scrollY || window.pageYOffset;
      const scrollBottom = scrollTop + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;

      setCanScrollDown(scrollBottom < pageHeight - 5);
      setCanScrollUp(scrollTop > 5);
    }
  };

  useEffect(() => {
    checkScroll();
    const debouncedCheckScroll = debounce(checkScroll, 100);

    const el = scrollContainerRef?.current;

    if (el) {
      el.addEventListener('scroll', debouncedCheckScroll);
      window.addEventListener('resize', debouncedCheckScroll);
    } else {
      window.addEventListener('scroll', debouncedCheckScroll);
      window.addEventListener('resize', debouncedCheckScroll);
    }

    return () => {
      if (el) {
        el.removeEventListener('scroll', debouncedCheckScroll);
        window.removeEventListener('resize', debouncedCheckScroll);
      } else {
        window.removeEventListener('scroll', debouncedCheckScroll);
        window.removeEventListener('resize', debouncedCheckScroll);
      }
    };
  }, [scrollContainerRef]);

  const scrollBySection = (direction) => {
    const el = scrollContainerRef?.current;
    const offset = direction === 'down' ? sectionHeight : -sectionHeight;

    if (el && sectionHeight) {
      el.scrollBy({ top: offset, behavior: 'smooth' });
    } else {
      const scrollTo = direction === 'down'
        ? window.scrollY + window.innerHeight
        : window.scrollY - window.innerHeight;
      window.scrollTo({ top: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <>
      {canScrollDown && (
        <div className="scroll-indicator down">
          <img
            src={process.env.PUBLIC_URL + "/Arrow2.svg"}
            alt="Scroll Down"
            className="scroll-arrow down-arrow"
            onClick={() => scrollBySection('down')}
          />
        </div>
      )}
      {canScrollUp && (
        <div className="scroll-indicator up">
          <img
            src={process.env.PUBLIC_URL + "/Arrow2.svg"}
            alt="Scroll Up"
            className="scroll-arrow up-arrow"
            onClick={() => scrollBySection('up')}
          />
        </div>
      )}
    </>
  );
};

export default ScrollIndicator;
