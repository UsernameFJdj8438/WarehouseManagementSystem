import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useAuth } from '../features/auth/context/AuthContext';
import { PaymentTerminal } from '../components/Payment/PaymentTerminal';
import api from '../services/api';

interface Shelf {
  shelfID: number;
  name: string;
}

interface Payment {
  paymentID: number;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: number;
}

interface Contract {
  contractID: number;
  monthlyRate: number;
  startDate: string;
  endDate: string;
  status: number;
  shelves: Shelf[];
  payments: Payment[];
}

export const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [id]);

  const fetchContract = async () => {
    try {
      const response = await api.get(`/api/Rental/${id}`);
      setContract(response.data);
    } catch (error) {
      console.error("Failed to fetch contract details", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsTerminalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsTerminalOpen(false);
    fetchContract();
  };

  const getStatusStyle = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-100 text-green-800'; 
      case 0: return 'bg-yellow-100 text-yellow-800';
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

  const getPaymentStatusStyle = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-100 text-green-700'; // paid
      case 0: return 'bg-yellow-100 text-yellow-700'; // pending
      case 2: return 'bg-red-100 text-red-700'; // overdue
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusLabel = (status: number) => {
    switch (status) {
      case 1: return 'Paid';
      case 0: return 'Pending';
      case 2: return 'Overdue';
      case 3: return 'Failed';
      default: return 'Unknown';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading contract details...</div>;
  if (!contract) return <div className="p-8 text-center">Contract not found.</div>;

  const totalPaid = contract.payments.filter(p => p.status === 1).reduce((sum, p) => sum + p.amount, 0);
  const nextPayment = contract.payments.find(p => p.status === 0 || p.status === 2);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/contracts')}
          className="p-2 hover:bg-page dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-muted-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-base-text tracking-tight">
              Contract RC-2026-{contract.contractID.toString().padStart(3, '0')}
            </h1>
            <button 
              onClick={fetchContract}
              className="p-1.5 text-muted-text hover:text-primary-600 transition-colors"
              title="Refresh Data"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${getStatusStyle(contract.status)}`}>
              {getStatusLabel(contract.status)}
            </span>
            <span className="text-base-border text-xs">•</span>
            <span className="text-muted-text text-xs font-medium">
              Created on {new Date(contract.startDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-primary-600 border-none p-6 shadow-lg shadow-primary-500/20">
              <p className="text-primary-100 text-xs font-bold uppercase tracking-wider mb-1">Monthly Rate</p>
              <h4 className="text-3xl font-black text-white">${contract.monthlyRate}</h4>
              <p className="text-primary-200 text-[10px] mt-2 italic">Billed every 30 days</p>
            </Card>
            <Card className="p-6">
              <p className="text-muted-text text-xs font-bold uppercase tracking-wider mb-1">Total Paid</p>
              <h4 className="text-3xl font-black text-base-text">${totalPaid}</h4>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-muted-text text-[10px] font-medium">Synced with Database</p>
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-muted-text text-xs font-bold uppercase tracking-wider mb-1">Active Shelves</p>
              <h4 className="text-3xl font-black text-base-text">{contract.shelves.length}</h4>
              <p className="text-muted-text text-[10px] mt-2 font-medium">Storage Allocation</p>
            </Card>
          </div>

          {/* Payment Schedule */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-base-border flex justify-between items-center bg-page/50">
              <h3 className="font-black text-card-title uppercase tracking-tight">Payment Schedule</h3>
            </div>
            <div className="divide-y divide-base-border">
              {contract.payments.length > 0 ? (
                contract.payments.map((payment) => (
                  <div key={payment.paymentID} className="px-6 py-4 flex items-center justify-between hover:bg-page transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payment.status === 1 ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-black text-base-text">Installment #{payment.paymentID}</p>
                        <p className="text-xs text-muted-text font-medium">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-black text-base-text">${payment.amount}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${getPaymentStatusStyle(payment.status)}`}>
                          {getPaymentStatusLabel(payment.status)}
                        </span>
                      </div>
                      
                      {payment.status !== 1 && (
                        <Button 
                          className="bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow-md shadow-primary-500/10 dark:shadow-none transition-all active:scale-95"
                          onClick={() => handlePayClick(payment)}
                        >
                          PAY NOW
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-text italic text-sm">
                  No payments scheduled yet. Complete setup to generate schedule.
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-6">
            <h3 className="font-black text-card-title uppercase tracking-tight mb-4 flex justify-between items-center">
              Rented Shelves
              <span className="text-[10px] bg-page border border-base-border px-2 py-0.5 rounded">{contract.shelves.length} Total</span>
            </h3>
            <div className="space-y-2">
              {contract.shelves.map(shelf => (
                <div key={shelf.shelfID} className="flex items-center gap-3 p-2 bg-page rounded-lg border border-base-border">
                  <div className="w-8 h-8 bg-card rounded flex items-center justify-center text-xs font-black text-primary-600 shadow-sm border border-base-border">
                    {shelf.shelfID}
                  </div>
                  <span className="text-xs font-bold text-base-text">Shelf {shelf.name || `#${shelf.shelfID}`}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <PaymentTerminal 
        isOpen={isTerminalOpen} 
        onClose={() => setIsTerminalOpen(false)} 
        installment={selectedPayment}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
