import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div style={styles.nav}>
      <h3>Sage-UniKart</h3>

      <div style={styles.links}>
        <Link to="/">Home</Link>
        <Link to="/admin">Admin</Link>
      </div>
    </div>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    background: "#fff",
    borderBottom: "1px solid #ddd"
  },
  links: {
    display: "flex",
    gap: 10
  }
};

export default Navbar;
