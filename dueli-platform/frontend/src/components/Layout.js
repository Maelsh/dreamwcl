import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import RealTimeIndicator from './RealTimeIndicator';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <RealTimeIndicator />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;