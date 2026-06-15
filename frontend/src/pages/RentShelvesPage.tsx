import React, { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import api from '../services/api';
import { Shelf } from '../features/inventory/types/inventory.types';
import { useAuth } from '../features/auth/context/AuthContext';

export const RentShelvesPage: React.FC = () => {
  const { user } = useAuth();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedShelfIDs, setSelectedShelfIDs] = useState<long[]>([]);
  const [duration, setDuration] = useState(6);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchShelves();
  }, []);

  const fetchShelves = async () => {
    try {
      const response = await api.get('/api/Rental/available-shelves');
      setShelves(response.data);
    } catch (error) {
      console.error("Failed to fetch shelves", error);
    }
  };

  const toggleShelf = (id: long) => {
    setSelectedShelfIDs(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleCreateContract = async () => {
    if (selectedShelfIDs.length === 0) return;
    setIsLoading(true);
    try {
      await api.post('/api/Rental/create-contract', {
        shelfIDs: selectedShelfIDs,
        durationMonths: duration
      });
      alert("Contract created successfully!");
      setSelectedShelfIDs([]);
    } catch (error) {
      console.error("Failed to create contract", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contract Duration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Start Date</label>
              <input type="text" disabled value={new Date().toLocaleDateString()} className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Duration (Months)</label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Available Shelves</h3>
            <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">$50/month per shelf</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {shelves.map(shelf => (
              <button
                key={shelf.shelfID}
                onClick={() => toggleShelf(shelf.shelfID)}
                className={`p-4 border rounded-lg text-sm font-bold transition-all ${
                  selectedShelfIDs.includes(shelf.shelfID)
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700'
                }`}
              >
                {shelf.label}
              </button>
            ))}
          </div>
          {shelves.length === 0 && <p className="text-center text-gray-400 dark:text-slate-500 italic">No shelves available at the moment.</p>}
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-6 border-2 border-indigo-100 dark:border-indigo-900 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">Contract Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-slate-400">Shelves selected:</span>
              <span className="font-bold text-gray-900 dark:text-white">{selectedShelfIDs.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-slate-400">Duration:</span>
              <span className="font-bold text-gray-900 dark:text-white">{duration} months</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-slate-400">Monthly Rate:</span>
              <span className="font-bold text-indigo-600">${selectedShelfIDs.length * 50}</span>
            </div>
            
            <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total Value:</span>
                <span className="text-2xl font-black text-indigo-600">${selectedShelfIDs.length * 50 * duration}</span>
              </div>
              <Button 
                variant="primary" 
                className="w-full py-4 text-lg font-bold rounded-xl"
                disabled={selectedShelfIDs.length === 0 || isLoading}
                onClick={handleCreateContract}
              >
                {isLoading ? 'Creating...' : 'Create Contract'}
              </Button>
              <p className="text-[10px] text-center text-gray-400 dark:text-slate-500 mt-4 leading-tight">
                By clicking "Create Contract", you agree to our Warehouse Storage Terms of Service and authorize recurring monthly charges.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
