import React, { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import api from '../services/api';
import { useAuth } from '../features/auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const MyContractsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await api.get('/api/Rental/my-contracts');
      setContracts(response.data);
    } catch (error) {
      console.error("Failed to fetch contracts", error);
    }
  };


  const getStatusStyle = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-100 text-green-800'; // active
      case 0: return 'bg-yellow-100 text-yellow-800'; // pending
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return 'ACTIVE';
      case 0: return 'PENDING';
      case 2: return 'EXPIRED';
      case 3: return 'CANCELLED';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Rental Contracts</h1>
        <p className="mt-2 text-gray-600 dark:text-slate-400">View and manage your warehouse shelf rentals.</p>
      </header>

      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-800 pb-1">
        <button className="px-4 py-2 border-b-2 border-indigo-600 text-indigo-600 font-bold text-sm">Active ({contracts.filter(c => c.status === 1).length})</button>
        <button className="px-4 py-2 text-gray-400 dark:text-slate-500 font-medium text-sm hover:text-gray-600 dark:hover:text-slate-300 transition-colors">Past ({contracts.filter(c => c.status > 1).length})</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map(contract => (
          <Card key={contract.contractID} className="group hover:shadow-lg transition-all border-l-4 border-l-indigo-500 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Contract ID</p>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">RC-2026-{contract.contractID.toString().padStart(3, '0')}</h3>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tighter ${getStatusStyle(contract.status)}`}>
                {getStatusLabel(contract.status)}
              </span>
            </div>

            <div className="space-y-4 mb-6 flex-grow">
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-gray-600 dark:text-slate-400 mr-2">Shelves:</span>
                <span className="font-bold text-gray-900 dark:text-white">{contract.shelves?.length || 0}</span>
              </div>
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600 dark:text-slate-400 mr-2">Monthly Rate:</span>
                <span className="font-bold text-indigo-600">${contract.monthlyRate}</span>
              </div>
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600 dark:text-slate-400 mr-2">Period:</span>
                <span className="font-bold text-gray-900 dark:text-white text-xs">
                  {new Date(contract.startDate).toLocaleDateString()} to {new Date(contract.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 dark:border-slate-800 space-y-4">
               <div className="w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Payment Progress</span>
                    <span className="text-[10px] font-bold text-indigo-600">
                      {contract.payments?.filter((p: any) => p.status === 1).length || 0}/{contract.payments?.length || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-500" 
                      style={{ width: `${(contract.payments?.filter((p: any) => p.status === 1).length / contract.payments?.length * 100) || 0}%` }}
                    ></div>
                  </div>
               </div>
               
               <button 
                  onClick={() => navigate(`/contracts/${contract.contractID}`)}
                  className="w-full py-2 bg-gray-900 dark:bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-indigo-600 dark:hover:bg-blue-700 transition-colors uppercase tracking-widest"
               >
                 Manage Contract
               </button>
            </div>
          </Card>
        ))}
        {contracts.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
            <p className="text-gray-400 dark:text-slate-500 italic">You don't have any rental contracts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
