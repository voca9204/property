import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import './styles.css'; // CSS 파일을 별도로 분리

const Layout = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if link is active
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect happens automatically due to authentication state change
      setMobileMenuOpen(false); // 로그아웃 시 모바일 메뉴 닫기
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // 모바일 메뉴 토글
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // 메뉴 항목 클릭 시 모바일 메뉴 닫기
  const handleMenuItemClick = () => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="layout-container">
      <header className="main-header">
        <div className="header-content">
          <Link to="/" className="logo" onClick={handleMenuItemClick}>부동산 관리 시스템</Link>
          
          {/* 모바일 메뉴 토글 버튼 */}
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <nav className={`main-nav ${mobileMenuOpen ? 'active' : ''}`}>
            <ul className="nav-list">
              <li className="nav-item">
                <Link 
                  to="/" 
                  className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
                  onClick={handleMenuItemClick}
                >
                  홈
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/guides" 
                  className={`nav-link ${isActive('/guides') ? 'active' : ''}`}
                  onClick={handleMenuItemClick}
                >
                  가이드
                </Link>
              </li>
              {auth.currentUser && (
                <>
                  <li className="nav-item">
                    <Link 
                      to="/dashboard" 
                      className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                      onClick={handleMenuItemClick}
                    >
                      대시보드
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      to="/properties" 
                      className={`nav-link ${isActive('/properties') ? 'active' : ''}`}
                      onClick={handleMenuItemClick}
                    >
                      매물
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      to="/clients" 
                      className={`nav-link ${isActive('/clients') ? 'active' : ''}`}
                      onClick={handleMenuItemClick}
                    >
                      고객
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      to="/showcases" 
                      className={`nav-link ${isActive('/showcases') ? 'active' : ''}`}
                      onClick={handleMenuItemClick}
                    >
                      쇼케이스
                    </Link>
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
                <Link to="/login" className="login-btn" onClick={handleMenuItemClick}>로그인</Link>
                <Link to="/register" className="register-btn" onClick={handleMenuItemClick}>회원가입</Link>
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
