import React from "react";
import { Link, NavLink } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <Link to="/">Resume AI</Link>
      </div>
      <ul className="navbar__links">
        <li>
          <NavLink to="/resume" className={({ isActive }) => isActive ? "active" : undefined}>
            Resume
          </NavLink>
        </li>
        <li>
          <NavLink to="/kanban" className={({ isActive }) => isActive ? "active" : undefined}>
            Kanban
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
