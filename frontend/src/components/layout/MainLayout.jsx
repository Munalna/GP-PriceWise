import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const MainLayout = ({ children }) => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;