import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchInventory } from '../../../store/slices/inventorySlice';
import { inventoryApi } from '../services/inventoryApi';
import { Button } from '../../../components/UI/Button';
import { Card } from '../../../components/UI/Card';
import { Input } from '../../../components/UI/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().default(''),
  price: z.preprocess((val) => Number(val), z.number()),
  weight: z.preprocess((val) => Number(val), z.number()),
  minStockLevel: z.preprocess((val) => Number(val), z.number()),
  totalStock: z.number().default(0),
  unassignedStock: z.number().default(0),
});

type ProductFormData = z.infer<typeof productSchema>;

export const InventoryList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: inventory, loading, error } = useAppSelector((state) => state.inventory);
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'add'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: 'PRD-',
      description: '',
      price: 0,
      weight: 0,
      minStockLevel: 5,
      totalStock: 0,
      unassignedStock: 0
    }
  });

  useEffect(() => {
    if (inventory.length === 0) {
      dispatch(fetchInventory());
    }
  }, [dispatch, inventory.length]);

  const onProductSubmit = async (data: ProductFormData) => {
    try {
      await inventoryApi.createProduct(data);
      reset();
      dispatch(fetchInventory());
      setActiveTab('catalog');
    } catch (err) {
      alert("Failed to create product");
    }
  };

  const filteredItems = inventory
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(item => item.price <= maxPrice)
    .filter(item => !showLowStockOnly || item.totalStock < item.minStockLevel)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.price - b.price;
      return a.minStockLevel - b.minStockLevel;
    });

  if (loading && inventory.length === 0) {
    return <div className="p-10 text-center text-gray-500">Loading inventory data...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-600 font-medium">{error}</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-gray-50 dark:bg-slate-950 transition-colors">
      {/* Tabs */}
      <div className="flex gap-4 px-6 bg-card border-b border-base-border transition-colors">
        <button 
          onClick={() => setActiveTab('catalog')}
          className={`py-4 px-2 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'catalog' ? "border-primary-600 text-primary-600" : "border-transparent text-muted-text hover:text-base-text"
          }`}
        >
          Product Catalog
        </button>
        <button 
          onClick={() => setActiveTab('add')}
          className={`py-4 px-2 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'add' ? "border-primary-600 text-primary-600" : "border-transparent text-muted-text hover:text-base-text"
          }`}
        >
          + Add New Product
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 p-4 bg-card border-b border-base-border transition-colors">
            <div className="flex-1 min-w-[300px]">
              <Input 
                placeholder="Search by Product Name or SKU..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              className="h-10 px-3 rounded-md border border-base-border bg-card text-sm text-base-text focus:outline-none focus:ring-2 focus:ring-primary-600 transition-colors"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="stock">Sort by Min Stock</option>
            </select>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* filters */}
            <aside className="w-64 p-6 bg-page border-r border-base-border overflow-y-auto hidden lg:block transition-colors">
              <h3 className="text-sm font-black text-base-text uppercase tracking-widest mb-6">Filters</h3>
              
              <div className="mb-8">
                <label className="block text-sm font-bold text-muted-text mb-2">
                  Max Price: <span className="text-primary-600">${maxPrice}</span>
                </label>
                <input 
                  type="range" min="0" max="1000" step="10" 
                  value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-base-border rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>

              <div className="mb-8">
                <h4 className="text-sm font-bold text-base-text mb-3">Availability</h4>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={showLowStockOnly} 
                    onChange={e => setShowLowStockOnly(e.target.checked)}
                    className="w-4 h-4 accent-primary-600 border-base-border rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-muted-text group-hover:text-base-text transition-colors font-medium">Low Stock Only</span>
                </label>
              </div>

              <div className="p-4 bg-primary-500/10 dark:bg-primary-900/20 rounded-xl border border-primary-500/20">
                <p className="text-xs text-primary-700 dark:text-primary-400 font-bold">
                  Showing <span className="text-primary-600 dark:text-primary-300">{filteredItems.length}</span> of {inventory.length} items
                </p>
              </div>
            </aside>


            <main className="flex-1 p-6 overflow-y-auto bg-page transition-colors">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                  <Card key={item.productID} padding="md" className="hover:shadow-lg hover:border-primary-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">{item.sku}</span>
                      <span className="text-lg font-black text-green-600 dark:text-green-500">${item.price}</span>
                    </div>
                    <h3 className="text-md font-bold text-card-title mb-1 group-hover:text-primary-600 transition-colors">{item.name}</h3>
                    <p className="text-sm text-card-body mb-4 line-clamp-2">{item.description}</p>
                    
                    <div className="pt-4 border-t border-base-border grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-text font-medium">Weight:</span> <span className="font-black text-base-text">{item.weight} kg</span></div>
                      <div>
                        <span className="text-muted-text font-medium">Stock:</span> <span className="font-black text-base-text">{item.totalStock}</span>
                        {item.unassignedStock > 0 && <span className="text-primary-600 ml-1 font-black">({item.unassignedStock})</span>}
                      </div>
                      {item.totalStock < item.minStockLevel && (
                        <div className="col-span-2 mt-2">
                          <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-[10px] font-black uppercase tracking-tighter">Low Stock Alert</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </main>
          </div>
        </div>
      ) : (
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-slate-950">
          <Card className="max-w-2xl mx-auto" padding="lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Register New Product</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-8">Enter product details to add it to the warehouse system catalog.</p>
            
            <form onSubmit={handleSubmit(onProductSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Product Name" 
                  {...register("name")}
                  error={errors.name?.message}
                />
                <Input 
                  label="SKU (Unique Identifier)" 
                  {...register("sku")}
                  error={errors.sku?.message}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Description</label>
                <textarea 
                  rows={3} 
                  {...register("description")}
                  className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 transition-colors"
                />
                {errors.description && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input 
                  label="Price ($)" 
                  type="number" 
                  {...register("price")}
                  error={errors.price?.message}
                />
                <Input 
                  label="Weight (kg)" 
                  type="number" 
                  step="0.01" 
                  {...register("weight")}
                  error={errors.weight?.message}
                />
                <Input 
                  label="Min. Stock" 
                  type="number" 
                  {...register("minStockLevel")}
                  error={errors.minStockLevel?.message}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" variant="primary" fullWidth className="py-6 text-lg">
                  Create Product
                </Button>
                <Button type="button" variant="ghost" onClick={() => setActiveTab('catalog')} className="px-8">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </main>
      )}
    </div>
  );
};
