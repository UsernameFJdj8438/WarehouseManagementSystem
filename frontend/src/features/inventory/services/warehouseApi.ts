import api from '../../../services/api';
import { Shelf, Employee, WorkOrder, LPN, WorkOrderStatus } from '../types/inventory.types';

export const warehouseApi = {
  getShelves: async (): Promise<Shelf[]> => {
    const response = await api.get('/shelves');
    return response.data;
  },

  updateShelf: async (shelf: Shelf): Promise<void> => {
    await api.put(`/shelves/${shelf.shelfID}`, shelf);
  },

  createShelf: async (shelf: Omit<Shelf, 'shelfID' | 'bins'>): Promise<Shelf> => {
    const response = await api.post('/shelves', shelf);
    return response.data;
  },

  getEmployees: async (): Promise<Employee[]> => {
    const response = await api.get('/api/Employee');
    return response.data;
  },

  getWorkOrders: async (): Promise<WorkOrder[]> => {
    const response = await api.get('/api/WorkOrder');
    return response.data;
  },

  createWorkOrder: async (workOrder: Omit<WorkOrder, 'workOrderID' | 'createdAt' | 'status'>): Promise<WorkOrder> => {
    const response = await api.post('/api/WorkOrder', { 
      ...workOrder, 
      status: WorkOrderStatus.Pending 
    });
    return response.data;
  },

  updateWorkOrderStatus: async (id: number, status: WorkOrderStatus): Promise<void> => {
    await api.put(`/api/WorkOrder/${id}/status`, status);
  },

  getLPNs: async (): Promise<LPN[]> => {
    const response = await api.get('/lpns');
    return response.data;
  }
};
