import React from 'react';
import Sidebar from './Sidebar';
import Chatbot from '../common/Chatbot';
import './Layout.css';

const MainLayout = ({ children }) => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
      <Chatbot />
    </div>
  );
};

export default MainLayout;
