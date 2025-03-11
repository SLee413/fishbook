import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import styles from './Header.module.css';

const Header = () => {
  const navigate = useNavigate();
  const jwtToken = Cookies.get('jwtToken');

  const handleLogout = () => {
    Cookies.remove('jwtToken');
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <Link to="/" className={styles.logoLink}>
          <h1 className={styles.logoText}>Fishbook</h1>
        </Link>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <Link to="/map" className={styles.navLink}>
              Map
            </Link>
          </li>

          <li className={styles.navItem}>
            <Link to="/create-post" className={styles.navLink}>
              Create Post
            </Link>
          </li>

          <li className={styles.navItem}>
            <Link to="/account" className={styles.navLink}>
              Account
            </Link>
          </li>

          {jwtToken && (
            <li className={styles.navItem}>
              <button onClick={handleLogout} className={styles.logoutButton}>
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
