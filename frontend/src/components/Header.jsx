import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = ({ isLoggedIn }) => {
  return (
    <header className={styles.header}>
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
          {isLoggedIn ? (
            <li className={styles.navItem}>
              <Link to="/account" className={styles.navLink}>Account</Link>
            </li>
          ) : (
            <>
              <li className={styles.navItem}>
                <Link to="/login" className={styles.navLink}>Login</Link>
              </li>
              <li className={styles.navItem}>
                <Link to="/create-account" className={styles.navLink}>Create Account</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
