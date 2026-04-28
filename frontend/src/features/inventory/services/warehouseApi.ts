import { Shelf, Employee, WorkOrder, LPN, WorkOrderStatus } from '../types/inventory.types';

const API_BASE_URL = 'http://localhost:8081';

export const warehouseApi = {
  getShelves: async (): Promise<Shelf[]> => {
    const response = await fetch(`${API_BASE_URL}/shelves`);
    if (!response.ok) throw new Error('Failed to fetch shelves');
    return response.json();
  },

  updateShelf: async (shelf: Shelf): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/shelves/${shelf.shelfID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shelf),
    });
    if (!response.ok) throw new Error('Failed to update shelf');
  },

  createShelf: async (shelf: Omit<Shelf, 'shelfID' | 'bins'>): Promise<Shelf> => {
    const response = await fetch(`${API_BASE_URL}/shelves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shelf),
    });
    if (!response.ok) throw new Error('Failed to create shelf');
    return response.json();
  },

  getEmployees: async (): Promise<Employee[]> => {
    const response = await fetch(`${API_BASE_URL}/employees`);
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  },

  getWorkOrders: async (): Promise<WorkOrder[]> => {
    const response = await fetch(`${API_BASE_URL}/work-orders`);
    if (!response.ok) throw new Error('Failed to fetch work orders');
    return response.json();
  },

  createWorkOrder: async (workOrder: Omit<WorkOrder, 'workOrderID' | 'createdAt' | 'status'>): Promise<WorkOrder> => {
    const response = await fetch(`${API_BASE_URL}/work-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...workOrder, status: WorkOrderStatus.Pending }),
    });
    if (!response.ok) throw new Error('Failed to create work order');
    return response.json();
  },

  updateWorkOrderStatus: async (id: number, status: WorkOrderStatus): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/work-orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status),
    });
    if (!response.ok) throw new Error('Failed to update work order status');
  },

  getLPNs: async (): Promise<LPN[]> => {
    const response = await fetch(`${API_BASE_URL}/lpns`);
    if (!response.ok) throw new Error('Failed to fetch LPNs');
    return response.json();
  }
};
