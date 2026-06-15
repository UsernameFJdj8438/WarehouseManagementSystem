import React from 'react';
import { Card } from '../../../components/UI/Card';
import { Button } from '../../../components/UI/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back!</h1>
        <p className="mt-2 text-gray-600 dark:text-slate-400">
          Here's an overview of your rental contracts, <span className="font-semibold text-indigo-600">{user?.name}</span>.
        </p>
      </header>

      {/* statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center justify-center p-6">
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Active Contracts</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">1</p>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6">
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Total Shelves</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">3</p>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6">
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Monthly Cost</p>
          <p className="text-3xl font-bold text-indigo-600">$150</p>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6">
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Next Payment</p>
          <p className="text-3xl font-bold text-purple-600">$150</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* recent contracts */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Contracts</h3>
            <span className="text-xs text-gray-400 dark:text-slate-500">Your active rental agreements</span>
          </div>
          <div className="space-y-3">
            <div className="p-4 border border-gray-100 dark:border-slate-800 rounded-lg flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">RC-2026-001</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">3 shelves</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">$150/mo</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Ends 2026-12-31</p>
              </div>
            </div>
            <Link to="/contracts">
              <Button variant="secondary" className="w-full mt-4">View All Contracts</Button>
            </Link>
          </div>
        </Card>

        {/* upcoming ppayments */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Payments</h3>
            <span className="text-xs text-gray-400 dark:text-slate-500">Your scheduled billing</span>
          </div>
          <div className="space-y-3">
            <div className="p-4 border border-gray-100 dark:border-slate-800 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">RC-2026-001</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Due: 2026-06-01</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600">$150</p>
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-[10px] font-bold rounded uppercase">Pending</span>
              </div>
            </div>
          </div>
        </Card>
      </div>


      <Card padding="lg">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Quick Actions</h3>
        <div className="flex gap-4">
          <Link to="/rent">
            <Button variant="primary" className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Rent More Shelves
            </Button>
          </Link>
          <Link to="/contracts">
            <Button variant="secondary" className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View All Contracts
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
