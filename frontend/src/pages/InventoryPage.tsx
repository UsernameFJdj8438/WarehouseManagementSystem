import React from 'react';
import { InventoryList } from '../features/inventory/components/InventoryList';

export const InventoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
        <p className="mt-2 text-gray-600 dark:text-slate-400">Detailed view of all products and stock levels.</p>
      </header>
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
        <InventoryList />
      </div>
    </div>
  );
};
