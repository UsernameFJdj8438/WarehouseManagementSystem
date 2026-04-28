import React, { useEffect, useState } from 'react';
import { InventoryItem } from '../types/inventory.types';
import { inventoryApi } from '../services/inventoryApi';

export const InventoryList: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'add'>('catalog');

  
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');

  
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    description: '',
    price: 0,
    minStockLevel: 0,
    weight: 0,
    totalStock: 0,
    unassignedStock: 0
  });

  const fetchInventory = async () => {
    try {
      const data = await inventoryApi.getInventory();
      setInventory(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Could not connect to the backend sandbox (Port 8081).");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.createProduct(newProduct);
      setNewProduct({
        sku: '',
        name: '',
        description: '',
        price: 0,
        minStockLevel: 0,
        weight: 0,
        totalStock: 0,
        unassignedStock: 0
      });
      await fetchInventory();
      setActiveTab('catalog');
      alert('Product added successfully!');
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading large dataset...</div>;
  if (error) return <div style={{ color: 'red', padding: '40px', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {}
      <div style={{ padding: '10px 20px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', gap: '20px' }}>
        <button 
          onClick={() => setActiveTab('catalog')}
          style={{ padding: '8px 16px', border: 'none', background: 'transparent', borderBottom: activeTab === 'catalog' ? '2px solid #2196F3' : 'none', color: activeTab === 'catalog' ? '#2196F3' : '#666', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Product Catalog
        </button>
        <button 
          onClick={() => setActiveTab('add')}
          style={{ padding: '8px 16px', border: 'none', background: 'transparent', borderBottom: activeTab === 'add' ? '2px solid #2196F3' : 'none', color: activeTab === 'add' ? '#2196F3' : '#666', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Add New Product
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {}
          <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: '#fff', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search by Product Name, SKU, or Description..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 20px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
              />
            </div>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="stock">Sort by Min Stock</option>
            </select>
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {}
            <aside style={{ width: '300px', borderRight: '1px solid #eee', padding: '25px', background: '#fcfcfc', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Filters</h3>
              
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>
                  Max Price: ${maxPrice}
                </label>
                <input 
                  type="range" min="0" max="1000" step="10" 
                  value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ marginBottom: '15px' }}>Availability</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showLowStockOnly} onChange={e => setShowLowStockOnly(e.target.checked)} />
                  Show Low Stock Alerts Only
                </label>
              </div>

              <div style={{ marginTop: '40px', padding: '15px', background: '#e3f2fd', borderRadius: '8px', color: '#0d47a1' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Showing <strong>{filteredItems.length}</strong> of {inventory.length} items</p>
              </div>
            </aside>

            {}
            <main style={{ flex: 1, padding: '25px', overflowY: 'auto', background: '#f5f5f5' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredItems.map(item => (
                  <div key={item.productID} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 'bold' }}>{item.sku}</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2e7d32' }}>${item.price}</span>
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{item.name}</h3>
                    <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#666' }}>{item.description}</p>
                    
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.85rem' }}><span style={{ color: '#888' }}>Weight: </span><strong>{item.weight} kg</strong></div>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: '#888' }}>Stock: </span><strong>{item.totalStock}</strong>
                        {item.unassignedStock > 0 && <span style={{ color: '#2196F3', marginLeft: '5px' }}>({item.unassignedStock} unasgn)</span>}
                      </div>
                      {item.totalStock < item.minStockLevel && (
                        <span style={{ background: '#fff3e0', color: '#ef6c00', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Low Stock</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </>
      ) : (
        
        <main style={{ flex: 1, padding: '40px', background: '#f5f5f5', overflowY: 'auto' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2>Register New Product</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>Enter product details to add it to the warehouse system catalog.</p>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Product Name</label>
                  <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>SKU (Unique Identifier)</label>
                  <input type="text" required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Description</label>
                <textarea rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Price ($)</label>
                  <input type="number" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Weight (kg)</label>
                  <input type="number" step="0.01" required value={newProduct.weight} onChange={e => setNewProduct({...newProduct, weight: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Min. Stock Level</label>
                  <input type="number" required value={newProduct.minStockLevel} onChange={e => setNewProduct({...newProduct, minStockLevel: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                <button type="submit" style={{ flex: 1, padding: '15px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Create Product
                </button>
                <button type="button" onClick={() => setActiveTab('catalog')} style={{ flex: 1, padding: '15px', background: '#eee', color: '#333', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      )}
    </div>
  );
};
