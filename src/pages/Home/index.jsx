import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>부동산 관리 시스템</h1>
        <p>효율적인 부동산 관리와 고객 관계를 위한 솔루션</p>
      </header>
      
      <section className="feature-section">
        <h2>기능 바로가기</h2>
        
        <div className="feature-cards">
          <div className="feature-card">
            <h3>부동산 가이드</h3>
            <p>이미지와 주소를 포함한 정보를 입력하고, 네이버 지도와 연결된 가이드 페이지를 만들어보세요.</p>
            <div className="feature-links">
              <Link to="/guides" className="feature-link primary">가이드 목록 보기</Link>
              <Link to="/guides/new" className="feature-link secondary">새 가이드 만들기</Link>
            </div>
          </div>
          
          {/* 추가 기능 카드들은 나중에 구현될 수 있습니다 */}
        </div>
      </section>
    </div>
  );
};

export default Home;
