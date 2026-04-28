import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <nav style={{ background: '#2c3e50', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1 style={{ margin: 0 }}>Warehouse Managemet App</h1>
      <div>
        <a href="#" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>Dashboard</a>
        <a href="#" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>Inventory</a>
        <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Orders</a>
      </div>
    </nav>
  );
};
