import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = ({ isLoggedIn }) => {
  return (
    <header className={styles.header}>
      {/* ✅ Logo stays exactly as your original setup */}
      <Link to="/" className={styles.logoContainer}>
        <h1 className={styles.logoText}>Fishbook</h1>
      </Link>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <Link to="/map" className={styles.navLink}>Map</Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/create-post" className={styles.navLink}>Create Post</Link>
          </li>
          <li className={styles.navItem}>
            <Link
              to={isLoggedIn ? "/account" : "/login"}
              className={styles.navLink}
            >
              {isLoggedIn ? "Account" : "Login / Create Account"}
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
