import React from 'react';
import { WarehouseViewer } from '../features/inventory/components/WarehouseViewer';

export const ViewerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-base-text">Warehouse 2D Viewer</h1>
        <p className="mt-2 text-muted-text">Interactive map of warehouse shelves and bins.</p>
      </header>
      <div className="bg-card rounded-lg shadow-sm border border-base-border p-4 min-h-[600px] flex items-center justify-center transition-colors">
        <WarehouseViewer />
      </div>
    </div>
  );
};
