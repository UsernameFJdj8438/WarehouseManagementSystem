import React, { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import api from '../services/api';
import { Employee, EmployeeRole, WorkOrder, WorkOrderStatus } from '../features/inventory/types/inventory.types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const employeeSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  role: z.preprocess((val) => Number(val), z.nativeEnum(EmployeeRole))
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export const EmployeeManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: '', email: '', role: EmployeeRole.Worker }
  });

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/Employee');
      setEmployees(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleViewDetail = async (id: number) => {
    try {
      const response = await api.get(`/api/Employee/${id}`);
      setSelectedEmployee(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      await api.post('/api/Employee', data);
      reset();
      setIsAdding(false);
      fetchEmployees();
    } catch (err) {
      alert("Failed to add employee");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this employee?")) return;
    try {
      await api.delete(`/api/Employee/${id}`);
      if (selectedEmployee?.employee?.employeeID === id) setSelectedEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data || "Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-base-text tracking-tight">Staff Management</h1>
          <p className="text-muted-text mt-1 text-sm">Manage your warehouse workforce and track active assignments.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'secondary' : 'primary'}>
          {isAdding ? 'Cancel' : '+ Add New Staff'}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* list of employees */}
        <div className="lg:col-span-2 space-y-4">
          {isAdding && (
            <Card className="border-2 border-primary-500/20" padding="lg">
              <h3 className="text-lg font-bold text-card-title mb-4">Register New Employee</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" {...register("name")} error={errors.name?.message} />
                  <Input label="Email Address" {...register("email")} error={errors.email?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-text mb-1">System Role</label>
                  <select 
                    {...register("role")}
                    className="w-full h-10 px-3 rounded-md border border-base-border bg-card text-sm text-base-text focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <option value={EmployeeRole.Worker}>Worker</option>
                    <option value={EmployeeRole.Manager}>Manager</option>
                  </select>
                </div>
                <Button type="submit" fullWidth>Create Account</Button>
              </form>
            </Card>
          )}

          <Card padding="none" className="overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-page/50 border-b border-base-border">
                 <tr>
                   <th className="px-6 py-4 text-[10px] font-black text-muted-text uppercase tracking-widest">Name</th>
                   <th className="px-6 py-4 text-[10px] font-black text-muted-text uppercase tracking-widest">Role</th>
                   <th className="px-6 py-4 text-[10px] font-black text-muted-text uppercase tracking-widest">Email</th>
                   <th className="px-6 py-4 text-right"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-base-border">
                 {employees.map(emp => (
                   <tr key={emp.employeeID} className={`hover:bg-page/50 transition-colors cursor-pointer ${selectedEmployee?.employee.employeeID === emp.employeeID ? 'bg-primary-500/5' : ''}`} onClick={() => handleViewDetail(emp.employeeID)}>
                     <td className="px-6 py-4">
                        <p className="font-bold text-base-text">{emp.name}</p>
                        <p className="text-[10px] text-muted-text">ID: #{emp.employeeID}</p>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${emp.role === EmployeeRole.Manager ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {EmployeeRole[emp.role]}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-sm text-muted-text">{emp.email}</td>
                     <td className="px-6 py-4 text-right space-x-2">
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(emp.employeeID); }}>Delete</Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedEmployee ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <Card className="border-t-4 border-t-primary-500">
                 <h3 className="text-sm font-black text-muted-text uppercase tracking-widest mb-4">Profile Details</h3>
                 <div className="space-y-4">
                   <div>
                     <p className="text-[10px] font-bold text-muted-text uppercase">Full Name</p>
                     <p className="text-lg font-black text-base-text">{selectedEmployee.employee.name}</p>
                   </div>
                   <div className="p-4 bg-page rounded-xl border border-base-border">
                      <p className="text-[10px] font-bold text-muted-text uppercase mb-2">Current Status</p>
                      {selectedEmployee.activeTask ? (
                        <div className="flex items-center gap-3 text-orange-600">
                           <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
                           <span className="text-xs font-black uppercase tracking-tight">Active: Moving {selectedEmployee.activeTask.lpnid}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-green-600">
                           <div className="w-2 h-2 rounded-full bg-green-500"></div>
                           <span className="text-xs font-black uppercase tracking-tight">Idle / Ready for task</span>
                        </div>
                      )}
                   </div>
                 </div>
               </Card>

               <Card className="flex-1">
                  <h3 className="text-sm font-black text-muted-text uppercase tracking-widest mb-6">Task History</h3>
                  <div className="space-y-4">
                    {selectedEmployee.workHistory.slice(0, 5).map((wo: WorkOrder) => (
                      <div key={wo.workOrderID} className="pb-4 border-b border-base-border last:border-0">
                        <div className="flex justify-between items-start mb-1">
                           <p className="text-xs font-bold text-base-text">Order #{wo.workOrderID}</p>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${wo.status === WorkOrderStatus.Completed ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
                             {WorkOrderStatus[wo.status]}
                           </span>
                        </div>
                        <p className="text-[10px] text-muted-text">LPN: {wo.lpnid}</p>
                        <p className="text-[9px] text-muted-text mt-1 italic">{new Date(wo.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {selectedEmployee.workHistory.length === 0 && <p className="text-center text-xs text-muted-text italic py-4">No task history found.</p>}
                  </div>
               </Card>
            </div>
          ) : (
            <Card className="h-48 flex items-center justify-center text-center p-8 bg-page/30 border-dashed border-2">
              <p className="text-sm text-muted-text italic">Select an employee from the list to view their live activity and work history.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
