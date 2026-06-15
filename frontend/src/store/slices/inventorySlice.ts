import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { InventoryItem, Shelf } from '../../features/inventory/types/inventory.types';
import { inventoryApi } from '../../features/inventory/services/inventoryApi';
import { warehouseApi } from '../../features/inventory/services/warehouseApi';

interface InventoryState {
  items: InventoryItem[];
  shelves: Shelf[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  items: [],
  shelves: [],
  loading: false,
  error: null,
};

export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async () => {
    return await inventoryApi.getInventory();
  }
);

export const fetchShelves = createAsyncThunk(
  'inventory/fetchShelves',
  async () => {
    return await warehouseApi.getShelves();
  }
);

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch inventory
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action: PayloadAction<InventoryItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch inventory';
      })
      // fetch shelves
      .addCase(fetchShelves.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchShelves.fulfilled, (state, action: PayloadAction<Shelf[]>) => {
        state.loading = false;
        state.shelves = action.payload;
      })
      .addCase(fetchShelves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch shelves';
      });
  },
});

export default inventorySlice.reducer;
