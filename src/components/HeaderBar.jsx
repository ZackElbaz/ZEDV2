// src/components/HeaderBar.jsx
import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import "./HeaderBar.css";
import SearchBar from "./SearchBar";

const HeaderBar = forwardRef((props, ref) => {
  return (
    <div className="header-bar" ref={ref}>
      <Link to="/" className="home-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="home-icon"
        >
          <path d="M4 12l8-8 8 8v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z" />
        </svg>
      </Link>
      <div className="search-container">
        <SearchBar placeholder="SEARCH FOR PROJECTS" />
      </div>
    </div>
  );
});

export default HeaderBar;
