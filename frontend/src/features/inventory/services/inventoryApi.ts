import { InventoryItem } from '../types/inventory.types';

const API_URL = 'http://localhost:8081';

export const inventoryApi = {
  getInventory: async (): Promise<InventoryItem[]> => {
    const response = await fetch(`${API_URL}/inventory`);
    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }
    return response.json();
  },

  createProduct: async (product: Omit<InventoryItem, 'productID'>): Promise<InventoryItem> => {
    const response = await fetch(`${API_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      throw new Error('Failed to create product');
    }
    return response.json();
  },

  updateProduct: async (id: number, product: InventoryItem): Promise<void> => {
    const response = await fetch(`${API_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
  },

  deleteProduct: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/inventory/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
  },
};
