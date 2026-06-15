import React, { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import api from '../services/api';
import { Employee, RentalContract } from '../features/inventory/types/inventory.types';

export const CustomerManagementPage: React.FC = () => {
  const [customers, setCustomers] = useState<Employee[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/Customer');
      setCustomers(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleViewCustomer = async (id: number) => {
    try {
      const response = await api.get(`/api/Customer/${id}/full-details`);
      setSelectedDetails(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOfflineApprove = async (paymentId: number) => {
    if (!window.confirm("Mark this payment as PAID manually? This action cannot be undone.")) return;
    try {
      await api.post(`/api/Payment/approve-offline/${paymentId}`);
      alert("Payment approved successfully!");
      // refresh details
      handleViewCustomer(selectedDetails.customer.employeeID);
    } catch (err) {
      alert("Failed to approve payment");
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-base-text tracking-tight">Customer & Payment Management</h1>
        <p className="text-muted-text mt-1 text-sm">Review customer accounts, active contracts, and manually approve offline payments.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-base-border bg-page/50">
               <h3 className="text-[10px] font-black text-muted-text uppercase tracking-widest">Active Customers</h3>
            </div>
            <div className="divide-y divide-base-border max-h-[600px] overflow-y-auto">
               {customers.map(cust => (
                 <div 
                   key={cust.employeeID} 
                   onClick={() => handleViewCustomer(cust.employeeID)}
                   className={`px-6 py-4 cursor-pointer hover:bg-page transition-colors ${selectedDetails?.customer.employeeID === cust.employeeID ? 'bg-primary-500/5' : ''}`}
                 >
                   <p className="font-bold text-base-text">{cust.name}</p>
                   <p className="text-xs text-muted-text">{cust.email}</p>
                 </div>
               ))}
               {customers.length === 0 && !isLoading && <p className="p-8 text-center text-xs text-muted-text italic">No customers found.</p>}
            </div>
          </Card>
        </div>

        {/* contract and payment  */}
        <div className="lg:col-span-2">
           {selectedDetails ? (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Card padding="lg" className="border-l-4 border-l-primary-500">
                   <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-black text-base-text">{selectedDetails.customer.name}</h2>
                        <p className="text-muted-text text-sm">{selectedDetails.customer.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-muted-text uppercase">Total Contracts</p>
                        <p className="text-2xl font-black text-primary-600">{selectedDetails.contracts.length}</p>
                      </div>
                   </div>
                </Card>

                {selectedDetails.contracts.map((contract: any) => (
                  <Card key={contract.contractID} className="overflow-hidden">
                    <div className="px-6 py-4 bg-page/50 border-b border-base-border flex justify-between items-center">
                       <h3 className="font-black text-base-text uppercase tracking-tight">Contract RC-{contract.contractID}</h3>
                       <span className="text-[10px] font-bold text-muted-text italic">Valid until {new Date(contract.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="p-0">
                       <table className="w-full text-left text-sm">
                          <thead className="text-[10px] font-black text-muted-text uppercase tracking-wider bg-page/20">
                             <tr>
                               <th className="px-6 py-3">Installment</th>
                               <th className="px-6 py-3">Due Date</th>
                               <th className="px-6 py-3">Amount</th>
                               <th className="px-6 py-3">Status</th>
                               <th className="px-6 py-3 text-right">Action</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-base-border">
                             {contract.payments.map((p: any) => (
                               <tr key={p.paymentID} className="hover:bg-page/30 transition-colors">
                                 <td className="px-6 py-4 font-bold text-base-text">#{p.paymentID}</td>
                                 <td className="px-6 py-4 text-muted-text">{new Date(p.dueDate).toLocaleDateString()}</td>
                                 <td className="px-6 py-4 font-black text-base-text">${p.amount}</td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase ${p.status === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                      {p.status === 1 ? 'Paid' : 'Pending'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    {p.status === 0 && (
                                      <Button size="sm" variant="primary" className="text-[10px] h-7" onClick={() => handleOfflineApprove(p.paymentID)}>
                                        Offline Approve
                                      </Button>
                                    )}
                                 </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </Card>
                ))}
             </div>
           ) : (
             <Card className="h-64 flex flex-col items-center justify-center text-center p-8 bg-page/30 border-dashed border-2">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="text-base-text font-bold">Select a Customer</h4>
                <p className="text-sm text-muted-text mt-2 max-w-xs">Pick a customer from the left panel to review their rental history and manage pending payments.</p>
             </Card>
           )}
        </div>
      </div>
    </div>
  );
};
