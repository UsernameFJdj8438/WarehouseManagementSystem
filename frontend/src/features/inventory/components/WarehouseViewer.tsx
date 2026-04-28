import React, { useEffect, useState } from 'react';
import { Shelf, Employee, WorkOrder, EmployeeRole, WorkOrderStatus, LPN, Bin } from '../types/inventory.types';
import { warehouseApi } from '../services/warehouseApi';

export const WarehouseViewer: React.FC = () => {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [loading, setLoading] = useState(true);
  
  
  const [movementSource, setMovementSource] = useState<{ bin: Bin, lpn: LPN } | null>(null);
  const [assignedWorkerId, setAssignedWorkerId] = useState<number>(0);

  
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [isEditingShelf, setIsEditingShelf] = useState(false);
  const [newShelfLabel, setNewShelfLabel] = useState('');
  const [newShelfType, setNewShelfType] = useState<'Standard' | 'Dock'>('Standard');
  
  
  const [editShelfLabel, setEditShelfLabel] = useState('');
  const [editShelfX, setEditShelfX] = useState(0);
  const [editShelfY, setEditShelfY] = useState(0);

  const fetchData = async () => {
    try {
      const [shelfData, employeeData, woData] = await Promise.all([
        warehouseApi.getShelves(),
        warehouseApi.getEmployees(),
        warehouseApi.getWorkOrders()
      ]);
      setShelves(shelfData);
      setEmployees(employeeData);
      setWorkOrders(woData);
      if (!currentUser && employeeData.length > 0) {
        setCurrentUser(employeeData[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddShelf = async () => {
    if (!newShelfLabel) return;
    
    
    const lastShelf = shelves[shelves.length - 1];
    const newX = 500; 
    const newY = lastShelf ? lastShelf.y + 50 : 100;

    const newShelf = {
      label: newShelfLabel,
      x: newShelfType === 'Dock' ? 550 : newX,
      y: newShelfType === 'Dock' ? 10 : newY,
      width: newShelfType === 'Dock' ? 200 : 120,
      height: newShelfType === 'Dock' ? 60 : 40,
      binCount: newShelfType === 'Dock' ? 8 : 4,
      isLoadingDock: newShelfType === 'Dock'
    };

    try {
      await warehouseApi.createShelf(newShelf);
      setNewShelfLabel('');
      setIsAddingShelf(false);
      fetchData();
    } catch (err) {
      alert('Failed to add shelf');
    }
  };

  const handleShelfClick = (shelf: Shelf) => {
    setSelectedShelf(shelf);
    setSelectedBin(null);
    setIsEditingShelf(false);
    
    setEditShelfLabel(shelf.label);
    setEditShelfX(shelf.x);
    setEditShelfY(shelf.y);
  };

  const handleUpdateShelf = async () => {
    if (!selectedShelf) return;
    const updatedShelf = {
      ...selectedShelf,
      label: editShelfLabel,
      x: editShelfX,
      y: editShelfY
    };
    try {
      await warehouseApi.updateShelf(updatedShelf);
      setIsEditingShelf(false);
      fetchData();
    } catch (err) {
      alert('Failed to update shelf');
    }
  };

  const handleCreateWorkOrder = async (targetBin: Bin) => {
    if (!movementSource) return;
    
    if (!assignedWorkerId) {
      alert('Please select a worker to assign this task to.');
      return;
    }

    try {
      await warehouseApi.createWorkOrder({
        lpnid: movementSource.lpn.lpnid,
        fromBinID: movementSource.bin.binID,
        toBinID: targetBin.binID,
        assignedEmployeeID: assignedWorkerId
      });
      setMovementSource(null);
      setAssignedWorkerId(0);
      fetchData();
      alert('Work Order Created Successfully!');
    } catch (err) {
      alert('Failed to create work order');
    }
  };

  const handleUpdateWOStatus = async (woId: number, status: WorkOrderStatus) => {
    try {
      await warehouseApi.updateWorkOrderStatus(woId, status);
      fetchData();
    } catch (err) {
      alert('Failed to update work order');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Professional WMS Environment...</div>;

  const activeWO = workOrders.find(wo => wo.assignedEmployeeID === currentUser?.employeeID && wo.status !== WorkOrderStatus.Completed);
  
  
  const getShelfIdFromBinId = (binId: number) => {
    for (const shelf of shelves) {
      if (shelf.bins?.some(b => b.binID === binId)) return shelf.shelfID;
    }
    return null;
  };

  const activeTaskSourceShelf = activeWO?.status === WorkOrderStatus.Pending ? getShelfIdFromBinId(activeWO.fromBinID) : null;
  const activeTaskDestShelf = activeWO?.status === WorkOrderStatus.InProgress ? getShelfIdFromBinId(activeWO.toBinID) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', padding: '20px', gap: '20px', background: '#f5f7fa', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, color: '#1a365d', fontSize: '1.5rem' }}>Warehouse Control Center</h2>
          <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Active Session:</span>
            <select 
              value={currentUser?.employeeID || ''} 
              onChange={(e) => setCurrentUser(employees.find(emp => emp.employeeID === Number(e.target.value)) || null)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
            >
              {employees.map(emp => (
                <option key={emp.employeeID} value={emp.employeeID}>{emp.name} ({EmployeeRole[emp.role]})</option>
              ))}
            </select>
          </div>
        </div>
        
        {currentUser?.role === EmployeeRole.Worker && activeWO && (
          <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', padding: '8px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#2b6cb0', fontWeight: 600, fontSize: '0.9rem' }}>
              Current Task: Move {activeWO.lpnid}
            </span>
            <button 
              onClick={() => handleUpdateWOStatus(activeWO.workOrderID, activeWO.status === WorkOrderStatus.Pending ? WorkOrderStatus.InProgress : WorkOrderStatus.Completed)}
              style={{ padding: '5px 15px', background: activeWO.status === WorkOrderStatus.Pending ? '#f59e0b' : '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            >
              {activeWO.status === WorkOrderStatus.Pending ? 'Confirm Pick' : 'Confirm Drop-off'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0 }}>
        {}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#334155' }}>2D Storage Visualization</h3>
            {movementSource && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '6px 18px', borderRadius: '24px', fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                <span>Moving: {movementSource.lpn.lpnid}</span>
                <div style={{ width: '1px', height: '16px', background: '#fde68a' }} />
                <span>Assign to:</span>
                <select 
                  value={assignedWorkerId}
                  onChange={(e) => setAssignedWorkerId(Number(e.target.value))}
                  style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a', background: 'white', fontSize: '0.8rem', color: '#92400e', cursor: 'pointer' }}
                >
                  <option value={0}>Choose Worker...</option>
                  {employees.filter(e => e.role === EmployeeRole.Worker).map(emp => (
                    <option key={emp.employeeID} value={emp.employeeID}>{emp.name}</option>
                  ))}
                </select>
                <button 
                  onClick={() => { setMovementSource(null); setAssignedWorkerId(0); }} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '1rem', fontWeight: 'bold', marginLeft: '4px' }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, border: '1px solid #f1f5f9', borderRadius: '8px', position: 'relative', overflow: 'hidden', background: '#f8fafc' }}>
            <svg width="100%" height="100%" viewBox="0 0 1000 600">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {shelves.map(shelf => {
                const isSelected = selectedShelf?.shelfID === shelf.shelfID;
                const isManagerSource = movementSource?.bin.shelfID === shelf.shelfID;
                
                
                const isWorkerPickup = activeTaskSourceShelf === shelf.shelfID;
                const isWorkerDropoff = activeTaskDestShelf === shelf.shelfID;

                
                const hasOtherTask = workOrders.some(wo => 
                  wo.status !== WorkOrderStatus.Completed && 
                  (getShelfIdFromBinId(wo.fromBinID) === shelf.shelfID || getShelfIdFromBinId(wo.toBinID) === shelf.shelfID)
                );

                let strokeColor = '#cbd5e1';
                let strokeWidth = "1.5";
                let fillColor = isSelected ? '#f0f9ff' : (shelf.isLoadingDock ? '#fffbeb' : 'white');

                if (isSelected) {
                   strokeColor = '#0ea5e9';
                   strokeWidth = "3";
                } else if (isManagerSource || isWorkerPickup) {
                   strokeColor = '#f59e0b'; 
                   strokeWidth = "3";
                   fillColor = '#fff7ed';
                } else if (isWorkerDropoff) {
                   strokeColor = '#0ea5e9'; 
                   strokeWidth = "3";
                   fillColor = '#f0f9ff';
                } else if (hasOtherTask) {
                   strokeColor = '#10b981'; 
                }

                return (
                  <g key={shelf.shelfID} onClick={() => handleShelfClick(shelf)} style={{ cursor: 'pointer' }}>
                    <rect 
                      x={shelf.x} 
                      y={shelf.y} 
                      width={shelf.width} 
                      height={shelf.height} 
                      fill={fillColor} 
                      stroke={strokeColor} 
                      strokeWidth={strokeWidth} 
                      rx="6" 
                    />
                    <text 
                      x={shelf.x + shelf.width / 2} 
                      y={shelf.y + shelf.height / 2} 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      fill={shelf.isLoadingDock ? '#92400e' : '#1e293b'} 
                      fontSize="12" 
                      fontWeight="700"
                    >
                      {shelf.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {}
        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: 'white', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          {selectedShelf ? (
            <div>
              <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1e293b' }}>Shelf: {selectedShelf.label}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedShelf.isLoadingDock ? 'Loading Dock Area' : 'Standard Storage'}</span>
                </div>
                {currentUser?.role === EmployeeRole.Manager && (
                  <button 
                    onClick={() => setIsEditingShelf(!isEditingShelf)}
                    style={{ padding: '4px 8px', fontSize: '0.75rem', background: isEditingShelf ? '#cbd5e1' : '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {isEditingShelf ? 'Cancel' : 'Edit'}
                  </button>
                )}
              </div>
              
              {isEditingShelf ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Edit Shelf Position</h4>
                  <div>
                    <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Label</label>
                    <input type="text" value={editShelfLabel} onChange={e => setEditShelfLabel(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>X Pos</label>
                      <input type="number" value={editShelfX} onChange={e => setEditShelfX(Number(e.target.value))} style={{ width: '100%', padding: '6px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Y Pos</label>
                      <input type="number" value={editShelfY} onChange={e => setEditShelfY(Number(e.target.value))} style={{ width: '100%', padding: '6px' }} />
                    </div>
                  </div>
                  <button onClick={handleUpdateShelf} style={{ padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save Changes</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {(selectedShelf.bins ?? []).map(bin => (
                    <div key={bin.binID} 
                      onClick={() => setSelectedBin(bin)}
                      style={{ 
                        padding: '15px', 
                        background: selectedBin?.binID === bin.binID ? '#f8fafc' : 'white', 
                        border: '1px solid',
                        borderColor: selectedBin?.binID === bin.binID ? '#0ea5e9' : '#e2e8f0',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>Bin Position {bin.position}</span>
                        {movementSource && currentUser?.role === EmployeeRole.Manager && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCreateWorkOrder(bin); }}
                            style={{ padding: '4px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Set Destination
                          </button>
                        )}
                      </div>

                      {(bin.lpNs ?? []).length > 0 ? (
                        (bin.lpNs ?? []).map(lpn => (
                          <div key={lpn.lpnid} style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>LPN: {lpn.lpnid}</span>
                              {currentUser?.role === EmployeeRole.Manager && !movementSource && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setMovementSource({ bin, lpn }); }}
                                  style={{ padding: '2px 8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem' }}
                                >
                                  Move
                                </button>
                              )}
                            </div>
                            {(lpn.contents ?? []).map(content => (
                              <div key={content.lpnContentID} style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {content.product?.name} x {content.quantity}
                              </div>
                            ))}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Empty Bin</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', background: '#f1f5f9', borderRadius: '12px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#cbd5e1' }}>WMS</div>
              <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>Warehouse Ready</h4>
              <p style={{ fontSize: '0.9rem', maxWidth: '200px', marginBottom: '20px' }}>Select a storage shelf to view LPNs and manage movements.</p>
              
              {currentUser?.role === EmployeeRole.Manager && (
                <div style={{ width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'left' }}>
                  <h4 style={{ color: '#1e293b', marginBottom: '15px' }}>Management Tools</h4>
                  {isAddingShelf ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Shelf Label (e.g. C1)" 
                        value={newShelfLabel}
                        onChange={e => setNewShelfLabel(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <select 
                        value={newShelfType}
                        onChange={e => setNewShelfType(e.target.value as any)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="Standard">Standard Shelf</option>
                        <option value="Dock">Loading Dock</option>
                      </select>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleAddShelf} style={{ flex: 1, padding: '8px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create</button>
                        <button onClick={() => setIsAddingShelf(false)} style={{ flex: 1, padding: '8px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingShelf(true)}
                      style={{ width: '100%', padding: '10px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Add New Storage/Dock
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
