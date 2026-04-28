import React, { useState } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { InventoryList } from './features/inventory/components/InventoryList';
import { WarehouseViewer } from './features/inventory/components/WarehouseViewer';

function App() {
  const [view, setView] = useState<'list' | '2d'>('list');

  return (
    <MainLayout>
      <header style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Warehouse Dashboard</h1>
          <p>Manage your real-time inventory and logistics flow.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setView('list')} 
            style={{ padding: '10px 20px', background: view === 'list' ? '#2196F3' : '#eee', color: view === 'list' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Inventory List
          </button>
          <button 
            onClick={() => setView('2d')} 
            style={{ padding: '10px 20px', background: view === '2d' ? '#2196F3' : '#eee', color: view === '2d' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            2D Warehouse View
          </button>
        </div>
      </header>
      
      {view === 'list' ? <InventoryList /> : <WarehouseViewer />}
    </MainLayout>
  );
}

export default App;
