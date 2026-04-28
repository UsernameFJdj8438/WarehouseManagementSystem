import React from 'react';
import { Navbar } from './Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <Navbar />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {children}
      </main>
    </div>
  );
};
