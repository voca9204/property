import React from 'react';
import { Outlet } from 'react-router-dom';

const Guides = () => {
  // Outlet 컴포넌트는 중첩된 경로의 컴포넌트를 렌더링합니다
  return <Outlet />;
};

export default Guides;
