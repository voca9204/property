import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import './styles.css'; // CSS 파일을 별도로 분리

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Check if link is active
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect happens automatically due to authentication state change
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="layout-container">
      <header className="main-header">
        <div className="header-content">
          <Link to="/" className="logo">부동산 관리 시스템</Link>
          
          <nav className="main-nav">
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/" className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>홈</Link>
              </li>
              <li className="nav-item">
                <Link to="/guides" className={`nav-link ${isActive('/guides') ? 'active' : ''}`}>가이드</Link>
              </li>
              {auth.currentUser && (
                <>
                  <li className="nav-item">
                    <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>대시보드</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/properties" className={`nav-link ${isActive('/properties') ? 'active' : ''}`}>매물</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/clients" className={`nav-link ${isActive('/clients') ? 'active' : ''}`}>고객</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/showcases" className={`nav-link ${isActive('/showcases') ? 'active' : ''}`}>쇼케이스</Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
          
          <div className="auth-buttons">
            {auth.currentUser ? (
              <button onClick={handleLogout} className="logout-btn">로그아웃</button>
            ) : (
              <>
                <Link to="/login" className="login-btn">로그인</Link>
                <Link to="/register" className="register-btn">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="main-footer">
        <div className="footer-content">
          <p>&copy; 2025 부동산 관리 시스템. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
