import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

const Header = ({ isLoggedIn, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear the cookie by setting it to expire
    document.cookie = 'token=; Max-Age=0; path=/;';
    setUser(null);
    navigate('/');
  };

  return (
    <header className={styles.header}>
      {/* Wrap logo in a Link and style it */}
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
            {isLoggedIn ? (
              <Link to="/account/edit" className={styles.navLink}>Account</Link>
            ) : (
              <Link to="/login" className={styles.navLink}>Login / Create Account</Link>
            )}
          </li>
          {isLoggedIn && (
            <li className={styles.navItem}>
              <button onClick={handleLogout} className={styles.navLink} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                Logout
              </button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
